import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

const MONITOR_STATS_STORAGE_KEY =
  "kumapulse.monitor-stats";
const PERSIST_DEBOUNCE_MS = 1_000;

export type MonitorStats = {
  averagePing24h: number | null;
  uptime24h: number | null;
  uptime30d: number | null;
  certificateDaysRemaining: number | null;
  certificateValid: boolean | null;
  updatedAt: number;
};

type MonitorStatsState = {
  statsByMonitor: Record<string, MonitorStats>;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  update: (
    serverId: string,
    monitorId: number,
    stats: Partial<
      Omit<MonitorStats, "updatedAt">
    >,
  ) => void;
  clearServer: (serverId: string) => void;
  clearAll: () => void;
};

let persistTimeoutId: ReturnType<
  typeof setTimeout
> | null = null;

export function buildMonitorStatsKey(
  serverId: string,
  monitorId: number,
): string {
  return `${serverId}:${monitorId}`;
}

function isMonitorStats(
  value: unknown,
): value is MonitorStats {
  if (
    typeof value !== "object" ||
    value === null
  ) {
    return false;
  }

  return (
    typeof (value as MonitorStats).updatedAt ===
    "number"
  );
}

function persistNow(): void {
  void AsyncStorage.setItem(
    MONITOR_STATS_STORAGE_KEY,
    JSON.stringify(
      useMonitorStatsStore.getState()
        .statsByMonitor,
    ),
  ).catch(() => {
    // La caché no debe afectar al socket.
  });
}

function schedulePersist(): void {
  if (persistTimeoutId !== null) {
    return;
  }

  persistTimeoutId = setTimeout(() => {
    persistTimeoutId = null;
    persistNow();
  }, PERSIST_DEBOUNCE_MS);
}

const EMPTY_STATS: Omit<
  MonitorStats,
  "updatedAt"
> = {
  averagePing24h: null,
  uptime24h: null,
  uptime30d: null,
  certificateDaysRemaining: null,
  certificateValid: null,
};

export const useMonitorStatsStore =
  create<MonitorStatsState>((set, get) => ({
    statsByMonitor: {},
    hydrated: false,

    hydrate: async () => {
      if (get().hydrated) {
        return;
      }

      try {
        const stored =
          await AsyncStorage.getItem(
            MONITOR_STATS_STORAGE_KEY,
          );
        const parsed = stored
          ? (JSON.parse(stored) as Record<
              string,
              unknown
            >)
          : {};
        const cached = Object.fromEntries(
          Object.entries(parsed).filter(
            (
              entry,
            ): entry is [string, MonitorStats] =>
              isMonitorStats(entry[1]),
          ),
        );

        set((state) => ({
          statsByMonitor: {
            ...cached,
            ...state.statsByMonitor,
          },
          hydrated: true,
        }));
      } catch {
        set({ hydrated: true });
      }
    },

    update: (
      serverId,
      monitorId,
      incoming,
    ) => {
      const key = buildMonitorStatsKey(
        serverId,
        monitorId,
      );

      set((state) => ({
        statsByMonitor: {
          ...state.statsByMonitor,
          [key]: {
            ...EMPTY_STATS,
            ...state.statsByMonitor[key],
            ...incoming,
            updatedAt: Date.now(),
          },
        },
      }));
      schedulePersist();
    },

    clearServer: (serverId) => {
      set((state) => ({
        statsByMonitor: Object.fromEntries(
          Object.entries(
            state.statsByMonitor,
          ).filter(
            ([key]) =>
              !key.startsWith(`${serverId}:`),
          ),
        ),
      }));
      schedulePersist();
    },

    clearAll: () => {
      if (persistTimeoutId !== null) {
        clearTimeout(persistTimeoutId);
        persistTimeoutId = null;
      }

      set({ statsByMonitor: {} });
      void AsyncStorage.removeItem(
        MONITOR_STATS_STORAGE_KEY,
      );
    },
  }));
