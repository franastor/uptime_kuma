import { MaterialIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { MonitorAnalytics } from "@/src/modules/analytics/types/analytics";
import {
  formatDurationMs,
  formatPingMs,
  formatUptimePercent,
} from "@/src/modules/analytics/utils/formatAnalytics";
import { colors, spacing, typography } from "@/src/shared/theme";

type MonitorRankingListProps = {
  ranking: MonitorAnalytics[];
  mode?: "availability" | "latency";
  onPressMonitor?: (monitor: MonitorAnalytics) => void;
};

export function MonitorRankingList({
  ranking,
  mode = "availability",
  onPressMonitor,
}: MonitorRankingListProps) {
  if (ranking.length === 0) {
    return (
      <Text style={styles.empty}>
        No hay monitores activos para ranking.
      </Text>
    );
  }

  return (
    <View style={styles.list}>
      {ranking.map((monitor, index) => (
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
          <Text style={styles.rank}>
            {index + 1}
          </Text>
          <View style={styles.info}>
            <Text
              style={styles.name}
              numberOfLines={1}
            >
              {monitor.monitorName}
            </Text>
            <Text
              style={styles.server}
              numberOfLines={1}
            >
              {monitor.serverName}
            </Text>
            <Text style={styles.meta}>
              {mode === "latency"
                ? `Media ${formatPingMs(
                    monitor.averagePing,
                  )} · P95 ${formatPingMs(
                    monitor.p95Ping,
                  )} · Pico ${formatPingMs(
                    monitor.peakPing,
                  )}`
                : `${monitor.incidents} incidencia${
                    monitor.incidents === 1
                      ? ""
                      : "s"
                  } · downtime ${formatDurationMs(
                    monitor.downtimeMs,
                  )} · MTTR ${formatDurationMs(
                    monitor.mttrMs,
                  )}`}
            </Text>
          </View>
          <View style={styles.side}>
            <Text style={styles.uptime}>
              {mode === "latency"
                ? formatPingMs(monitor.averagePing)
                : formatUptimePercent(
                    monitor.uptime,
                  )}
            </Text>
            <Text style={styles.ping}>
              {mode === "latency"
                ? formatUptimePercent(
                    monitor.uptime,
                  )
                : formatPingMs(monitor.averagePing)}
            </Text>
            <MaterialIcons
              name="chevron-right"
              size={20}
              color={colors.textMuted}
            />
          </View>
        </Pressable>
      ))}
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
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowPressed: {
    opacity: 0.7,
  },
  rank: {
    ...typography.heading,
    fontSize: 18,
    width: 24,
    color: colors.primary,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    ...typography.bodyMedium,
    color: colors.text,
  },
  server: {
    ...typography.caption,
    color: colors.textMuted,
  },
  meta: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  side: {
    alignItems: "flex-end",
    gap: 2,
  },
  uptime: {
    ...typography.bodyMedium,
    color: colors.text,
  },
  ping: {
    ...typography.caption,
    color: colors.textMuted,
  },
});
