import type { IncidentInterval } from "@/src/modules/analytics/types/analytics";
import {
  clipIntervalMs,
  overlapsWindow,
} from "@/src/modules/analytics/utils/clipInterval";

export function computeDowntimeMs(
  intervals: IncidentInterval[],
  windowStart: number,
  windowEnd: number,
): number {
  let total = 0;

  for (const interval of intervals) {
    const end = interval.end ?? windowEnd;

    total += clipIntervalMs(
      interval.start,
      end,
      windowStart,
      windowEnd,
    );
  }

  return total;
}

export function countIncidentsInWindow(
  intervals: IncidentInterval[],
  windowStart: number,
  windowEnd: number,
): number {
  return intervals.filter((interval) => {
    const end = interval.end ?? windowEnd;

    return overlapsWindow(
      interval.start,
      end,
      windowStart,
      windowEnd,
    );
  }).length;
}

export function filterIntervalsForMonitor(
  intervals: IncidentInterval[],
  serverId: string,
  monitorId: number,
): IncidentInterval[] {
  return intervals.filter(
    (interval) =>
      interval.serverId === serverId &&
      interval.monitorId === monitorId,
  );
}
