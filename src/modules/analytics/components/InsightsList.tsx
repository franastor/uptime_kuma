import { MaterialIcons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import type { AnalyticsInsight } from "@/src/modules/analytics/types/analytics";
import { getInsightColor } from "@/src/modules/analytics/utils/formatAnalytics";
import { colors, spacing, typography } from "@/src/shared/theme";

type InsightsListProps = {
  insights: AnalyticsInsight[];
};

export function InsightsList({
  insights,
}: InsightsListProps) {
  return (
    <View style={styles.list}>
      {insights.map((insight) => {
        const color = getInsightColor(
          insight.severity,
        );

        return (
          <View key={insight.id} style={styles.row}>
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
              <Text
                style={[styles.title, { color }]}
              >
                {insight.title}
              </Text>
              <Text style={styles.description}>
                {insight.description}
              </Text>
            </View>
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
  },
  info: {
    flex: 1,
    gap: 2,
  },
  title: {
    ...typography.bodyMedium,
  },
  description: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
