import { MaterialIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { TimelineEvent } from "@/src/modules/timeline/types/timeline";
import { formatHeartbeatDate } from "@/src/modules/monitor/utils/monitorPresentation";
import { colors, spacing, typography } from "@/src/shared/theme";

type TimelineEventCardProps = {
  event: TimelineEvent;
  onPress?: () => void;
};

function getStatusColor(
  status: TimelineEvent["status"],
): string {
  switch (status) {
    case "up":
      return colors.success;
    case "down":
      return colors.danger;
    case "pending":
      return colors.warning;
    case "maintenance":
      return colors.warning;
    default:
      return colors.textMuted;
  }
}

function getStatusLabel(
  status: TimelineEvent["status"],
): string {
  switch (status) {
    case "up":
      return "UP";
    case "down":
      return "DOWN";
    case "pending":
      return "PENDING";
    case "maintenance":
      return "MANTENIMIENTO";
    default:
      return "DESCONOCIDO";
  }
}

export function TimelineEventCard({
  event,
  onPress,
}: TimelineEventCardProps) {
  const accentColor = getStatusColor(event.status);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        pressed && onPress ? styles.pressed : null,
      ]}
    >
        <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.monitorName} numberOfLines={1}>
            {event.monitorName}
          </Text>
          <Text
            style={[
              styles.statusLabel,
              { color: accentColor },
            ]}
          >
            {getStatusLabel(event.status)}
          </Text>
        </View>

        <Text style={styles.serverName} numberOfLines={1}>
          {event.serverName}
        </Text>

        <Text style={styles.message} numberOfLines={2}>
          {event.message ||
            (event.previousStatus
              ? `Cambio de estado: ${event.previousStatus} → ${event.status}`
              : `Estado: ${event.status}`)}
        </Text>

        <View style={styles.footer}>
          <MaterialIcons
            name="schedule"
            size={15}
            color={colors.textMuted}
          />
          <Text style={styles.footerText}>
            {formatHeartbeatDate(event.timestamp)}
          </Text>
          {event.ping !== null ? (
            <Text style={styles.ping}>
              {event.ping} ms
            </Text>
          ) : null}
        </View>
      </View>

      {onPress ? (
        <MaterialIcons
          name="chevron-right"
          size={22}
          color={colors.textMuted}
        />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    backgroundColor: colors.surface,
  },
  pressed: {
    opacity: 0.82,
  },
  statusBar: {
    width: 5,
    alignSelf: "stretch",
  },
  content: {
    flex: 1,
    gap: spacing.xs,
    padding: spacing.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  monitorName: {
    ...typography.bodyMedium,
    flex: 1,
    color: colors.text,
  },
  statusLabel: {
    ...typography.label,
  },
  serverName: {
    ...typography.caption,
    color: colors.textMuted,
  },
  message: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  footerText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  ping: {
    ...typography.mono,
    marginLeft: "auto",
    color: colors.textSecondary,
  },
});
