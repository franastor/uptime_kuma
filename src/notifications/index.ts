export {
  formatNotificationBody,
  formatNotificationContent,
  formatNotificationTitle,
} from "@/src/notifications/NotificationFormatter";

export {
  appendNotificationHistory,
  clearNotificationHistory,
  loadNotificationHistory,
  type NotificationHistoryItem,
} from "@/src/notifications/NotificationHistoryStore";

export {
  notificationManager,
  NotificationManager,
  type HandleStatusChangeInput,
} from "@/src/notifications/NotificationManager";

export {
  DEFAULT_NOTIFICATION_PREFERENCES,
  loadNotificationPreferences,
  monitorMatchesTagFilter,
  saveNotificationPreferences,
  type NotificationPreferences,
} from "@/src/notifications/NotificationPreferences";

export {
  notificationService,
  NotificationService,
  type NotificationPermissionState,
  type NotificationResponseHandler,
  type PresentLocalOptions,
} from "@/src/notifications/NotificationService";

export {
  buildMonitorDeepLink,
  DEDUPE_WINDOW_MS,
  MAX_NOTIFICATION_HISTORY,
  MONITOR_STATUS_CHANNEL_ID,
  type NotificationDeepLinkData,
  type NotificationPayload,
  type NotificationType,
} from "@/src/notifications/NotificationTypes";
