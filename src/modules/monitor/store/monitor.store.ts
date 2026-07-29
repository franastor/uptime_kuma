import { create } from "zustand";

import {
  clearMonitorCache,
  loadMonitorCache,
  saveMonitorCache,
  type MonitorCache,
} from "@/src/modules/monitor/store/monitorCache";

import type {
  Monitor,
  MonitorStatus,
} from "@/src/modules/monitor/types/monitor";
import { parseKumaTimestamp } from "@/src/modules/monitor/utils/parseKumaTimestamp";

interface UpdateMonitorHeartbeatInput {
  monitorId: number;
  status: MonitorStatus;
  ping?: number | null;
  uptime?: number | null;
  message?: string | null;
  heartbeatAt?: string | null;
  retries?: number;
  important?: boolean;
}

interface MonitorState {
  monitorsByServer: Record<string, Monitor[]>;
  loadingByServer: Record<string, boolean>;
  errorByServer: Record<string, string | null>;
  lastUpdatedByServer: Record<string, number>;
  hydrated: boolean;

  hydrate: () => Promise<void>;

  setMonitors: (
    serverId: string,
    monitors: Monitor[],
  ) => void;

  updateMonitor: (
    serverId: string,
    monitor: Monitor,
  ) => void;

  removeMonitor: (
    serverId: string,
    monitorId: number,
  ) => void;

  setLoading: (
    serverId: string,
    loading: boolean,
  ) => void;

  setError: (
    serverId: string,
    error: string | null,
  ) => void;

  updateHeartbeat: (
    serverId: string,
    input: UpdateMonitorHeartbeatInput,
  ) => void;

  clearServer: (serverId: string) => void;

  clearAll: () => void;
}

function parseHeartbeatDate(
  value: string | null | undefined,
): number | null {
  return parseKumaTimestamp(value);
}

function calculateDuration(
  previousHeartbeatAt: string | null,
  currentHeartbeatAt: string | null | undefined,
): number | null {
  const previousTimestamp =
    parseHeartbeatDate(
      previousHeartbeatAt,
    );

  const currentTimestamp =
    parseHeartbeatDate(
      currentHeartbeatAt,
    );

  if (
    previousTimestamp === null ||
    currentTimestamp === null
  ) {
    return null;
  }

  const durationMs =
    currentTimestamp - previousTimestamp;

  if (durationMs < 0) {
    return null;
  }

  return Math.round(
    durationMs / 1_000,
  );
}

function mergeMonitorRealtimeData(
  incomingMonitor: Monitor,
  currentMonitor: Monitor,
): Monitor {
  return {
    ...incomingMonitor,

    status:
      currentMonitor.status,

    previousStatus:
      currentMonitor.previousStatus,

    ping:
      currentMonitor.ping,

    message:
      currentMonitor.message,

    uptime:
      currentMonitor.uptime,

    lastHeartbeatAt:
      currentMonitor.lastHeartbeatAt,

    duration:
      currentMonitor.duration,

    retries:
      currentMonitor.retries,

    important:
      currentMonitor.important,
  };
}

/**
 * Los heartbeats llegan en ráfagas, así que la caché se escribe agrupada
 * en lugar de una vez por evento.
 */
const PERSIST_DEBOUNCE_MS = 1_500;

let persistTimeoutId: ReturnType<
  typeof setTimeout
> | null = null;

