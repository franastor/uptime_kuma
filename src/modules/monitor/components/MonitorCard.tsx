import { MaterialIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { FavoriteButton } from "@/src/modules/monitor/components/FavoriteButton";
import { MonitorStatusBadge } from "@/src/modules/monitor/components/MonitorStatusBadge";
import { MonitorTagList } from "@/src/modules/monitor/components/MonitorTagList";
import type { Monitor } from "@/src/modules/monitor/types/monitor";
import {
  formatHeartbeatDate,
  getMonitorStatusInformation,
  getMonitorTypeIcon,
  getMonitorTypeLabel,
} from "@/src/modules/monitor/utils/monitorPresentation";
import { colors, spacing, typography } from "@/src/shared/theme";

interface MonitorCardProps {
  monitor: Monitor;
  favorite: boolean;
  onToggleFavorite: () => void;
  onPress?: () => void;
}

export function MonitorCard({
  monitor,
  favorite,
  onToggleFavorite,
  onPress,
}: MonitorCardProps) {
  const status = getMonitorStatusInformation(monitor);
  const typeIcon = getMonitorTypeIcon(monitor.type);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        pressed && onPress ? styles.pressed : null,
      ]}
    >
      <View
        style={[
          styles.statusBar,
          { backgroundColor: status.color },
        ]}
      />

      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.identity}>
            <View style={styles.iconContainer}>
              <MaterialIcons
                name={typeIcon}
                size={22}
                color={colors.primary}
              />
            </View>

            <View style={styles.titleContainer}>
              <Text style={styles.name} numberOfLines={1}>
                {monitor.name}
              </Text>
              <Text style={styles.type}>
                {getMonitorTypeLabel(monitor.type)}
              </Text>
            </View>
          </View>

          <FavoriteButton
            favorite={favorite}
            onPress={onToggleFavorite}
          />
        </View>

        <View style={styles.statusRow}>
          <MonitorStatusBadge monitor={monitor} />

          <View style={styles.pingChip}>
            <MaterialIcons
              name="speed"
              size={15}
              color={colors.info}
            />
            <Text style={styles.pingText}>
              {monitor.ping === null ? "—" : `${monitor.ping} ms`}
            </Text>
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

        <View style={styles.footer}>
          <View style={styles.footerItem}>
            <MaterialIcons
              name="schedule"
              size={15}
              color={colors.textMuted}
            />
            <Text style={styles.footerText}>
              {formatHeartbeatDate(monitor.lastHeartbeatAt)}
            </Text>
          </View>

          <Text style={styles.intervalText}>
            {monitor.interval ? `Cada ${monitor.interval} s` : "Intervalo —"}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    backgroundColor: colors.surface,
  },
  pressed: {
    opacity: 0.82,
  },
  statusBar: {
    width: 5,
  },
  content: {
    flex: 1,
    gap: spacing.md,
    padding: spacing.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  identity: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  iconContainer: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: colors.surfaceElevated,
  },
  titleContainer: {
    flex: 1,
  },
  name: {
    ...typography.bodyMedium,
    color: colors.text,
  },
  type: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: "700",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  pingChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 20,
    backgroundColor: colors.surfaceElevated,
  },
  pingText: {
    ...typography.caption,
    color: colors.info,
    fontWeight: "700",
  },
  target: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  description: {
    ...typography.caption,
    color: colors.textMuted,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  footerItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  footerText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  intervalText: {
    ...typography.caption,
    color: colors.textMuted,
  },
});
