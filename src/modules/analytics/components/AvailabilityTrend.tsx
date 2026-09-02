import { StyleSheet, Text, View } from "react-native";

import type { AvailabilityPoint } from "@/src/modules/analytics/types/analytics";
import { formatUptimePercent } from "@/src/modules/analytics/utils/formatAnalytics";
import { colors, spacing, typography } from "@/src/shared/theme";

type AvailabilityTrendProps = {
  points: AvailabilityPoint[];
};

export function AvailabilityTrend({
  points,
}: AvailabilityTrendProps) {
  const max = Math.max(
    ...points.map((point) => point.uptime ?? 0),
    0.01,
  );

  return (
    <View style={styles.container}>
      <View style={styles.bars}>
        {points.map((point) => {
          const ratio =
            point.uptime === null
              ? 0
              : Math.max(
                  0.08,
                  point.uptime / max,
                );

          return (
            <View
              key={point.window}
              style={styles.column}
            >
              <Text style={styles.value}>
                {formatUptimePercent(point.uptime)}
              </Text>
              <View style={styles.track}>
                <View
                  style={[
                    styles.fill,
                    {
                      height: Math.max(
                        8,
                        Math.round(ratio * 90),
                      ),
                      backgroundColor:
                        point.uptime !== null
                          ? colors.success
                          : colors.border,
                    },
                  ]}
                />
              </View>
              <Text style={styles.label}>
                {point.label}
              </Text>
            </View>
          );
        })}
      </View>
      <Text style={styles.hint}>
        24 h usa uptime de Kuma; 7/30/90 d mezclan
        stats oficiales y estimación local.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  bars: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: spacing.sm,
    minHeight: 140,
  },
  column: {
    flex: 1,
    alignItems: "center",
    gap: spacing.xs,
  },
  value: {
    ...typography.monoMedium,
    color: colors.textSecondary,
  },
  track: {
    width: "100%",
    height: 90,
    justifyContent: "flex-end",
    borderRadius: 8,
    backgroundColor: colors.border,
    overflow: "hidden",
  },
  fill: {
    width: "100%",
    borderRadius: 8,
  },
  label: {
    ...typography.caption,
    color: colors.textMuted,
  },
  hint: {
    ...typography.caption,
    color: colors.textMuted,
  },
});
