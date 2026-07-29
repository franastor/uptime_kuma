import { MaterialIcons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { getHealthColor } from "@/src/modules/analytics/utils/formatAnalytics";
import { colors, spacing, typography } from "@/src/shared/theme";

type HealthScoreCardProps = {
  score: number | null;
  helper?: string;
};

export function HealthScoreCard({
  score,
  helper = "Uptime, latencia, incidencias y estabilidad",
}: HealthScoreCardProps) {
  const color = getHealthColor(score);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <MaterialIcons
          name="monitor-heart"
          size={22}
          color={color}
        />
        <Text style={styles.label}>
          Health Score
        </Text>
      </View>
      <Text style={[styles.score, { color }]}>
        {score === null ? "—" : score}
        {score !== null ? (
          <Text style={styles.suffix}> / 100</Text>
        ) : null}
      </Text>
      <Text style={styles.helper}>{helper}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  label: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
  },
  score: {
    ...typography.title,
    fontSize: 42,
    lineHeight: 48,
  },
  suffix: {
    ...typography.heading,
    fontSize: 18,
    color: colors.textMuted,
  },
  helper: {
    ...typography.caption,
    color: colors.textMuted,
  },
});
