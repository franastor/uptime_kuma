import { useMemo, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import type { MonitorStatus } from "@/src/modules/monitor/types/monitor";
import {
  AVAILABILITY_WINDOWS,
  buildAvailabilityBuckets,
  type AvailabilityBucket,
  type AvailabilitySample,
} from "@/src/modules/monitor/utils/buildAvailabilityBuckets";
import {
  colors,
  spacing,
  typography,
} from "@/src/shared/theme";

type MonitorAvailabilityGridProps = {
  samples: AvailabilitySample[];
};

function getStatusColor(
  status: MonitorStatus,
): string {
  switch (status) {
    case "up":
      return colors.success;
    case "down":
      return colors.danger;
    case "pending":
    case "maintenance":
      return colors.warning;
    case "unknown":
    default:
      return colors.textMuted;
  }
}

function isFilledStatus(
  status: MonitorStatus,
): boolean {
  return status !== "unknown";
}

function formatBucketRange(
  bucket: AvailabilityBucket,
): string {
  const format = (value: number): string =>
    new Date(value).toLocaleString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

  return `${format(bucket.start)} → ${format(
    bucket.end,
  )}`;
}

const LEGEND: {
  status: MonitorStatus;
  label: string;
}[] = [
  { status: "up", label: "UP" },
  { status: "down", label: "DOWN" },
  { status: "pending", label: "Pendiente" },
  { status: "maintenance", label: "Mantenimiento" },
  { status: "unknown", label: "Sin datos" },
];

export function MonitorAvailabilityGrid({
  samples,
}: MonitorAvailabilityGridProps) {
  const [windowId, setWindowId] = useState<
    "24h" | "7d"
  >("24h");

  const selectedWindow =
    AVAILABILITY_WINDOWS.find(
      (item) => item.id === windowId,
    ) ?? AVAILABILITY_WINDOWS[0];

  const buckets = useMemo(
    () =>
      buildAvailabilityBuckets(samples, {
        windowMs: selectedWindow.windowMs,
        bucketCount:
          selectedWindow.bucketCount,
      }),
    [samples, selectedWindow],
  );

  const incidentBuckets = buckets.filter(
    (bucket) => bucket.status === "down",
  ).length;

  return (
    <View style={styles.container}>
      <View style={styles.windows}>
        {AVAILABILITY_WINDOWS.map((item) => {
          const selected =
            item.id === selectedWindow.id;

          return (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              accessibilityState={{
                selected,
              }}
              onPress={() =>
                setWindowId(item.id)
              }
              style={[
                styles.windowChip,
                selected
                  ? styles.windowChipSelected
                  : null,
              ]}
            >
              <Text
                style={[
                  styles.windowChipText,
                  selected
                    ? styles.windowChipTextSelected
                    : null,
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.grid}>
        {buckets.map((bucket) => (
          <View
            key={bucket.start}
            accessible
            accessibilityLabel={`${
              bucket.status
            }, ${formatBucketRange(bucket)}`}
            style={[
              styles.bucket,
              isFilledStatus(bucket.status)
                ? {
                    backgroundColor:
                      getStatusColor(bucket.status),
                  }
                : styles.bucketEmpty,
            ]}
          />
        ))}
      </View>

      <Text style={styles.summary}>
        {incidentBuckets === 0
          ? `Sin caídas registradas en ${selectedWindow.label}`
          : `${incidentBuckets} tramo${
              incidentBuckets === 1 ? "" : "s"
            } con caídas en ${
              selectedWindow.label
            }`}
      </Text>

      <View style={styles.legend}>
        {LEGEND.map((item) => (
          <View
            key={item.status}
            style={styles.legendItem}
          >
            <View
              style={[
                styles.legendDot,
                {
                  backgroundColor:
                    getStatusColor(item.status),
                },
              ]}
            />
            <Text style={styles.legendText}>
              {item.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  windows: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  windowChip: {
    minHeight: 32,
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.surfaceElevated,
  },
  windowChipSelected: {
    borderColor: colors.text,
    backgroundColor: colors.text,
  },
  windowChipText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  windowChipTextSelected: {
    color: colors.background,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  bucket: {
    width: 14,
    height: 18,
    borderRadius: 3,
  },
  bucketEmpty: {
    backgroundColor: colors.surface,
  },
  summary: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    ...typography.caption,
    color: colors.textMuted,
  },
});
