import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
} from "react-native";

import {
  colors,
  spacing,
  typography,
} from "@/src/shared/theme";

type AppButtonProps = PressableProps & {
  title: string;
  loading?: boolean;
  variant?: "primary" | "ghost" | "danger";
};

export function AppButton({
  title,
  loading = false,
  disabled,
  variant = "primary",
  style,
  ...props
}: AppButtonProps) {
  const isDisabled = disabled || loading;
  const isPrimary = variant === "primary";
  const isDanger = variant === "danger";

  return (
    <Pressable
      {...props}
      disabled={isDisabled}
      style={(state) => [
        styles.button,
        variant === "ghost" && styles.ghost,
        isDanger && styles.danger,
        state.pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        typeof style === "function" ? style(state) : style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={
            isPrimary || isDanger
              ? colors.primaryDark
              : colors.primary
          }
        />
      ) : (
        <Text
          style={[
            styles.text,
            variant === "ghost" && styles.ghostText,
            isDanger && styles.dangerText,
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 54,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    borderRadius: 8,
    backgroundColor: colors.primary,
  },

  ghost: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.transparent,
  },

  danger: {
    backgroundColor: colors.danger,
  },

  pressed: {
    opacity: 0.8,
  },

  disabled: {
    opacity: 0.5,
  },

  text: {
    ...typography.button,
    color: colors.primaryDark,
  },

  ghostText: {
    color: colors.text,
  },

  dangerText: {
    color: colors.background,
  },
});
