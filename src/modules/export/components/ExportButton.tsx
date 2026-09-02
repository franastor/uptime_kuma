import { MaterialIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, spacing, typography } from "@/src/shared/theme";

type ExportButtonProps = {
  title: string;
  description?: string;
  loading?: boolean;
  locked?: boolean;
  onPress: () => void;
};

export function ExportButton({
  title,
  description,
  loading = false,
  locked = false,
  onPress,
}: ExportButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{
        disabled: loading,
        busy: loading,
      }}
      disabled={loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        pressed ? styles.pressed : null,
        loading ? styles.disabled : null,
      ]}
    >
      <View
        style={[
          styles.icon,
          locked ? styles.iconLocked : null,
        ]}
      >
        <MaterialIcons
          name={locked ? "lock" : "file-download"}
          size={22}
          color={
            locked ? colors.textMuted : colors.textSecondary
          }
        />
      </View>
      <View style={styles.info}>
        <Text style={styles.title}>{title}</Text>
        {description ? (
          <Text style={styles.description}>
            {description}
          </Text>
        ) : null}
      </View>
      <MaterialIcons
        name={locked ? "workspace-premium" : "folder"}
        size={20}
        color={colors.textMuted}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  pressed: {
    opacity: 0.75,
  },
  disabled: {
    opacity: 0.6,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceElevated,
  },
  iconLocked: {
    backgroundColor: colors.border,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  title: {
    ...typography.bodyMedium,
    color: colors.text,
  },
  description: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
