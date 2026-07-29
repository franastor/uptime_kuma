import type {
  HeatmapCell,
  IncidentInterval,
} from "@/src/modules/analytics/types/analytics";
import { overlapsWindow } from "@/src/modules/analytics/utils/clipInterval";

const HOUR_MS = 60 * 60 * 1_000;

function emptyHeatmap(): HeatmapCell[] {
  const cells: HeatmapCell[] = [];

  for (let day = 0; day < 7; day += 1) {
    for (let hour = 0; hour < 24; hour += 1) {
      cells.push({
        dayOfWeek: day,
        hour,
        downtimeMs: 0,
        incidents: 0,
      });
    }
  }

  return cells;
}

function cellIndex(
  dayOfWeek: number,
  hour: number,
): number {
  return dayOfWeek * 24 + hour;
}

/**
 * Acumula downtime e inicios de incidencia en una matriz
 * día-de-semana (0=domingo) × hora local.
 */
export function buildHeatmap(
  intervals: IncidentInterval[],
  windowStart: number,
  windowEnd: number,
): HeatmapCell[] {
  const cells = emptyHeatmap();

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

    if (
      interval.start >= windowStart &&
      interval.start < windowEnd
    ) {
      const startDate = new Date(interval.start);
      const index = cellIndex(
        startDate.getDay(),
        startDate.getHours(),
      );
      cells[index].incidents += 1;
    }

    let cursor = Math.max(
      interval.start,
      windowStart,
    );
    const clippedEnd = Math.min(end, windowEnd);

    while (cursor < clippedEnd) {
      const date = new Date(cursor);
      const nextHour = new Date(date);
      nextHour.setMinutes(0, 0, 0);
      nextHour.setHours(date.getHours() + 1);

      const sliceEnd = Math.min(
        clippedEnd,
        nextHour.getTime(),
      );
      const sliceMs = sliceEnd - cursor;

      if (sliceMs > 0) {
        const index = cellIndex(
          date.getDay(),
          date.getHours(),
        );
        cells[index].downtimeMs += sliceMs;
      }

      cursor = sliceEnd;

      // Evita bucles si el reloj salta o hay bordes raros.
      if (sliceMs <= 0) {
        cursor += HOUR_MS;
      }
    }
  }

  return cells;
}
