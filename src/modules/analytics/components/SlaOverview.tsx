import { Pressable, StyleSheet, Text, View } from "react-native";

import type {
  AnalyticsSummary,
  MonitorAnalytics,
} from "@/src/modules/analytics/types/analytics";
import {
  formatUptimePercent,
  getSlaColor,
  getSlaLabel,
} from "@/src/modules/analytics/utils/formatAnalytics";
import { colors, spacing, typography } from "@/src/shared/theme";

type SlaOverviewProps = {
  summary: AnalyticsSummary;
  onPressMonitor?: (monitor: MonitorAnalytics) => void;
};

export function SlaOverview({
  summary,
  onPressMonitor,
}: SlaOverviewProps) {
  const targetLabel =
    summary.slaTarget == null
      ? "por servidor"
      : `${(summary.slaTarget * 100).toFixed(
          summary.slaTarget >= 0.999 ? 2 : 1,
        )} %`;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>
            Objetivo SLA {targetLabel}
          </Text>
          <Text style={styles.description}>
            Uptime medio:{" "}
            <Text
              style={{
                color: getSlaColor(
                  summary.slaStatus,
                ),
                fontWeight: "700",
              }}
            >
              {getSlaLabel(summary.slaStatus)}
            </Text>
          </Text>
        </View>
        <Text
          style={[
            styles.uptime,
            {
              color: getSlaColor(
                summary.slaStatus,
              ),
            },
          ]}
        >
          {formatUptimePercent(
            summary.averageUptime,
          )}
        </Text>
      </View>

      {summary.monitorsBelowSla.length === 0 ? (
        <Text style={styles.empty}>
          Todos los monitores activos cumplen o
          superan el objetivo en esta ventana.
        </Text>
      ) : (
        <View style={styles.list}>
          <Text style={styles.listTitle}>
            Monitores que no llegan al objetivo
          </Text>
          {summary.monitorsBelowSla
            .slice(0, 8)
            .map((monitor) => (
              <Pressable
                key={`${monitor.serverId}:${monitor.monitorId}`}
                accessibilityRole="button"
                disabled={!onPressMonitor}
                onPress={() =>
                  onPressMonitor?.(monitor)
                }
                style={({ pressed }) => [
                  styles.row,
                  pressed
                    ? styles.rowPressed
                    : null,
                ]}
              >
                <View style={styles.rowInfo}>
                  <Text
                    style={styles.monitorName}
                    numberOfLines={1}
                  >
                    {monitor.monitorName}
                  </Text>
                  <Text
                    style={styles.serverName}
                    numberOfLines={1}
                  >
                    {monitor.serverName}
                  </Text>
                </View>
                <View style={styles.rowMeta}>
                  <Text
                    style={[
                      styles.status,
                      {
                        color: getSlaColor(
                          monitor.slaStatus,
                        ),
                      },
                    ]}
                  >
                    {getSlaLabel(
                      monitor.slaStatus,
                    )}
                  </Text>
                  <Text style={styles.metaValue}>
                    {formatUptimePercent(
                      monitor.slaUptime,
                    )}
                  </Text>
                </View>
              </Pressable>
            ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.md,
  },
  title: {
    ...typography.bodyMedium,
    color: colors.text,
  },
  description: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  uptime: {
    ...typography.heading,
    fontSize: 22,
  },
  empty: {
    ...typography.caption,
    color: colors.textMuted,
  },
  list: {
    gap: spacing.sm,
  },
  listTitle: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: "700",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  rowPressed: {
    opacity: 0.7,
  },
  rowInfo: {
    flex: 1,
    gap: 2,
  },
  monitorName: {
    ...typography.bodyMedium,
    color: colors.text,
  },
  serverName: {
    ...typography.caption,
    color: colors.textMuted,
  },
  rowMeta: {
    alignItems: "flex-end",
    gap: 2,
  },
  status: {
    ...typography.caption,
    fontWeight: "700",
  },
  metaValue: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
