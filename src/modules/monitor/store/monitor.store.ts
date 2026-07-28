import { create } from "zustand";

import type {
  Monitor,
  MonitorStatus,
} from "@/src/modules/monitor/types/monitor";

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
  if (!value) {
    return null;
  }

  const normalizedValue = value.includes("T")
    ? value
    : value.replace(" ", "T");

  const timestamp = new Date(
    normalizedValue,
  ).getTime();

  return Number.isNaN(timestamp)
    ? null
    : timestamp;
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

export const useMonitorStore =
  create<MonitorState>((set) => ({
    monitorsByServer: {},
    loadingByServer: {},
    errorByServer: {},

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
        };
      });
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
        };
      });
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
        };
      });
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
        };
      });
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

        delete monitorsByServer[
          serverId
        ];

        delete loadingByServer[
          serverId
        ];

        delete errorByServer[
          serverId
        ];

        return {
          monitorsByServer,
          loadingByServer,
          errorByServer,
        };
      });
    },

    clearAll: () => {
      set({
        monitorsByServer: {},
        loadingByServer: {},
        errorByServer: {},
      });
    },
  }));