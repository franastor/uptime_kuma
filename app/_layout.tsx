import { Stack, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  useEffect,
  useRef,
  useState,
} from "react";
import { AppState, type AppStateStatus } from "react-native";

import { useMonitorStore } from "@/src/modules/monitor/store/monitor.store";
import { useHeartbeatHistoryStore } from "@/src/modules/monitor/store/heartbeatHistory.store";
import { useMonitorPreferencesStore } from "@/src/modules/monitor/store/monitorPreferences.store";
import { useMonitorStatsStore } from "@/src/modules/monitor/store/monitorStats.store";
import { useServerStore } from "@/src/modules/servers/store/server.store";
import { useAppSettingsStore } from "@/src/modules/settings/store/appSettings.store";
import { useSubscriptionStore } from "@/src/modules/subscription/store/subscription.store";
import { useTimelineStore } from "@/src/modules/timeline/store/timeline.store";
import { VaultLockOverlay } from "@/src/modules/vault/components/VaultLockOverlay";
import { useVaultStore } from "@/src/modules/vault/store/vault.store";
import { kumaService } from "@/src/core/services/KumaService";
import {
  notificationService,
  type NotificationDeepLinkData,
} from "@/src/notifications";
import { registerPushToken } from "@/src/notifications/PushRegistration";
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

function reconnectActiveServer(): Promise<void> {
  const { servers, activeServerId } =
    useServerStore.getState();

  if (!activeServerId) {
    return Promise.resolve();
  }

  const server = servers.find(
    (item) => item.id === activeServerId,
  );

  const isBusy =
    server?.connectionStatus ===
      "connecting" ||
    server?.connectionStatus ===
      "reconnecting" ||
    server?.connectionStatus ===
      "connected" ||
    kumaService.isConnected(
      server?.id ?? "",
    );

  if (
    !server ||
    isBusy
  ) {
    return Promise.resolve();
  }

  return kumaService
    .connect(server.id)
    .then(() => undefined)
    .catch(() => {
      // Silencioso: si requiere 2FA o credenciales,
      // el usuario pulsa el servidor como siempre.
    });
}

export default function RootLayout() {
  const hydrateSubscription =
    useSubscriptionStore(
      (state) => state.hydrate,
    );
  const hydrateVault = useVaultStore(
    (state) => state.hydrate,
  );
  const markBackground = useVaultStore(
    (state) => state.markBackground,
  );
  const maybeLockFromTimeout = useVaultStore(
    (state) => state.maybeLockFromTimeout,
  );
  const lockTimeoutMinutes = useAppSettingsStore(
    (state) => state.lockTimeoutMinutes,
  );
  const handledColdStart =
    useRef(false);
  const appState = useRef<AppStateStatus>(
    AppState.currentState,
  );
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
    void useAppSettingsStore.getState().hydrate();
    void useMonitorPreferencesStore
      .getState()
      .hydrate();
    void hydrateVault();
  }, [hydrateVault]);

  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      (nextState) => {
        const previous = appState.current;
        appState.current = nextState;

        if (
          previous === "active" &&
          nextState.match(/inactive|background/)
        ) {
          markBackground();
          return;
        }

        if (
          previous.match(/inactive|background/) &&
          nextState === "active"
        ) {
          maybeLockFromTimeout(lockTimeoutMinutes);
          void reconnectActiveServer();
          // Si el permiso ya está concedido, (re)registra el token push
          // al volver a la app (p.ej. tras activarlo en ajustes del sistema).
          void registerPushToken();
        }
      },
    );

    return () => {
      subscription.remove();
    };
  }, [
    lockTimeoutMinutes,
    markBackground,
    maybeLockFromTimeout,
  ]);

  useEffect(() => {
    void notificationService
      .getPermissionState()
      .then((state) => {
        setShowPermissionModal(
          state === "undetermined",
        );
        if (state === "granted") {
          void registerPushToken();
        }
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
      const granted =
        await notificationService.requestPermissions();
      if (granted) {
        void registerPushToken();
      }
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

      <VaultLockOverlay />

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
