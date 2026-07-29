import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { formatNotificationContent } from "@/src/notifications/NotificationFormatter";
import {
  MONITOR_STATUS_CHANNEL_ID,
  type NotificationDeepLinkData,
  type NotificationPayload,
} from "@/src/notifications/NotificationTypes";

export type NotificationResponseHandler = (
  data: NotificationDeepLinkData,
) => void;

export type NotificationPermissionState =
  | "granted"
  | "denied"
  | "undetermined";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function parseDeepLinkData(
  data: Record<string, unknown> | undefined,
): NotificationDeepLinkData | null {
  if (!data) {
    return null;
  }

  const serverId =
    typeof data.serverId === "string"
      ? data.serverId
      : null;

  const monitorIdRaw = data.monitorId;
  const monitorId =
    typeof monitorIdRaw === "number"
      ? monitorIdRaw
      : typeof monitorIdRaw === "string"
        ? Number(monitorIdRaw)
        : NaN;

  const url =
    typeof data.url === "string"
      ? data.url
      : null;

  if (
    !serverId ||
    !Number.isFinite(monitorId) ||
    !url
  ) {
    return null;
  }

  return {
    serverId,
    monitorId,
    url,
  };
}

export class NotificationService {
  private responseSubscription:
    | Notifications.EventSubscription
    | null = null;

  private channelReady = false;

  private isPermissionGranted(
    permissions: Notifications.NotificationPermissionsStatus,
  ): boolean {
    return (
      permissions.granted ||
      permissions.ios?.status ===
        Notifications.IosAuthorizationStatus
          .PROVISIONAL
    );
  }

  async getPermissionState(): Promise<NotificationPermissionState> {
    if (Platform.OS === "web") {
      return "denied";
    }

    const permissions =
      await Notifications.getPermissionsAsync();

    if (this.isPermissionGranted(permissions)) {
      await this.ensureAndroidChannel();
      return "granted";
    }

    return permissions.status ===
      Notifications.PermissionStatus.DENIED
      ? "denied"
      : "undetermined";
  }

  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === "web") {
      return false;
    }

    const current =
      await Notifications.getPermissionsAsync();

    if (this.isPermissionGranted(current)) {
      await this.ensureAndroidChannel();
      return true;
    }

    const requested =
      await Notifications.requestPermissionsAsync(
        {
          ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
          },
        },
      );

    const granted =
      this.isPermissionGranted(requested);

    if (granted) {
      await this.ensureAndroidChannel();
    }

    return granted;
  }

  async ensureAndroidChannel(): Promise<void> {
    if (
      Platform.OS !== "android" ||
      this.channelReady
    ) {
      return;
    }

    await Notifications.setNotificationChannelAsync(
      MONITOR_STATUS_CHANNEL_ID,
      {
        name: "Estado de monitores",
        importance:
          Notifications.AndroidImportance
            .HIGH,
        vibrationPattern: [
          0, 250, 250, 250,
        ],
        lightColor: "#5CDD8B",
        sound: "default",
      },
    );

    this.channelReady = true;
  }

  async presentLocal(
    payload: NotificationPayload,
  ): Promise<string | null> {
    if (Platform.OS === "web") {
      return null;
    }

    const hasPermission =
      (await this.getPermissionState()) ===
      "granted";

    if (!hasPermission) {
      return null;
    }

    const content =
      formatNotificationContent(payload);

    return Notifications.scheduleNotificationAsync(
      {
        content: {
          title: content.title,
          body: content.body,
          sound: "default",
          data: {
            serverId: payload.serverId,
            monitorId: payload.monitorId,
            url: payload.deepLink,
            type: payload.type,
            notificationId: payload.id,
          },
          ...(Platform.OS === "android"
            ? {
                channelId:
                  MONITOR_STATUS_CHANNEL_ID,
              }
            : {}),
        },
        trigger: null,
      },
    );
  }

  addResponseListener(
    handler: NotificationResponseHandler,
  ): () => void {
    this.responseSubscription?.remove();

    this.responseSubscription =
      Notifications.addNotificationResponseReceivedListener(
        (response) => {
          const data = parseDeepLinkData(
            response.notification.request
              .content.data as
              | Record<string, unknown>
              | undefined,
          );

          if (data) {
            handler(data);
          }
        },
      );

    return () => {
      this.responseSubscription?.remove();
      this.responseSubscription = null;
    };
  }

  async getLastResponseDeepLink(): Promise<NotificationDeepLinkData | null> {
    const response =
      await Notifications.getLastNotificationResponseAsync();

    if (!response) {
      return null;
    }

    return parseDeepLinkData(
      response.notification.request.content
        .data as
        | Record<string, unknown>
        | undefined,
    );
  }
}

export const notificationService =
  new NotificationService();
