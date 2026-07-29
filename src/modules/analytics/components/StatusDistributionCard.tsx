import { StyleSheet, Text, View } from "react-native";

import type { StatusDistribution } from "@/src/modules/analytics/types/analytics";
import { colors, spacing, typography } from "@/src/shared/theme";

type StatusDistributionCardProps = {
  distribution: StatusDistribution;
};

const SEGMENTS: {
  key: keyof Omit<StatusDistribution, "total">;
  label: string;
  color: string;
}[] = [
  { key: "up", label: "UP", color: colors.success },
  { key: "down", label: "DOWN", color: colors.danger },
  { key: "pending", label: "Pendiente", color: colors.warning },
  { key: "paused", label: "Pausado", color: colors.info },
  { key: "unknown", label: "Desconocido", color: colors.textMuted },
];

export function StatusDistributionCard({
  distribution,
}: StatusDistributionCardProps) {
  const total = Math.max(distribution.total, 1);

  return (
    <View style={styles.container}>
      <View style={styles.bar}>
        {SEGMENTS.map((segment) => {
          const value = distribution[segment.key];

          if (value <= 0) {
            return null;
          }

          return (
            <View
              key={segment.key}
              style={{
                flex: value,
                backgroundColor: segment.color,
                minWidth: 4,
              }}
            />
          );
        })}
      </View>

      <View style={styles.legend}>
        {SEGMENTS.map((segment) => {
          const value = distribution[segment.key];

          return (
            <View
              key={segment.key}
              style={styles.legendItem}
            >
              <View
                style={[
                  styles.dot,
                  {
                    backgroundColor: segment.color,
                  },
                ]}
              />
              <Text style={styles.legendText}>
                {segment.label} {value}
                <Text style={styles.legendMuted}>
                  {" "}
                  ({Math.round((value / total) * 100)}
                  %)
                </Text>
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  bar: {
    flexDirection: "row",
    height: 14,
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: colors.border,
  },
  legend: {
    gap: spacing.sm,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    ...typography.caption,
    color: colors.text,
    fontWeight: "600",
  },
  legendMuted: {
    color: colors.textMuted,
    fontWeight: "400",
  },
});
