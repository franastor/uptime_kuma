import type { DashboardSummary } from "@/src/modules/dashboard/types/dashboard";
import type { Monitor } from "@/src/modules/monitor/types/monitor";

export function calculateDashboardSummary(
  monitors: Monitor[],
): DashboardSummary {
  let up = 0;
  let down = 0;
  let pending = 0;
  let paused = 0;
  let unknown = 0;
  let pingTotal = 0;
  let pingCount = 0;

  for (const monitor of monitors) {
    if (!monitor.active) {
      paused += 1;
      continue;
    }

    switch (monitor.status) {
      case "up":
        up += 1;
        break;
      case "down":
        down += 1;
        break;
      case "pending":
      case "maintenance":
        pending += 1;
        break;
      case "unknown":
      default:
        unknown += 1;
        break;
    }

    if (monitor.ping !== null && Number.isFinite(monitor.ping)) {
      pingTotal += monitor.ping;
      pingCount += 1;
    }
  }

  return {
    total: monitors.length,
    up,
    down,
    pending,
    paused,
    unknown,
    averagePing:
      pingCount > 0
        ? Math.round(pingTotal / pingCount)
        : null,
    activeIncidents: down + pending,
  };
}
