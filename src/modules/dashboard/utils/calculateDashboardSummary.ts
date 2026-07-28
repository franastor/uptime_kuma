import type { DashboardSummary } from "@/src/modules/dashboard/types/dashboard";
import type { Monitor } from "@/src/modules/monitor/types/monitor";
import { getMonitorCategory } from "@/src/modules/monitor/utils/monitorState";

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
    const category = getMonitorCategory(monitor);

    switch (category) {
      case "up":
        up += 1;
        break;
      case "paused":
        paused += 1;
        break;
      case "no-data":
        unknown += 1;
        break;
      case "incident":
        if (monitor.status === "down") {
          down += 1;
        } else {
          pending += 1;
        }
        break;
    }

    if (
      category !== "paused" &&
      monitor.ping !== null &&
      Number.isFinite(monitor.ping)
    ) {
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
    averagePing: pingCount > 0 ? Math.round(pingTotal / pingCount) : null,
    activeIncidents: down + pending,
  };
}
