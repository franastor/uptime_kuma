import type { Monitor } from "@/src/modules/monitor/types/monitor";

export type MonitorCategory =
  | "up"
  | "incident"
  | "no-data"
  | "paused";

export function getMonitorCategory(monitor: Monitor): MonitorCategory {
  if (!monitor.active) {
    return "paused";
  }

  switch (monitor.status) {
    case "up":
      return "up";
    case "down":
    case "pending":
    case "maintenance":
      return "incident";
    case "unknown":
    default:
      return "no-data";
  }
}

export function isMonitorIncident(monitor: Monitor): boolean {
  return getMonitorCategory(monitor) === "incident";
}

export function isMonitorWithoutData(monitor: Monitor): boolean {
  return getMonitorCategory(monitor) === "no-data";
}
