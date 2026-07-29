import type { IncidentInterval } from "@/src/modules/analytics/types/analytics";
import {
  clipIntervalMs,
  overlapsWindow,
} from "@/src/modules/analytics/utils/clipInterval";

/**
 * Mean Time To Repair: media de duraciones de incidencias cerradas
 * (o abiertas acotadas a la ventana) que intersectan la ventana.
 */
export function computeMttrMs(
  intervals: IncidentInterval[],
  windowStart: number,
  windowEnd: number,
): number | null {
  const durations: number[] = [];

  for (const interval of intervals) {
    const end = interval.end ?? windowEnd;

    if (
      !overlapsWindow(
        interval.start,
        end,
        windowStart,
        windowEnd,
      )
    ) {
      continue;
    }

    const duration = clipIntervalMs(
      interval.start,
      end,
      windowStart,
      windowEnd,
    );

    if (duration > 0) {
      durations.push(duration);
    }
  }

  if (durations.length === 0) {
    return null;
  }

  return (
    durations.reduce(
      (sum, value) => sum + value,
      0,
    ) / durations.length
  );
}

/**
 * Mean Time Between Failures: duración de la ventana / nº de
 * incidencias que arrancan dentro de la ventana.
 */
export function computeMtbfMs(
  intervals: IncidentInterval[],
  windowStart: number,
  windowEnd: number,
): number | null {
  const startedInWindow = intervals.filter(
    (interval) =>
      interval.start >= windowStart &&
      interval.start < windowEnd,
  ).length;

  if (startedInWindow === 0) {
    return null;
  }

  const windowMs = windowEnd - windowStart;

  if (windowMs <= 0) {
    return null;
  }

  return windowMs / startedInWindow;
}
