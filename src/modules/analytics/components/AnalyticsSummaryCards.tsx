import { MaterialIcons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import type { AnalyticsSummary } from "@/src/modules/analytics/types/analytics";
import {
  formatDurationMs,
  formatPingMs,
  formatUptimePercent,
  getSlaColor,
  getSlaLabel,
} from "@/src/modules/analytics/utils/formatAnalytics";
import { colors, spacing, typography } from "@/src/shared/theme";

type AnalyticsSummaryCardsProps = {
  summary: AnalyticsSummary;
};

type CardProps = {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  value: string;
  helper: string;
  color?: string;
};

function Card({
  icon,
  label,
  value,
  helper,
  color = colors.text,
}: CardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <MaterialIcons
          name={icon}
          size={18}
          color={colors.textMuted}
        />
        <Text style={styles.cardLabel}>
          {label}
        </Text>
      </View>
      <Text style={[styles.cardValue, { color }]}>
        {value}
      </Text>
      <Text style={styles.cardHelper}>
        {helper}
      </Text>
    </View>
  );
}

export function AnalyticsSummaryCards({
  summary,
}: AnalyticsSummaryCardsProps) {
  return (
    <View style={styles.grid}>
      <Card
        icon="percent"
        label="Uptime medio"
        value={formatUptimePercent(
          summary.averageUptime,
        )}
        helper={
          summary.window === "24h"
            ? "Preferencia: stats 24 h de Kuma"
            : "Preferencia: uptime 30 d de Kuma"
        }
      />
      <Card
        icon="timer-off"
        label="Downtime"
        value={formatDurationMs(
          summary.totalDowntimeMs,
        )}
        helper="Suma de intervalos DOWN"
        color={
          summary.totalDowntimeMs > 0
            ? colors.danger
            : undefined
        }
      />
      <Card
        icon="report"
        label="Incidencias"
        value={summary.totalIncidents.toLocaleString(
          "es-ES",
        )}
        helper={`${summary.monitorCount} monitores activos`}
        color={
          summary.totalIncidents > 0
            ? colors.danger
            : undefined
        }
      />
      <Card
        icon="speed"
        label="Ping medio"
        value={formatPingMs(summary.averagePing)}
        helper="Media 24 h de Kuma / último ping"
      />
      <Card
        icon="build"
        label="MTTR"
        value={formatDurationMs(summary.mttrMs)}
        helper="Tiempo medio de recuperación"
      />
      <Card
        icon="schedule"
        label="MTBF"
        value={formatDurationMs(summary.mtbfMs)}
        helper="Tiempo medio entre fallos"
      />
      <Card
        icon="verified"
        label="SLA"
        value={getSlaLabel(summary.slaStatus)}
        helper={
          summary.slaTarget == null
            ? "Objetivo distinto por servidor"
            : `Objetivo ${(
                summary.slaTarget * 100
              ).toFixed(
                summary.slaTarget >= 0.999
                  ? 2
                  : 1,
              )} %`
        }
        color={getSlaColor(summary.slaStatus)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  card: {
    width: "48%",
    flexGrow: 1,
    minWidth: 140,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: spacing.md,
    gap: spacing.xs,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  cardLabel: {
    ...typography.label,
    color: colors.textSecondary,
  },
  cardValue: {
    fontFamily: "MartianMono_500Medium",
    fontSize: 20,
    lineHeight: 26,
  },
  cardHelper: {
    ...typography.caption,
    color: colors.textMuted,
  },
});
