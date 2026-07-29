import { MaterialIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { MonitorAnalytics } from "@/src/modules/analytics/types/analytics";
import {
  formatPingMs,
  formatUptimePercent,
  getSlaColor,
  getSlaLabel,
} from "@/src/modules/analytics/utils/formatAnalytics";
import { colors, spacing, typography } from "@/src/shared/theme";

type PriorityMonitorsListProps = {
  monitors: MonitorAnalytics[];
  onPressMonitor?: (
    monitor: MonitorAnalytics,
  ) => void;
};

function statusLabel(
  status: MonitorAnalytics["status"],
): string {
  switch (status) {
    case "down":
      return "DOWN";
    case "pending":
      return "Pendiente";
    case "maintenance":
      return "Mantenimiento";
    case "paused":
      return "Pausado";
    case "up":
      return "UP";
    default:
      return "Desconocido";
  }
}

function statusColor(
  status: MonitorAnalytics["status"],
): string {
  switch (status) {
    case "down":
      return colors.danger;
    case "pending":
    case "maintenance":
      return colors.warning;
    case "up":
      return colors.success;
    default:
      return colors.textMuted;
  }
}

export function PriorityMonitorsList({
  monitors,
  onPressMonitor,
}: PriorityMonitorsListProps) {
  if (monitors.length === 0) {
    return (
      <Text style={styles.empty}>
        Ningún monitor requiere atención ahora
        mismo.
      </Text>
    );
  }

  return (
    <View style={styles.list}>
      {monitors.map((monitor) => {
        const color = statusColor(monitor.status);

        return (
          <Pressable
            key={`${monitor.serverId}:${monitor.monitorId}`}
            accessibilityRole="button"
            disabled={!onPressMonitor}
            onPress={() =>
              onPressMonitor?.(monitor)
            }
            style={({ pressed }) => [
              styles.row,
              pressed ? styles.rowPressed : null,
            ]}
          >
            <View
              style={[
                styles.dot,
                { backgroundColor: color },
              ]}
            />
            <View style={styles.info}>
              <Text
                style={styles.name}
                numberOfLines={1}
              >
                {monitor.monitorName}
              </Text>
              <Text style={styles.meta}>
                {statusLabel(monitor.status)} · SLA{" "}
                {getSlaLabel(monitor.slaStatus)} ·{" "}
                {formatUptimePercent(
                  monitor.uptime,
                )}{" "}
                · {formatPingMs(monitor.averagePing)}
              </Text>
            </View>
            <Text
              style={[
                styles.badge,
                {
                  color: getSlaColor(
                    monitor.slaStatus,
                  ),
                },
              ]}
            >
              {getSlaLabel(monitor.slaStatus)}
            </Text>
            <MaterialIcons
              name="chevron-right"
              size={20}
              color={colors.textMuted}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.sm,
  },
  empty: {
    ...typography.caption,
    color: colors.textMuted,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowPressed: {
    opacity: 0.7,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    ...typography.bodyMedium,
    color: colors.text,
  },
  meta: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  badge: {
    ...typography.caption,
    fontWeight: "700",
  },
});
