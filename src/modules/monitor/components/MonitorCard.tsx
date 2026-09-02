import { MaterialIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { FavoriteButton } from "@/src/modules/monitor/components/FavoriteButton";
import { MonitorStatusBadge } from "@/src/modules/monitor/components/MonitorStatusBadge";
import { MonitorTagList } from "@/src/modules/monitor/components/MonitorTagList";
import type { Monitor } from "@/src/modules/monitor/types/monitor";
import {
  formatHeartbeatDate,
  getMonitorTypeIcon,
  getMonitorTypeLabel,
} from "@/src/modules/monitor/utils/monitorPresentation";
import { colors, spacing, typography } from "@/src/shared/theme";

interface MonitorCardProps {
  monitor: Monitor;
  favorite: boolean;
  highlighted?: boolean;
  /** Uptime 24 h servido por Uptime Kuma (socket); se usa antes que monitor.uptime. */
  uptime24h?: number | null;
  onToggleFavorite: () => void;
  onPress?: () => void;
}

function formatUptimePercent(value: number | null): string {
  if (value === null) {
    return "—";
  }

  const percent = value > 1 ? value : value * 100;

  return `${percent
    .toFixed(percent >= 100 ? 0 : 2)
    .replace(".", ",")} %`;
}

function formatDownSince(
  lastHeartbeatAt: string | null,
  now = Date.now(),
): string | null {
  if (!lastHeartbeatAt) {
    return null;
  }

  const timestamp = new Date(lastHeartbeatAt).getTime();

  if (Number.isNaN(timestamp)) {
    return null;
  }

  const elapsedSeconds = Math.max(
    0,
    Math.floor((now - timestamp) / 1_000),
  );

  if (elapsedSeconds < 10) {
    return "caído hace un momento";
  }

  if (elapsedSeconds < 60) {
    return `caído hace ${elapsedSeconds} s`;
  }

  const minutes = Math.floor(elapsedSeconds / 60);

  if (minutes < 60) {
    return `caído hace ${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remMinutes = minutes % 60;

  if (hours < 24) {
    return remMinutes > 0
      ? `caído hace ${hours} h ${remMinutes} min`
      : `caído hace ${hours} h`;
  }

  const days = Math.floor(hours / 24);
  const remHours = hours % 24;

  return remHours > 0
    ? `caído hace ${days} d ${remHours} h`
    : `caído hace ${days} d`;
}

export function MonitorCard({
  monitor,
  favorite,
  highlighted = false,
  uptime24h,
  onToggleFavorite,
  onPress,
}: MonitorCardProps) {
  const isDown =
    monitor.active && monitor.status === "down";
  const typeIcon = getMonitorTypeIcon(monitor.type);
  const downSince = isDown
    ? formatDownSince(monitor.lastHeartbeatAt)
    : null;
  const heartbeatLabel = formatHeartbeatDate(
    monitor.lastHeartbeatAt,
  );
  const pingLabel =
    monitor.ping === null ? "—" : `${monitor.ping} ms`;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        highlighted ? styles.highlighted : null,
        pressed && onPress ? styles.pressed : null,
      ]}
    >
      <View style={styles.headerRow}>
        <View style={styles.iconContainer}>
          <MaterialIcons
            name={typeIcon}
            size={20}
            color={colors.textSecondary}
          />
        </View>

        <View style={styles.identity}>
          <Text style={styles.name} numberOfLines={1}>
            {monitor.name}
          </Text>
          <Text style={styles.subline} numberOfLines={1}>
            {getMonitorTypeLabel(monitor.type)}
            {monitor.interval
              ? ` · cada ${monitor.interval} s`
              : ""}
          </Text>
        </View>

        <FavoriteButton
          favorite={favorite}
          onPress={onToggleFavorite}
        />
      </View>

      <View style={styles.statusRow}>
        <View style={styles.statusColumn}>
          <MonitorStatusBadge monitor={monitor} liveRegion />
          <Text style={styles.uptime}>
            {formatUptimePercent(
              uptime24h ?? monitor.uptime,
            )}
          </Text>
          {downSince ? (
            <Text style={styles.downSince}>
              {downSince}
            </Text>
          ) : null}
        </View>
      </View>

      {monitor.target ? (
        <Text style={styles.target} numberOfLines={1}>
          {monitor.target}
        </Text>
      ) : null}

      {monitor.description ? (
        <Text style={styles.description} numberOfLines={2}>
          {monitor.description}
        </Text>
      ) : null}

      <MonitorTagList tags={monitor.tags} />

      <Text style={styles.footer} numberOfLines={1}>
        {monitor.lastHeartbeatAt
          ? `${heartbeatLabel} · ${pingLabel} ping`
          : "Sin comprobaciones todavía"}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.xs,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.surface,
  },
  highlighted: {
    borderColor: colors.primary,
    borderWidth: 2,
    backgroundColor: colors.surfaceElevated,
  },
  pressed: {
    opacity: 0.82,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: colors.surfaceElevated,
  },
  identity: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontFamily: "FamiljenGrotesk_600SemiBold",
    fontSize: 15,
    lineHeight: 20,
    color: colors.text,
  },
  subline: {
    ...typography.caption,
    color: colors.textMuted,
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: spacing.xs,
  },
  statusColumn: {
    maxWidth: "72%",
    alignItems: "flex-end",
    gap: 2,
  },
  uptime: {
    ...typography.monoMedium,
    color: colors.textSecondary,
  },
  downSince: {
    fontFamily: "FamiljenGrotesk_600SemiBold",
    fontSize: 13,
    lineHeight: 18,
    textAlign: "right",
    color: colors.text,
  },
  target: {
    ...typography.mono,
    marginTop: spacing.xs,
    color: colors.textMuted,
  },
  description: {
    ...typography.caption,
    color: colors.textMuted,
  },
  footer: {
    ...typography.mono,
    marginTop: spacing.xs,
    color: colors.textMuted,
  },
});
