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
  accentColor?: string;
  helper?: string;
};

export function StatCard({
  label,
  value,
  icon,
  accentColor = colors.primary,
  helper,
}: StatCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View
          style={[
            styles.iconContainer,
            { borderColor: accentColor },
          ]}
        >
          <MaterialIcons
            name={icon}
            size={18}
            color={accentColor}
          />
        </View>

        <Text style={styles.label}>{label}</Text>
      </View>

      <Text style={[styles.value, { color: accentColor }]}>
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
    borderRadius: 18,
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

  value: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: "800",
  },

  helper: {
    ...typography.caption,
    color: colors.textMuted,
  },
});
