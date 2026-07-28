import type { Monitor } from "@/src/modules/monitor/types/monitor";
import { getMonitorCategory } from "@/src/modules/monitor/utils/monitorState";

export type IncidentSeverity = "critical" | "pending" | "no-data";

export type ActiveIncident = {
  monitor: Monitor;
  severity: IncidentSeverity;
  startedAt: string | null;
};

const severityRank = (severity: IncidentSeverity): number => {
  if (severity === "critical") {
    return 0;
  }

  if (severity === "pending") {
    return 1;
  }

  return 2;
};

const getIncidentSeverity = (
  monitor: Monitor,
): IncidentSeverity | null => {
  const category = getMonitorCategory(monitor);

  if (category === "no-data") {
    return "no-data";
  }

  if (category !== "incident") {
    return null;
  }

  return monitor.status === "down" ? "critical" : "pending";
};

export const getActiveIncidents = (
  monitors: Monitor[],
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
      (incident): incident is ActiveIncident => incident !== null,
    )
    .sort((left, right) => {
      const severityDifference =
        severityRank(left.severity) - severityRank(right.severity);

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
