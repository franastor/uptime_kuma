import { MaterialIcons } from "@expo/vector-icons";
import {
  StyleSheet,
  Text,
  View,
} from "react-native";

import type { TimelineEvent } from "@/src/modules/timeline/types/timeline";
import { formatHeartbeatDate } from "@/src/modules/monitor/utils/monitorPresentation";
import {
  colors,
  spacing,
  typography,
} from "@/src/shared/theme";

type MonitorTimelineProps = {
  events: TimelineEvent[];
  limit?: number;
};

function getStatusPresentation(
  status: TimelineEvent["status"],
): {
  label: string;
  color: string;
  icon: "check" | "close" | "schedule" | "build";
} {
  switch (status) {
    case "up":
      return {
        label: "UP",
        color: colors.success,
        icon: "check",
      };
    case "down":
      return {
        label: "DOWN",
        color: colors.danger,
        icon: "close",
      };
    case "pending":
      return {
        label: "PENDIENTE",
        color: colors.warning,
        icon: "schedule",
      };
    case "maintenance":
      return {
        label: "MANTENIMIENTO",
        color: colors.warning,
        icon: "build",
      };
    default:
      return {
        label: "SIN DATOS",
        color: colors.textMuted,
        icon: "schedule",
      };
  }
}

export function MonitorTimeline({
  events,
  limit = 8,
}: MonitorTimelineProps) {
  const visibleEvents = events.slice(0, limit);

  if (visibleEvents.length === 0) {
    return (
      <View style={styles.empty}>
        <MaterialIcons
          name="timeline"
          size={28}
          color={colors.textMuted}
        />
        <Text style={styles.emptyTitle}>
          Sin cambios de estado
        </Text>
        <Text style={styles.emptyDescription}>
          Los próximos cambios UP y DOWN aparecerán
          aquí.
        </Text>
      </View>
    );
  }

  return (
    <View>
      {visibleEvents.map((event, index) => {
        const presentation =
          getStatusPresentation(event.status);
        const last =
          index === visibleEvents.length - 1;

        return (
          <View key={event.id} style={styles.row}>
            <View style={styles.axis}>
              {!last ? (
                <View style={styles.line} />
              ) : null}
              <View
                style={[
                  styles.node,
                  {
                    borderColor:
                      presentation.color,
                    backgroundColor:
                      presentation.color,
                  },
                ]}
              >
                <MaterialIcons
                  name={presentation.icon}
                  size={14}
                  color={colors.background}
                />
              </View>
            </View>

            <View style={styles.content}>
              <View style={styles.header}>
                <Text
                  style={[
                    styles.status,
                    {
                      color:
                        presentation.color,
                    },
                  ]}
                >
                  {presentation.label}
                </Text>
                <Text style={styles.time}>
                  {formatHeartbeatDate(
                    event.timestamp,
                  )}
                </Text>
              </View>

              <Text style={styles.date}>
                {new Date(
                  event.createdAt,
                ).toLocaleString("es-ES")}
              </Text>

              {event.message ? (
                <Text
                  style={styles.message}
                  numberOfLines={2}
                >
                  {event.message}
                </Text>
              ) : null}

              {event.ping !== null ? (
                <Text style={styles.ping}>
                  {event.ping} ms
                </Text>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    minHeight: 104,
  },
  axis: {
    width: 34,
    alignItems: "center",
  },
  line: {
    position: "absolute",
    top: 30,
    bottom: -2,
    width: 2,
    backgroundColor: colors.border,
  },
  node: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderRadius: 14,
  },
  content: {
    flex: 1,
    gap: spacing.xs,
    paddingLeft: spacing.md,
    paddingBottom: spacing.xl,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  status: {
    ...typography.label,
    letterSpacing: 0.4,
  },
  time: {
    ...typography.caption,
    color: colors.textMuted,
  },
  date: {
    ...typography.mono,
    color: colors.textMuted,
  },
  message: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  ping: {
    ...typography.mono,
    color: colors.textSecondary,
  },
  empty: {
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xl,
  },
  emptyTitle: {
    ...typography.bodyMedium,
    color: colors.text,
  },
  emptyDescription: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: "center",
  },
});
