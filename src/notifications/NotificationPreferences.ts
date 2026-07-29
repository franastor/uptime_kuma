import AsyncStorage from "@react-native-async-storage/async-storage";

const PREFERENCES_STORAGE_KEY =
  "kumapulse.notification.preferences";

export type NotificationPreferences = {
  enabled: boolean;
};

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences =
  {
    enabled: true,
  };

export async function loadNotificationPreferences(): Promise<NotificationPreferences> {
  try {
    const storedValue =
      await AsyncStorage.getItem(
        PREFERENCES_STORAGE_KEY,
      );

    if (!storedValue) {
      return DEFAULT_NOTIFICATION_PREFERENCES;
    }

    const parsed = JSON.parse(
      storedValue,
    ) as Partial<NotificationPreferences>;

    return {
      enabled:
        typeof parsed.enabled ===
        "boolean"
          ? parsed.enabled
          : DEFAULT_NOTIFICATION_PREFERENCES.enabled,
    };
  } catch {
    return DEFAULT_NOTIFICATION_PREFERENCES;
  }
}

export async function saveNotificationPreferences(
  preferences: NotificationPreferences,
): Promise<void> {
  await AsyncStorage.setItem(
    PREFERENCES_STORAGE_KEY,
    JSON.stringify(preferences),
  );
}
