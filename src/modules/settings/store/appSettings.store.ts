import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

import {
  DEFAULT_APP_SETTINGS,
  LEGACY_DEFAULT_SLA_KEY,
  clampSlaTarget,
  resolveSlaTarget,
  type AppSettings,
} from "@/src/modules/settings/types/appSettings";
import {
  applyLocale,
  type AppLocalePreference,
} from "@/src/shared/i18n";

const APP_SETTINGS_STORAGE_KEY =
  "kumapulse.app-settings.v2";
const LEGACY_STORAGE_KEYS = [
  "kumapulse.app-settings.v1",
];

type AppSettingsState = AppSettings & {
  hydrated: boolean;
  hydrate: () => Promise<void>;
  getSlaTarget: (serverId: string) => number;
  setSlaTarget: (
    serverId: string,
    value: number,
  ) => void;
  setLocale: (locale: AppLocalePreference) => void;
  setBiometricUnlockEnabled: (
    enabled: boolean,
  ) => void;
  setLockTimeoutMinutes: (minutes: number) => void;
  replaceSettings: (settings: AppSettings) => void;
  clearServer: (serverId: string) => void;
};

function normalizeLocale(
  value: unknown,
): AppLocalePreference {
  if (
    value === "system" ||
    value === "es" ||
    value === "en"
  ) {
    return value;
  }

  return DEFAULT_APP_SETTINGS.locale;
}

function normalizeSlaMap(
  value: unknown,
): Record<string, number> {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value)
  ) {
    return {};
  }

  const result: Record<string, number> = {};

  for (const [key, entry] of Object.entries(
    value as Record<string, unknown>,
  )) {
    if (
      typeof entry === "number" &&
      Number.isFinite(entry)
    ) {
      result[key] = clampSlaTarget(entry);
    }
  }

  return result;
}

function normalizeTimeout(value: unknown): number {
  if (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 0
  ) {
    return Math.round(value);
  }

  return DEFAULT_APP_SETTINGS.lockTimeoutMinutes;
}

function snapshot(state: AppSettings): AppSettings {
  return {
    slaTargetByServer: state.slaTargetByServer,
    locale: state.locale,
    biometricUnlockEnabled:
      state.biometricUnlockEnabled,
    lockTimeoutMinutes: state.lockTimeoutMinutes,
  };
}

function parseStoredSettings(
  value: unknown,
): AppSettings {
  if (
    typeof value !== "object" ||
    value === null
  ) {
    return { ...DEFAULT_APP_SETTINGS };
  }

  const candidate = value as Record<
    string,
    unknown
  >;

  if ("slaTargetByServer" in candidate) {
    return {
      slaTargetByServer: normalizeSlaMap(
        candidate.slaTargetByServer,
      ),
      locale: normalizeLocale(candidate.locale),
      biometricUnlockEnabled:
        typeof candidate.biometricUnlockEnabled ===
        "boolean"
          ? candidate.biometricUnlockEnabled
          : DEFAULT_APP_SETTINGS.biometricUnlockEnabled,
      lockTimeoutMinutes: normalizeTimeout(
        candidate.lockTimeoutMinutes,
      ),
    };
  }

  if (
    typeof candidate.slaTarget === "number" &&
    Number.isFinite(candidate.slaTarget)
  ) {
    return {
      slaTargetByServer: {
        [LEGACY_DEFAULT_SLA_KEY]: clampSlaTarget(
          candidate.slaTarget,
        ),
      },
      locale: normalizeLocale(candidate.locale),
      biometricUnlockEnabled:
        DEFAULT_APP_SETTINGS.biometricUnlockEnabled,
      lockTimeoutMinutes:
        DEFAULT_APP_SETTINGS.lockTimeoutMinutes,
    };
  }

  return { ...DEFAULT_APP_SETTINGS };
}

function persist(settings: AppSettings): void {
  void AsyncStorage.setItem(
    APP_SETTINGS_STORAGE_KEY,
    JSON.stringify(settings),
  ).catch(() => {
    // Los ajustes no deben tumbar la app.
  });
}

export const useAppSettingsStore =
  create<AppSettingsState>((set, get) => ({
    ...DEFAULT_APP_SETTINGS,
    hydrated: false,

    hydrate: async () => {
      if (get().hydrated) {
        return;
      }

      try {
        let stored = await AsyncStorage.getItem(
          APP_SETTINGS_STORAGE_KEY,
        );

        if (!stored) {
          for (const legacyKey of LEGACY_STORAGE_KEYS) {
            const legacy =
              await AsyncStorage.getItem(
                legacyKey,
              );

            if (legacy) {
              stored = legacy;
              void AsyncStorage.removeItem(
                legacyKey,
              );
              break;
            }
          }
        }

        const parsed = stored
          ? (JSON.parse(stored) as unknown)
          : null;
        const settings =
          parseStoredSettings(parsed);

        applyLocale(settings.locale);

        set({
          ...settings,
          hydrated: true,
        });

        if (stored) {
          persist(settings);
        }
      } catch {
        applyLocale(DEFAULT_APP_SETTINGS.locale);
        set({ hydrated: true });
      }
    },

    getSlaTarget: (serverId) =>
      resolveSlaTarget(
        get().slaTargetByServer,
        serverId,
      ),

    setSlaTarget: (serverId, value) => {
      const slaTarget = clampSlaTarget(value);
      const slaTargetByServer = {
        ...get().slaTargetByServer,
        [serverId]: slaTarget,
      };
      const next = snapshot({
        ...get(),
        slaTargetByServer,
      });

      set({ slaTargetByServer });
      persist(next);
    },

    setLocale: (locale) => {
      applyLocale(locale);
      const next = snapshot({
        ...get(),
        locale,
      });
      set({ locale });
      persist(next);
    },

    setBiometricUnlockEnabled: (enabled) => {
      const next = snapshot({
        ...get(),
        biometricUnlockEnabled: enabled,
      });
      set({ biometricUnlockEnabled: enabled });
      persist(next);
    },

    setLockTimeoutMinutes: (minutes) => {
      const lockTimeoutMinutes =
        normalizeTimeout(minutes);
      const next = snapshot({
        ...get(),
        lockTimeoutMinutes,
      });
      set({ lockTimeoutMinutes });
      persist(next);
    },

    replaceSettings: (settings) => {
      applyLocale(settings.locale);
      set({ ...settings });
      persist(snapshot(settings));
    },

    clearServer: (serverId) => {
      const nextMap = {
        ...get().slaTargetByServer,
      };
      delete nextMap[serverId];
      const next = snapshot({
        ...get(),
        slaTargetByServer: nextMap,
      });

      set({ slaTargetByServer: nextMap });
      persist(next);
    },
  }));
