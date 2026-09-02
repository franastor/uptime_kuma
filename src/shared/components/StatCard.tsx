import { MaterialIcons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import {
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  colors,
  spacing,
  typography,
} from "@/src/shared/theme";

type MaterialIconName = ComponentProps<
  typeof MaterialIcons
>["name"];

type StatCardProps = {
  label: string;
  value: string | number;
  icon: MaterialIconName;
  /** Color semántico del valor (solo estado: rojo = algo roto). Neutro por defecto. */
  accentColor?: string;
  helper?: string;
};

export function StatCard({
  label,
  value,
  icon,
  accentColor,
  helper,
}: StatCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <MaterialIcons
            name={icon}
            size={18}
            color={colors.textMuted}
          />
        </View>

        <Text style={styles.label}>{label}</Text>
      </View>

      <Text
        style={[
          styles.value,
          accentColor ? { color: accentColor } : null,
        ]}
      >
        {value}
      </Text>

      {helper ? (
        <Text style={styles.helper}>{helper}</Text>
      ) : null}
    </View>
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
    borderRadius: 14,
    backgroundColor: colors.surface,
  },

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
    borderRadius: 8,
    backgroundColor: colors.surfaceElevated,
  },

  label: {
    ...typography.caption,
    flex: 1,
    color: colors.textSecondary,
  },

  value: {
    fontFamily: "MartianMono_500Medium",
    fontSize: 28,
    lineHeight: 32,
    color: colors.text,
  },

  helper: {
    ...typography.caption,
    color: colors.textMuted,
  },
});
