export type NotificationType =
  | "MONITOR_DOWN"
  | "MONITOR_UP";

export type NotificationPayload = {
  id: string;
  type: NotificationType;
  serverId: string;
  monitorId: number;
  monitorName: string;
  message: string | null;
  createdAt: number;
  deepLink: string;
  heartbeatAt: string;
};

export type NotificationDeepLinkData = {
  serverId: string;
  monitorId: number;
  url: string;
};

export const MONITOR_STATUS_CHANNEL_ID =
  "monitor-status";

export const MAX_NOTIFICATION_HISTORY = 100;

export const DEDUPE_WINDOW_MS = 30_000;

export function buildMonitorDeepLink(
  serverId: string,
  monitorId: number,
): string {
  return `kumapulse://monitor/${serverId}?monitorId=${monitorId}`;
}
