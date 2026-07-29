import AsyncStorage from "@react-native-async-storage/async-storage";

const PREFERENCES_STORAGE_KEY =
  "kumapulse.notification.preferences";

export type NotificationPreferences = {
  enabled: boolean;
  sound: boolean;
  vibration: boolean;
  tagFilterEnabled: boolean;
  selectedTags: string[];
};

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences =
  {
    enabled: true,
    sound: true,
    vibration: true,
    tagFilterEnabled: false,
    selectedTags: [],
  };

function normalizeSelectedTags(
  value: unknown,
): string[] {
  if (!Array.isArray(value)) {
    return DEFAULT_NOTIFICATION_PREFERENCES.selectedTags;
  }

  return value
    .filter(
      (tag): tag is string =>
        typeof tag === "string" &&
        tag.trim().length > 0,
    )
    .map((tag) => tag.trim());
}

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
        typeof parsed.enabled === "boolean"
          ? parsed.enabled
          : DEFAULT_NOTIFICATION_PREFERENCES.enabled,
      sound:
        typeof parsed.sound === "boolean"
          ? parsed.sound
          : DEFAULT_NOTIFICATION_PREFERENCES.sound,
      vibration:
        typeof parsed.vibration === "boolean"
          ? parsed.vibration
          : DEFAULT_NOTIFICATION_PREFERENCES.vibration,
      tagFilterEnabled:
        typeof parsed.tagFilterEnabled ===
        "boolean"
          ? parsed.tagFilterEnabled
          : DEFAULT_NOTIFICATION_PREFERENCES.tagFilterEnabled,
      selectedTags: normalizeSelectedTags(
        parsed.selectedTags,
      ),
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

export function monitorMatchesTagFilter(
  monitorTags: { name: string }[],
  preferences: NotificationPreferences,
): boolean {
  if (!preferences.tagFilterEnabled) {
    return true;
  }

  if (preferences.selectedTags.length === 0) {
    return false;
  }

  const selected = new Set(
    preferences.selectedTags.map((tag) =>
      tag.toLocaleLowerCase("es-ES"),
    ),
  );

  return monitorTags.some((tag) =>
    selected.has(
      tag.name.toLocaleLowerCase("es-ES"),
    ),
  );
}
