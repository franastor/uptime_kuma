import { MaterialIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type {
  AnalyticsInsight,
  InsightCategory,
} from "@/src/modules/analytics/types/analytics";
import { getInsightColor } from "@/src/modules/analytics/utils/formatAnalytics";
import { colors, spacing, typography } from "@/src/shared/theme";

type InsightsListProps = {
  insights: AnalyticsInsight[];
  onPressInsight?: (insight: AnalyticsInsight) => void;
};

const CATEGORY_LABELS: Record<InsightCategory, string> = {
  health: "Salud",
  sla: "SLA",
  latency: "Latencia",
  incidents: "Incidencias",
  pattern: "Patrón",
  ssl: "SSL",
  improvement: "Mejora",
};

export function InsightsList({
  insights,
  onPressInsight,
}: InsightsListProps) {
  return (
    <View style={styles.list}>
      {insights.map((insight) => {
        const color = getInsightColor(
          insight.severity,
        );
        const actionable =
          Boolean(onPressInsight) &&
          insight.monitorId != null &&
          Boolean(insight.serverId);

        const content = (
          <>
            <MaterialIcons
              name={
                insight.severity === "info"
                  ? "lightbulb"
                  : insight.severity === "warning"
                    ? "warning"
                    : "error"
              }
              size={20}
              color={color}
            />
            <View style={styles.info}>
              <View style={styles.metaRow}>
                <Text style={styles.category}>
                  {CATEGORY_LABELS[insight.category]}
                </Text>
                {actionable ? (
                  <MaterialIcons
                    name="chevron-right"
                    size={18}
                    color={colors.textMuted}
                  />
                ) : null}
              </View>
              <Text
                style={[styles.title, { color }]}
              >
                {insight.title}
              </Text>
              <Text style={styles.description}>
                {insight.description}
              </Text>
            </View>
          </>
        );

        if (actionable) {
          return (
            <Pressable
              key={insight.id}
              accessibilityRole="button"
              accessibilityLabel={insight.title}
              onPress={() => onPressInsight?.(insight)}
              style={({ pressed }) => [
                styles.row,
                pressed ? styles.rowPressed : null,
              ]}
            >
              {content}
            </Pressable>
          );
        }

        return (
          <View key={insight.id} style={styles.row}>
            {content}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.md,
  },
  row: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "flex-start",
    paddingVertical: spacing.xs,
  },
  rowPressed: {
    opacity: 0.7,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  category: {
    ...typography.caption,
    color: colors.textMuted,
  },
  title: {
    ...typography.bodyMedium,
  },
  description: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
