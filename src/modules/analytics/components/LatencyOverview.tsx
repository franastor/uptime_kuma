import { StyleSheet, Text, View } from "react-native";

import type { LatencyStats } from "@/src/modules/analytics/types/analytics";
import {
  formatPingMs,
  formatSignedDelta,
  getDeltaColor,
} from "@/src/modules/analytics/utils/formatAnalytics";
import { colors, spacing, typography } from "@/src/shared/theme";

type LatencyOverviewProps = {
  latency: LatencyStats;
};

export function LatencyOverview({
  latency,
}: LatencyOverviewProps) {
  return (
    <View style={styles.grid}>
      <Metric
        label="Media"
        value={formatPingMs(latency.averageMs)}
      />
      <Metric
        label="Pico"
        value={formatPingMs(latency.peakMs)}
      />
      <Metric
        label="P95"
        value={formatPingMs(latency.p95Ms)}
      />
      <Metric
        label="vs periodo anterior"
        value={formatSignedDelta(latency.deltaMs, {
          suffix: " ms",
          digits: 0,
        })}
        color={getDeltaColor(latency.deltaMs)}
        helper={
          latency.previousAverageMs == null
            ? "Sin datos previos"
            : `Antes ${formatPingMs(
                latency.previousAverageMs,
              )}`
        }
      />
    </View>
  );
}

function Metric({
  label,
  value,
  helper,
  color = colors.text,
}: {
  label: string;
  value: string;
  helper?: string;
  color?: string;
}) {
  return (
    <View style={styles.metric}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, { color }]}>
        {value}
      </Text>
      {helper ? (
        <Text style={styles.helper}>{helper}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  metric: {
    width: "48%",
    flexGrow: 1,
    minWidth: 130,
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
  },
  label: {
    ...typography.caption,
    color: colors.textMuted,
  },
  value: {
    ...typography.heading,
    fontSize: 20,
  },
  helper: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
