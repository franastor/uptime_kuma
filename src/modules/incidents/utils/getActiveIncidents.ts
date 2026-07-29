import type { Monitor } from "@/src/modules/monitor/types/monitor";

export type IncidentSeverity = "critical" | "pending";

export type ActiveIncident = {
  monitor: Monitor;
  severity: IncidentSeverity;
  startedAt: string | null;
};

const severityRank = (severity: IncidentSeverity): number => {
  return severity === "critical" ? 0 : 1;
};

const getIncidentSeverity = (
  monitor: Monitor
): IncidentSeverity | null => {
  if (!monitor.active) {
    return null;
  }

  if (monitor.status === "down") {
    return "critical";
  }

  if (
    monitor.status === "pending" ||
    monitor.status === "maintenance"
  ) {
    return "pending";
  }

  return null;
};

export const getActiveIncidents = (
  monitors: Monitor[]
): ActiveIncident[] => {
  return monitors
    .map((monitor): ActiveIncident | null => {
      const severity = getIncidentSeverity(monitor);

      if (!severity) {
        return null;
      }

      return {
        monitor,
        severity,
        startedAt: monitor.lastHeartbeatAt,
      };
    })
    .filter(
      (incident): incident is ActiveIncident =>
        incident !== null
    )
    .sort((left, right) => {
      const severityDifference =
        severityRank(left.severity) -
        severityRank(right.severity);

      if (severityDifference !== 0) {
        return severityDifference;
      }

      const leftTime = left.startedAt
        ? new Date(left.startedAt).getTime()
        : Number.MAX_SAFE_INTEGER;

      const rightTime = right.startedAt
        ? new Date(right.startedAt).getTime()
        : Number.MAX_SAFE_INTEGER;

      return leftTime - rightTime;
    });
};