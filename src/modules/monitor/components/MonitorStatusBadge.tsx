import { StyleSheet, Text, View } from "react-native";

import type { Monitor } from "@/src/modules/monitor/types/monitor";
import { getMonitorStatusInformation } from "@/src/modules/monitor/utils/monitorPresentation";
import { spacing, typography } from "@/src/shared/theme";

interface MonitorStatusBadgeProps {
  monitor: Monitor;
}

export function MonitorStatusBadge({
  monitor,
}: MonitorStatusBadgeProps) {
  const status = getMonitorStatusInformation(monitor);

  return (
    <View
      style={[
        styles.badge,
        { borderColor: status.color },
      ]}
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
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderRadius: 20,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  text: {
    ...typography.caption,
    fontWeight: "700",
  },
});
