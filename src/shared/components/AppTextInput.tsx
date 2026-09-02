import { useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

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
  secureTextEntry,
  ...props
}: AppTextInputProps) {
  const [focused, setFocused] = useState(false);
  // Ojo para ver/ocultar contraseñas (funciona en web y nativo).
  const [hidden, setHidden] = useState(
    secureTextEntry === true,
  );
  const showEye = secureTextEntry === true;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      <View style={styles.inputRow}>
        <TextInput
          {...props}
          secureTextEntry={
            showEye ? hidden : secureTextEntry
          }
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

        {showEye ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              hidden
                ? "Mostrar contraseña"
                : "Ocultar contraseña"
            }
            onPress={() =>
              setHidden((value) => !value)
            }
            hitSlop={8}
            style={styles.eyeButton}
          >
            <MaterialIcons
              name={
                hidden
                  ? "visibility"
                  : "visibility-off"
              }
              size={22}
              color={colors.textMuted}
            />
          </Pressable>
        ) : null}
      </View>

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

  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },

  input: {
    flex: 1,
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

  eyeButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },

  error: {
    ...typography.caption,
    color: colors.danger,
  },
});
