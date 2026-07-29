import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

const FAVORITES_STORAGE_KEY =
  "uptime-kuma-monitor-favorites";

interface MonitorPreferencesState {
  favoriteIdsByServer: Record<string, number[]>;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  isFavorite: (
    serverId: string,
    monitorId: number,
  ) => boolean;
  toggleFavorite: (
    serverId: string,
    monitorId: number,
  ) => Promise<void>;
  replaceFavorites: (
    favorites: Record<string, number[]>,
  ) => Promise<void>;
}

async function persistFavorites(
  favorites: Record<string, number[]>,
): Promise<void> {
  await AsyncStorage.setItem(
    FAVORITES_STORAGE_KEY,
    JSON.stringify(favorites),
  );
}

export const useMonitorPreferencesStore =
  create<MonitorPreferencesState>((set, get) => ({
    favoriteIdsByServer: {},
    hydrated: false,

    hydrate: async () => {
      if (get().hydrated) {
        return;
      }

      try {
        const storedValue = await AsyncStorage.getItem(
          FAVORITES_STORAGE_KEY,
        );

        const parsedValue = storedValue
          ? (JSON.parse(storedValue) as Record<
              string,
              number[]
            >)
          : {};

        set({
          favoriteIdsByServer: parsedValue,
          hydrated: true,
        });
      } catch {
        set({ hydrated: true });
      }
    },

    isFavorite: (serverId, monitorId) =>
      get().favoriteIdsByServer[serverId]?.includes(
        monitorId,
      ) ?? false,

    toggleFavorite: async (serverId, monitorId) => {
      const currentFavorites =
        get().favoriteIdsByServer[serverId] ?? [];
      const exists = currentFavorites.includes(monitorId);
      const nextServerFavorites = exists
        ? currentFavorites.filter((id) => id !== monitorId)
        : [...currentFavorites, monitorId];
      const nextFavorites = {
        ...get().favoriteIdsByServer,
        [serverId]: nextServerFavorites,
      };

      set({ favoriteIdsByServer: nextFavorites });
      await persistFavorites(nextFavorites);
    },

    replaceFavorites: async (favorites) => {
      set({ favoriteIdsByServer: favorites });
      await persistFavorites(favorites);
    },
  }));
