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
    ...props
  }: AppTextInputProps) {
    return (
      <View style={styles.container}>
        <Text style={styles.label}>{label}</Text>
  
        <TextInput
          {...props}
          placeholderTextColor={colors.textMuted}
          style={[
            styles.input,
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
      borderRadius: 16,
      backgroundColor: colors.surface,
      color: colors.text,
      fontSize: 16,
    },
  
    inputError: {
      borderColor: colors.danger,
    },
  
    error: {
      ...typography.caption,
      color: colors.danger,
    },
  });