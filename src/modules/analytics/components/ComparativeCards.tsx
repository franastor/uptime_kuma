import { StyleSheet, Text, View } from "react-native";

import type {
  AnalyticsWindow,
  PeriodComparative,
} from "@/src/modules/analytics/types/analytics";
import {
  formatPingMs,
  formatSignedDelta,
  formatUptimePercent,
  getDeltaColor,
  getPreviousPeriodExplanation,
  getPreviousPeriodShortLabel,
} from "@/src/modules/analytics/utils/formatAnalytics";
import { colors, spacing, typography } from "@/src/shared/theme";

type ComparativeCardsProps = {
  comparative: PeriodComparative;
  window: AnalyticsWindow;
};

export function ComparativeCards({
  comparative,
  window,
}: ComparativeCardsProps) {
  const previousShort =
    getPreviousPeriodShortLabel(window);

  return (
    <View style={styles.grid}>
      <Text style={styles.baseline}>
        {getPreviousPeriodExplanation(window)}
      </Text>
      <Card
        label="Uptime"
        value={formatSignedDelta(
          comparative.uptimeDelta,
          { asPercent: true, digits: 2, suffix: " pp" },
        )}
        color={getDeltaColor(
          comparative.uptimeDelta,
          true,
        )}
        helper={`${previousShort}: ${formatUptimePercent(
          comparative.previousUptime,
        )}`}
      />
      <Card
        label="Incidencias"
        value={formatSignedDelta(
          comparative.incidentsDelta,
          { digits: 0 },
        )}
        color={getDeltaColor(
          comparative.incidentsDelta,
        )}
        helper={`${previousShort}: ${comparative.previousIncidents}`}
      />
      <Card
        label="Latencia"
        value={formatSignedDelta(
          comparative.pingDeltaMs,
          { digits: 0, suffix: " ms" },
        )}
        color={getDeltaColor(
          comparative.pingDeltaMs,
        )}
        helper={`${previousShort}: ${formatPingMs(
          comparative.previousPingMs,
        )}`}
      />
    </View>
  );
}

function Card({
  label,
  value,
  helper,
  color,
}: {
  label: string;
  value: string;
  helper: string;
  color: string;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, { color }]}>
        {value}
      </Text>
      <Text style={styles.helper}>{helper}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    gap: spacing.sm,
  },
  baseline: {
    ...typography.caption,
    color: colors.textMuted,
  },
  card: {
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
    fontWeight: "700",
  },
  value: {
    ...typography.heading,
    fontSize: 22,
  },
  helper: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
