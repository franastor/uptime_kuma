import { MaterialIcons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import type {
  AnalyticsWindow,
  TrendDirection,
  TrendSignal,
} from "@/src/modules/analytics/types/analytics";
import { getPreviousPeriodExplanation } from "@/src/modules/analytics/utils/formatAnalytics";
import { colors, spacing, typography } from "@/src/shared/theme";

type TrendsOverviewProps = {
  trends: TrendSignal[];
  window: AnalyticsWindow;
};

function directionMeta(direction: TrendDirection): {
  icon: keyof typeof MaterialIcons.glyphMap;
  color: string;
  label: string;
} {
  switch (direction) {
    case "improving":
      return {
        icon: "trending-up",
        color: colors.success,
        label: "Mejora",
      };
    case "worsening":
      return {
        icon: "trending-down",
        color: colors.danger,
        label: "Empeora",
      };
    case "stable":
      return {
        icon: "trending-flat",
        color: colors.info,
        label: "Estable",
      };
    default:
      return {
        icon: "remove",
        color: colors.textMuted,
        label: "Sin datos",
      };
  }
}

export function TrendsOverview({
  trends,
  window,
}: TrendsOverviewProps) {
  if (trends.length === 0) {
    return (
      <Text style={styles.empty}>
        Todavía no hay señales de tendencia para
        esta ventana.
      </Text>
    );
  }

  return (
    <View style={styles.list}>
      <Text style={styles.baseline}>
        {getPreviousPeriodExplanation(window)}
      </Text>
      {trends.map((trend) => {
        const meta = directionMeta(trend.direction);

        return (
          <View key={trend.id} style={styles.card}>
            <View style={styles.header}>
              <View
                style={[
                  styles.iconWrap,
                  { backgroundColor: meta.color },
                ]}
              >
                <MaterialIcons
                  name={meta.icon}
                  size={18}
                  color={colors.background}
                />
              </View>
              <View style={styles.headerText}>
                <Text style={styles.metric}>
                  {trend.metric}
                </Text>
                <Text style={styles.label}>
                  {trend.label}
                </Text>
              </View>
              <View style={styles.badgeCol}>
                <Text
                  style={[
                    styles.badge,
                    { color: meta.color },
                  ]}
                >
                  {meta.label}
                </Text>
                {trend.deltaLabel ? (
                  <Text style={styles.delta}>
                    {trend.deltaLabel}
                  </Text>
                ) : null}
              </View>
            </View>
            <Text style={styles.detail}>
              {trend.detail}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.sm,
  },
  baseline: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  empty: {
    ...typography.caption,
    color: colors.textMuted,
  },
  card: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  metric: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  label: {
    ...typography.bodyMedium,
    color: colors.text,
  },
  badgeCol: {
    alignItems: "flex-end",
    gap: 2,
  },
  badge: {
    ...typography.caption,
    fontWeight: "700",
  },
  delta: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: "700",
  },
  detail: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
