import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

import {
  DEFAULT_APP_SETTINGS,
  LEGACY_DEFAULT_SLA_KEY,
  clampSlaTarget,
  resolveSlaTarget,
  type AppSettings,
} from "@/src/modules/settings/types/appSettings";

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
  clearServer: (serverId: string) => void;
};

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

        set({
          ...settings,
          hydrated: true,
        });

        if (stored) {
          persist(settings);
        }
      } catch {
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

      set({ slaTargetByServer });
      persist({ slaTargetByServer });
    },

    clearServer: (serverId) => {
      const next = {
        ...get().slaTargetByServer,
      };
      delete next[serverId];

      set({ slaTargetByServer: next });
      persist({ slaTargetByServer: next });
    },
  }));
