import { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";

import { colors, spacing, typography } from "@/src/shared/theme";

type AppTextInputProps = TextInputProps & {
  label: string;
  error?: string;
};

export function AppTextInput({
  label,
  error,
  style,
  onFocus,
  onBlur,
  ...props
}: AppTextInputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      <TextInput
        {...props}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        placeholderTextColor={colors.textMuted}
        selectionColor={colors.primary}
        style={[
          styles.input,
          focused && !error ? styles.inputFocused : null,
          error ? styles.inputError : null,
          style,
        ]}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },

  label: {
    ...typography.bodyMedium,
    color: colors.text,
  },

  input: {
    minHeight: 54,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.surface,
    color: colors.text,
    fontSize: 16,
  },

  inputFocused: {
    borderColor: colors.primary,
  },

  inputError: {
    borderColor: colors.danger,
  },

  error: {
    ...typography.caption,
    color: colors.danger,
  },
});
