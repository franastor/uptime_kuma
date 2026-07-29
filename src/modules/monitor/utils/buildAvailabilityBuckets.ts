import type { MonitorStatus } from "@/src/modules/monitor/types/monitor";

export type AvailabilitySample = {
  timestamp: number;
  status: MonitorStatus;
};

export type AvailabilityBucket = {
  start: number;
  end: number;
  status: MonitorStatus;
};

const STATUS_SEVERITY: Record<
  MonitorStatus,
  number
> = {
  down: 4,
  pending: 3,
  maintenance: 2,
  up: 1,
  unknown: 0,
};

export type AvailabilityWindow = {
  id: "24h" | "7d";
  label: string;
  windowMs: number;
  bucketCount: number;
};

export const AVAILABILITY_WINDOWS: AvailabilityWindow[] =
  [
    {
      id: "24h",
      label: "24 h",
      windowMs: 24 * 60 * 60 * 1_000,
      bucketCount: 48,
    },
    {
      id: "7d",
      label: "7 días",
      windowMs: 7 * 24 * 60 * 60 * 1_000,
      bucketCount: 56,
    },
  ];

/**
 * Uptime Kuma solo envía los últimos 100 heartbeats, pero los cambios de
 * estado importantes describen el estado entre transiciones. Combinando ambas
 * fuentes se puede reconstruir la disponibilidad de una ventana larga.
 */
export function buildAvailabilityBuckets(
  samples: AvailabilitySample[],
  options: {
    windowMs: number;
    bucketCount: number;
    now?: number;
  },
): AvailabilityBucket[] {
  const now = options.now ?? Date.now();
  const windowStart = now - options.windowMs;
  const bucketSize =
    options.windowMs / options.bucketCount;

  const sorted = [...samples].sort(
    (left, right) =>
      left.timestamp - right.timestamp,
  );

  let index = 0;
  let carriedStatus: MonitorStatus = "unknown";

  while (
    index < sorted.length &&
    sorted[index].timestamp < windowStart
  ) {
    carriedStatus = sorted[index].status;
    index += 1;
  }

  const buckets: AvailabilityBucket[] = [];

  for (
    let position = 0;
    position < options.bucketCount;
    position += 1
  ) {
    const start =
      windowStart + position * bucketSize;
    const end = start + bucketSize;

    let status = carriedStatus;

    while (
      index < sorted.length &&
      sorted[index].timestamp < end
    ) {
      const sample = sorted[index];

      if (
        STATUS_SEVERITY[sample.status] >
        STATUS_SEVERITY[status]
      ) {
        status = sample.status;
      }

      carriedStatus = sample.status;
      index += 1;
    }

    buckets.push({
      start,
      end,
      status,
    });
  }

  return buckets;
}
