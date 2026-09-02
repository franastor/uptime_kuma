import { MaterialIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { ActiveIncident } from "@/src/modules/incidents/utils/getActiveIncidents";
import { formatHeartbeatDate } from "@/src/modules/monitor/utils/monitorPresentation";
import { colors, spacing, typography } from "@/src/shared/theme";

interface IncidentCardProps {
  incident: ActiveIncident;
  onPress?: () => void;
}

export function IncidentCard({ incident, onPress }: IncidentCardProps) {
  const critical = incident.severity === "critical";
  const accentColor = critical ? colors.danger : colors.warning;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && onPress ? styles.pressed : null]}>
      <View style={[styles.icon, { backgroundColor: accentColor }]}>
        <MaterialIcons name={critical ? "error-outline" : "hourglass-top"} size={22} color={colors.background} />
      </View>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name} numberOfLines={1}>{incident.monitor.name}</Text>
          <Text style={[styles.severity, { color: accentColor }]}>
            {critical ? "Crítica" : "Pendiente"}
          </Text>
        </View>
        <Text style={styles.message} numberOfLines={2}>
          {incident.monitor.message || (critical ? "El monitor no responde." : "Esperando confirmación del estado.")}
        </Text>
        <View style={styles.footer}>
          <MaterialIcons name="schedule" size={15} color={colors.textMuted} />
          <Text style={styles.footerText}>{formatHeartbeatDate(incident.startedAt)}</Text>
          {incident.monitor.ping !== null ? <Text style={styles.ping}>{incident.monitor.ping} ms</Text> : null}
        </View>
      </View>
      {onPress ? <MaterialIcons name="chevron-right" size={24} color={colors.textMuted} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, borderRadius: 14, backgroundColor: colors.surface },
  pressed: { opacity: 0.82 },
  icon: { width: 42, height: 42, alignItems: "center", justifyContent: "center", borderRadius: 8 },
  content: { flex: 1, gap: spacing.xs },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
  name: { ...typography.bodyMedium, flex: 1, color: colors.text },
  severity: { ...typography.label },
  message: { ...typography.caption, color: colors.textSecondary },
  footer: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  footerText: { ...typography.caption, flex: 1, color: colors.textMuted },
  ping: { ...typography.mono, color: colors.textSecondary },
});
