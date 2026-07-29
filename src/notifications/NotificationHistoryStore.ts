import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  MAX_NOTIFICATION_HISTORY,
  type NotificationPayload,
} from "@/src/notifications/NotificationTypes";

const HISTORY_STORAGE_KEY =
  "kumapulse.notification.history";

export type NotificationHistoryItem =
  NotificationPayload;

export async function loadNotificationHistory(): Promise<
  NotificationHistoryItem[]
> {
  try {
    const storedValue =
      await AsyncStorage.getItem(
        HISTORY_STORAGE_KEY,
      );

    if (!storedValue) {
      return [];
    }

    const parsed = JSON.parse(
      storedValue,
    ) as NotificationHistoryItem[];

    return Array.isArray(parsed)
      ? parsed
      : [];
  } catch {
    return [];
  }
}

export async function appendNotificationHistory(
  item: NotificationHistoryItem,
): Promise<NotificationHistoryItem[]> {
  const current =
    await loadNotificationHistory();

  const next = [item, ...current].slice(
    0,
    MAX_NOTIFICATION_HISTORY,
  );

  await AsyncStorage.setItem(
    HISTORY_STORAGE_KEY,
    JSON.stringify(next),
  );

  return next;
}

export async function clearNotificationHistory(): Promise<void> {
  await AsyncStorage.removeItem(
    HISTORY_STORAGE_KEY,
  );
}
