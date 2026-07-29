import AsyncStorage from "@react-native-async-storage/async-storage";

import type { Monitor } from "@/src/modules/monitor/types/monitor";

const MONITOR_CACHE_STORAGE_KEY =
  "kumapulse.monitors.cache";

const CACHE_VERSION = 1;

export type MonitorCacheEntry = {
  monitors: Monitor[];
  updatedAt: number;
};

export type MonitorCache = Record<
  string,
  MonitorCacheEntry
>;

type StoredMonitorCache = {
  version: number;
  entries: MonitorCache;
};

function isMonitorLike(
  value: unknown,
): value is Monitor {
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
    typeof candidate.id === "number" &&
    typeof candidate.name === "string" &&
    typeof candidate.status === "string"
  );
}

function parseCache(
  storedValue: string | null,
): MonitorCache {
  if (!storedValue) {
    return {};
  }

  const parsed = JSON.parse(
    storedValue,
  ) as StoredMonitorCache;

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    parsed.version !== CACHE_VERSION ||
    typeof parsed.entries !== "object" ||
    parsed.entries === null
  ) {
    return {};
  }

  const entries: MonitorCache = {};

  for (const [
    serverId,
    entry,
  ] of Object.entries(parsed.entries)) {
    if (!Array.isArray(entry?.monitors)) {
      continue;
    }

    entries[serverId] = {
      monitors:
        entry.monitors.filter(isMonitorLike),
      updatedAt:
        typeof entry.updatedAt === "number"
          ? entry.updatedAt
          : 0,
    };
  }

  return entries;
}

export async function loadMonitorCache(): Promise<MonitorCache> {
  try {
    const storedValue =
      await AsyncStorage.getItem(
        MONITOR_CACHE_STORAGE_KEY,
      );

    return parseCache(storedValue);
  } catch {
    return {};
  }
}

export async function saveMonitorCache(
  cache: MonitorCache,
): Promise<void> {
  try {
    const payload: StoredMonitorCache = {
      version: CACHE_VERSION,
      entries: cache,
    };

    await AsyncStorage.setItem(
      MONITOR_CACHE_STORAGE_KEY,
      JSON.stringify(payload),
    );
  } catch {
    // Una caché no escrita no debe romper la sesión en curso.
  }
}

export async function clearMonitorCache(): Promise<void> {
  try {
    await AsyncStorage.removeItem(
      MONITOR_CACHE_STORAGE_KEY,
    );
  } catch {
    // Ignorado a propósito.
  }
}
