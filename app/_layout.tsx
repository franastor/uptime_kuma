import { Stack, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  useEffect,
  useRef,
  useState,
} from "react";

import { useMonitorStore } from "@/src/modules/monitor/store/monitor.store";
import { useHeartbeatHistoryStore } from "@/src/modules/monitor/store/heartbeatHistory.store";
import { useMonitorStatsStore } from "@/src/modules/monitor/store/monitorStats.store";
import { useSubscriptionStore } from "@/src/modules/subscription/store/subscription.store";
import { useTimelineStore } from "@/src/modules/timeline/store/timeline.store";
import {
  notificationService,
  type NotificationDeepLinkData,
} from "@/src/notifications";
import { ConfirmModal } from "@/src/shared/components/ConfirmModal";
import { colors } from "@/src/shared/theme";

function navigateFromNotification(
  data: NotificationDeepLinkData,
): void {
  router.push({
    pathname:
      "/monitor/[serverId]/[monitorId]",
    params: {
      serverId: data.serverId,
      monitorId: String(data.monitorId),
    },
  });
}

export default function RootLayout() {
  const hydrateSubscription =
    useSubscriptionStore(
      (state) => state.hydrate,
    );
  const handledColdStart =
    useRef(false);
  const [showPermissionModal, setShowPermissionModal] =
    useState(false);
  const [requestingPermission, setRequestingPermission] =
    useState(false);

  useEffect(() => {
    void hydrateSubscription();
  }, [hydrateSubscription]);

  useEffect(() => {
    void useTimelineStore.getState().hydrate();
    void useMonitorStore.getState().hydrate();
    void useHeartbeatHistoryStore
      .getState()
      .hydrate();
    void useMonitorStatsStore
      .getState()
      .hydrate();
  }, []);

  useEffect(() => {
    void notificationService
      .getPermissionState()
      .then((state) => {
        setShowPermissionModal(
          state === "undetermined",
        );
      })
      .catch(() => {
        setShowPermissionModal(false);
      });

    const removeResponseListener =
      notificationService.addResponseListener(
        navigateFromNotification,
      );

    if (!handledColdStart.current) {
      handledColdStart.current = true;

      void notificationService
        .getLastResponseDeepLink()
        .then((data) => {
          if (data) {
            navigateFromNotification(data);
          }
        });
    }

    return () => {
      removeResponseListener();
    };
  }, []);

  async function handleRequestNotifications(): Promise<void> {
    setRequestingPermission(true);

    try {
      await notificationService.requestPermissions();
    } catch {
      // The native prompt can be unavailable in
      // unsupported clients such as Expo Go.
    } finally {
      setRequestingPermission(false);
      setShowPermissionModal(false);
    }
  }

  return (
    <>
      <StatusBar style="light" />

      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: colors.background,
          },
          animation: "fade",
        }}
      />

      <ConfirmModal
        visible={showPermissionModal}
        title="Avisos en tiempo real"
        description="KumaPulse puede avisarte cuando un monitor se cae o vuelve a estar operativo. Android te pedirá permiso en el siguiente paso."
        confirmLabel="Activar avisos"
        cancelLabel="Ahora no"
        loading={requestingPermission}
        onConfirm={() => {
          void handleRequestNotifications();
        }}
        onCancel={() => {
          setShowPermissionModal(false);
        }}
      />
    </>
  );
}
