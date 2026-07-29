import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

import {
  buildHeartbeatRecordKey,
  MAX_HEARTBEATS_PER_MONITOR,
  type MonitorHeartbeatRecord,
} from "@/src/modules/monitor/types/heartbeatHistory";

const HEARTBEAT_HISTORY_STORAGE_KEY =
  "kumapulse.monitor-heartbeats.v2";
const LEGACY_STORAGE_KEYS = [
  "kumapulse.monitor-heartbeats",
];
const PERSIST_DEBOUNCE_MS = 1_500;

type HeartbeatHistoryState = {
  recordsByMonitor: Record<
    string,
    MonitorHeartbeatRecord[]
  >;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  append: (
    records: MonitorHeartbeatRecord[],
  ) => void;
  clearServer: (serverId: string) => void;
  clearAll: () => void;
};

let persistTimeoutId: ReturnType<
  typeof setTimeout
> | null = null;

function sortAndLimit(
  records: MonitorHeartbeatRecord[],
): MonitorHeartbeatRecord[] {
  const byId = new Map<
    string,
    MonitorHeartbeatRecord
  >();

  for (const record of records) {
    byId.set(record.id, record);
  }

  return [...byId.values()]
    .sort(
      (left, right) =>
        right.createdAt - left.createdAt,
    )
    .slice(0, MAX_HEARTBEATS_PER_MONITOR);
}

function persistNow(): void {
  void AsyncStorage.setItem(
    HEARTBEAT_HISTORY_STORAGE_KEY,
    JSON.stringify(
      useHeartbeatHistoryStore.getState()
        .recordsByMonitor,
    ),
  ).catch(() => {
    // La caché no debe interrumpir el tiempo real.
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

function isHeartbeatRecord(
  value: unknown,
): value is MonitorHeartbeatRecord {
  if (
    typeof value !== "object" ||
    value === null
  ) {
    return false;
  }

  const candidate = value as Record<
    string,
    unknown
  >;

  return (
    typeof candidate.id === "string" &&
    typeof candidate.serverId === "string" &&
    typeof candidate.monitorId === "number" &&
    typeof candidate.timestamp === "string" &&
    typeof candidate.createdAt === "number"
  );
}

export const useHeartbeatHistoryStore =
  create<HeartbeatHistoryState>((set, get) => ({
    recordsByMonitor: {},
    hydrated: false,

    hydrate: async () => {
      if (get().hydrated) {
        return;
      }

      void AsyncStorage.multiRemove(
        LEGACY_STORAGE_KEYS,
      ).catch(() => {
        // Limpieza best-effort de la caché antigua.
      });

      try {
        const stored =
          await AsyncStorage.getItem(
            HEARTBEAT_HISTORY_STORAGE_KEY,
          );
        const parsed = stored
          ? (JSON.parse(stored) as Record<
              string,
              unknown
            >)
          : {};
        const recordsByMonitor: Record<
          string,
          MonitorHeartbeatRecord[]
        > = {};

        for (const [key, value] of Object.entries(
          parsed,
        )) {
          if (!Array.isArray(value)) {
            continue;
          }

          recordsByMonitor[key] = sortAndLimit(
            value.filter(isHeartbeatRecord),
          );
        }

        set((state) => {
          const merged = {
            ...recordsByMonitor,
          };

          for (const [
            key,
            records,
          ] of Object.entries(
            state.recordsByMonitor,
          )) {
            merged[key] = sortAndLimit([
              ...(merged[key] ?? []),
              ...records,
            ]);
          }

          return {
            recordsByMonitor: merged,
            hydrated: true,
          };
        });
      } catch {
        set({ hydrated: true });
      }
    },

    append: (incoming) => {
      if (incoming.length === 0) {
        return;
      }

      set((state) => {
        const next = {
          ...state.recordsByMonitor,
        };
        const grouped = new Map<
          string,
          MonitorHeartbeatRecord[]
        >();

        for (const record of incoming) {
          const key = buildHeartbeatRecordKey(
            record.serverId,
            record.monitorId,
          );
          const records = grouped.get(key) ?? [];
          records.push(record);
          grouped.set(key, records);
        }

        for (const [
          key,
          records,
        ] of grouped.entries()) {
          next[key] = sortAndLimit([
            ...(next[key] ?? []),
            ...records,
          ]);
        }

        return { recordsByMonitor: next };
      });

      schedulePersist();
    },

    clearServer: (serverId) => {
      set((state) => ({
        recordsByMonitor: Object.fromEntries(
          Object.entries(
            state.recordsByMonitor,
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

      set({ recordsByMonitor: {} });
      void AsyncStorage.removeItem(
        HEARTBEAT_HISTORY_STORAGE_KEY,
      );
    },
  }));
