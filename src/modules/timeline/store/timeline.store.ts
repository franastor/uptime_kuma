import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

import {
  MAX_TIMELINE_EVENTS,
  type TimelineEvent,
} from "@/src/modules/timeline/types/timeline";

const TIMELINE_STORAGE_KEY =
  "kumapulse.timeline.events.v2";
const LEGACY_STORAGE_KEYS = [
  "kumapulse.timeline.events",
];

type TimelineState = {
  events: TimelineEvent[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  appendEvents: (
    events: TimelineEvent[],
  ) => Promise<void>;
  clearServer: (
    serverId: string,
  ) => Promise<void>;
  clearAll: () => Promise<void>;
};

function sortEvents(
  events: TimelineEvent[],
): TimelineEvent[] {
  return [...events].sort(
    (left, right) =>
      right.createdAt - left.createdAt ||
      right.timestamp.localeCompare(
        left.timestamp,
      ),
  );
}

function mergeEvents(
  current: TimelineEvent[],
  incoming: TimelineEvent[],
): TimelineEvent[] {
  const byId = new Map<string, TimelineEvent>();

  for (const event of current) {
    byId.set(event.id, event);
  }

  for (const event of incoming) {
    byId.set(event.id, event);
  }

  return sortEvents([...byId.values()]).slice(
    0,
    MAX_TIMELINE_EVENTS,
  );
}

async function persistEvents(
  events: TimelineEvent[],
): Promise<void> {
  await AsyncStorage.setItem(
    TIMELINE_STORAGE_KEY,
    JSON.stringify(events),
  );
}

export const useTimelineStore = create<TimelineState>(
  (set, get) => ({
    events: [],
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
        const storedValue =
          await AsyncStorage.getItem(
            TIMELINE_STORAGE_KEY,
          );

        const parsed = storedValue
          ? (JSON.parse(
              storedValue,
            ) as TimelineEvent[])
          : [];

        set({
          events: Array.isArray(parsed)
            ? sortEvents(parsed).slice(
                0,
                MAX_TIMELINE_EVENTS,
              )
            : [],
          hydrated: true,
        });
      } catch {
        set({
          events: [],
          hydrated: true,
        });
      }
    },

    appendEvents: async (incoming) => {
      if (incoming.length === 0) {
        return;
      }

      const next = mergeEvents(
        get().events,
        incoming,
      );

      set({ events: next });
      await persistEvents(next);
    },

    clearServer: async (serverId) => {
      const next = get().events.filter(
        (event) => event.serverId !== serverId,
      );

      set({ events: next });
      await persistEvents(next);
    },

    clearAll: async () => {
      set({ events: [] });
      await AsyncStorage.removeItem(
        TIMELINE_STORAGE_KEY,
      );
    },
  }),
);
