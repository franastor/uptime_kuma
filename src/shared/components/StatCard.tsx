import { MaterialIcons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, spacing, typography } from "@/src/shared/theme";

type MaterialIconName = ComponentProps<typeof MaterialIcons>["name"];

type StatCardProps = {
  label: string;
  value: string | number;
  icon: MaterialIconName;
  accentColor?: string;
  helper?: string;
  selected?: boolean;
  onPress?: () => void;
};

export function StatCard({
  label,
  value,
  icon,
  accentColor = colors.primary,
  helper,
  selected = false,
  onPress,
}: StatCardProps) {
  const content = (
    <>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { borderColor: accentColor }]}>
          <MaterialIcons name={icon} size={18} color={accentColor} />
        </View>
        <Text style={styles.label}>{label}</Text>
        {onPress ? (
          <MaterialIcons name="touch-app" size={16} color={colors.textMuted} />
        ) : null}
      </View>

      <Text style={[styles.value, { color: accentColor }]}>{value}</Text>
      {helper ? <Text style={styles.helper}>{helper}</Text> : null}
    </>
  );

  if (!onPress) {
    return <View style={styles.card}>{content}</View>;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Filtrar por ${label}`}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        selected && styles.selectedCard,
        selected && { borderColor: accentColor },
        pressed && styles.pressedCard,
      ]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexGrow: 1,
    flexBasis: "46%",
    minHeight: 128,
    gap: spacing.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    backgroundColor: colors.surface,
  },
  selectedCard: {
    borderWidth: 2,
    backgroundColor: colors.surfaceElevated,
  },
  pressedCard: { opacity: 0.78 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  iconContainer: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: 10,
    backgroundColor: colors.surfaceElevated,
  },
  label: {
    ...typography.caption,
    flex: 1,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  value: { fontSize: 28, lineHeight: 32, fontWeight: "800" },
  helper: { ...typography.caption, color: colors.textMuted },
});
