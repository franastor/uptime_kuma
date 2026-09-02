import { StyleSheet, Text, View } from "react-native";

import type { Monitor } from "@/src/modules/monitor/types/monitor";
import { getMonitorStatusInformation } from "@/src/modules/monitor/utils/monitorPresentation";
import { spacing, typography } from "@/src/shared/theme";

interface MonitorStatusBadgeProps {
  monitor: Monitor;
  /** Anuncia cambios de estado en vivo sin robar el foco (lectores de pantalla). */
  liveRegion?: boolean;
}

export function MonitorStatusBadge({
  monitor,
  liveRegion = false,
}: MonitorStatusBadgeProps) {
  const status = getMonitorStatusInformation(monitor);

  return (
    <View
      accessibilityLiveRegion={
        liveRegion ? "polite" : undefined
      }
      style={styles.badge}
    >
      <View
        style={[
          styles.dot,
          { backgroundColor: status.color },
        ]}
      />

      <Text style={[styles.text, { color: status.color }]}>
        {status.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  text: {
    ...typography.label,
  },
});