function persistNow(): void {
  const {
    monitorsByServer,
    lastUpdatedByServer,
  } = useMonitorStore.getState();

  const cache: MonitorCache = {};

  for (const [
    serverId,
    monitors,
  ] of Object.entries(monitorsByServer)) {
    cache[serverId] = {
      monitors,
      updatedAt:
        lastUpdatedByServer[serverId] ??
        Date.now(),
    };
  }

  void saveMonitorCache(cache);
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

export const useMonitorStore =
  create<MonitorState>((set, get) => ({
    monitorsByServer: {},
    loadingByServer: {},
    errorByServer: {},
    lastUpdatedByServer: {},
    hydrated: false,

    hydrate: async () => {
      if (get().hydrated) {
        return;
      }

      const cache = await loadMonitorCache();

      set((state) => {
        const monitorsByServer = {
          ...state.monitorsByServer,
        };

        const lastUpdatedByServer = {
          ...state.lastUpdatedByServer,
        };

        for (const [
          serverId,
          entry,
        ] of Object.entries(cache)) {
          const alreadyLive =
            (monitorsByServer[serverId]
              ?.length ?? 0) > 0;

          if (alreadyLive) {
            continue;
          }

          monitorsByServer[serverId] =
            entry.monitors;

          lastUpdatedByServer[serverId] =
            entry.updatedAt;
        }

        return {
          monitorsByServer,
          lastUpdatedByServer,
          hydrated: true,
        };
      });
    },

    setMonitors: (
      serverId,
      monitors,
    ) => {
      set((state) => {
        const currentMonitors =
          state.monitorsByServer[
            serverId
          ] ?? [];

        const currentMonitorsById =
          new Map(
            currentMonitors.map(
              (monitor) => [
                monitor.id,
                monitor,
              ],
            ),
          );

        const mergedMonitors =
          monitors.map((monitor) => {
            const currentMonitor =
              currentMonitorsById.get(
                monitor.id,
              );

            if (!currentMonitor) {
              return monitor;
            }

            return mergeMonitorRealtimeData(
              monitor,
              currentMonitor,
            );
          });

        return {
          monitorsByServer: {
            ...state.monitorsByServer,
            [serverId]:
              mergedMonitors,
          },

          loadingByServer: {
            ...state.loadingByServer,
            [serverId]: false,
          },

          errorByServer: {
            ...state.errorByServer,
            [serverId]: null,
          },

          lastUpdatedByServer: {
            ...state.lastUpdatedByServer,
            [serverId]: Date.now(),
          },
        };
      });

      schedulePersist();
    },

    updateMonitor: (
      serverId,
      monitor,
    ) => {
      set((state) => {
        const currentMonitors =
          state.monitorsByServer[
            serverId
          ];

        if (!currentMonitors) {
          return {};
        }

        const currentMonitor =
          currentMonitors.find(
            (item) =>
              item.id === monitor.id,
          );

        if (!currentMonitor) {
          return {
            monitorsByServer: {
              ...state.monitorsByServer,
              [serverId]: [
                ...currentMonitors,
                monitor,
              ],
            },

            lastUpdatedByServer: {
              ...state.lastUpdatedByServer,
              [serverId]: Date.now(),
            },
          };
        }

        const updatedMonitors =
          currentMonitors.map(
            (item) => {
              if (
                item.id !== monitor.id
              ) {
                return item;
              }

              return mergeMonitorRealtimeData(
                monitor,
                item,
              );
            },
          );

        return {
          monitorsByServer: {
            ...state.monitorsByServer,
            [serverId]:
              updatedMonitors,
          },

          lastUpdatedByServer: {
            ...state.lastUpdatedByServer,
            [serverId]: Date.now(),
          },
        };
      });

      schedulePersist();
    },

    removeMonitor: (
      serverId,
      monitorId,
    ) => {
      set((state) => {
        const currentMonitors =
          state.monitorsByServer[
            serverId
          ];

        if (!currentMonitors) {
          return {};
        }

        return {
          monitorsByServer: {
            ...state.monitorsByServer,
            [serverId]:
              currentMonitors.filter(
                (monitor) =>
                  monitor.id !==
                  monitorId,
              ),
          },

          lastUpdatedByServer: {
            ...state.lastUpdatedByServer,
            [serverId]: Date.now(),
          },
        };
      });

      schedulePersist();
    },

    setLoading: (
      serverId,
      loading,
    ) => {
      set((state) => ({
        loadingByServer: {
          ...state.loadingByServer,
          [serverId]: loading,
        },
      }));
    },

    setError: (
      serverId,
      error,
    ) => {
      set((state) => ({
        errorByServer: {
          ...state.errorByServer,
          [serverId]: error,
        },

        loadingByServer: {
          ...state.loadingByServer,
          [serverId]: false,
        },
      }));
    },

    updateHeartbeat: (
      serverId,
      input,
    ) => {
      set((state) => {
        const currentMonitors =
          state.monitorsByServer[
            serverId
          ];

        if (!currentMonitors) {
          return {};
        }

        let monitorFound = false;

        const updatedMonitors =
          currentMonitors.map(
            (monitor) => {
              if (
                monitor.id !==
                input.monitorId
              ) {
                return monitor;
              }

              monitorFound = true;

              const statusChanged =
                monitor.status !==
                  "unknown" &&
                monitor.status !==
                  input.status;

              const duration =
                calculateDuration(
                  monitor.lastHeartbeatAt,
                  input.heartbeatAt,
                );

              return {
                ...monitor,

                previousStatus:
                  statusChanged
                    ? monitor.status
                    : monitor.previousStatus,

                status:
                  input.status,

                ping:
                  input.ping !==
                  undefined
                    ? input.ping
                    : monitor.ping,

                uptime:
                  input.uptime !==
                  undefined
                    ? input.uptime
                    : monitor.uptime,

                message:
                  input.message !==
                  undefined
                    ? input.message
                    : monitor.message,

                lastHeartbeatAt:
                  input.heartbeatAt !==
                  undefined
                    ? input.heartbeatAt
                    : monitor.lastHeartbeatAt,

                duration:
                  duration ??
                  monitor.duration,

                retries:
                  input.retries ??
                  monitor.retries,

                important:
                  input.important ??
                  monitor.important,
              };
            },
          );

        if (!monitorFound) {
          return {};
        }

        return {
          monitorsByServer: {
            ...state.monitorsByServer,
            [serverId]:
              updatedMonitors,
          },

          lastUpdatedByServer: {
            ...state.lastUpdatedByServer,
            [serverId]: Date.now(),
          },
        };
      });

      schedulePersist();
    },

    clearServer: (
      serverId,
    ) => {
      set((state) => {
        const monitorsByServer = {
          ...state.monitorsByServer,
        };

        const loadingByServer = {
          ...state.loadingByServer,
        };

        const errorByServer = {
          ...state.errorByServer,
        };

        const lastUpdatedByServer = {
          ...state.lastUpdatedByServer,
        };

        delete monitorsByServer[
          serverId
        ];

        delete loadingByServer[
          serverId
        ];

        delete errorByServer[
          serverId
        ];

        delete lastUpdatedByServer[
          serverId
        ];

        return {
          monitorsByServer,
          loadingByServer,
          errorByServer,
          lastUpdatedByServer,
        };
      });

      schedulePersist();
    },

    clearAll: () => {
      if (persistTimeoutId !== null) {
        clearTimeout(persistTimeoutId);
        persistTimeoutId = null;
      }

      set({
        monitorsByServer: {},
        loadingByServer: {},
        errorByServer: {},
        lastUpdatedByServer: {},
      });

      void clearMonitorCache();
    },
  }));