import { MaterialIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import {
  LOCALE_OPTIONS,
  type AppLocalePreference,
} from "@/src/shared/i18n";
import { useTranslation } from "@/src/shared/i18n/useTranslation";
import { colors, spacing, typography } from "@/src/shared/theme";

type LanguagePickerProps = {
  value: AppLocalePreference;
  onChange: (locale: AppLocalePreference) => void;
};

export function LanguagePicker({
  value,
  onChange,
}: LanguagePickerProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <MaterialIcons
          name="translate"
          size={22}
          color={colors.textSecondary}
        />
        <View style={styles.headerText}>
          <Text style={styles.title}>
            {t("language.title")}
          </Text>
          <Text style={styles.description}>
            {t("language.description")}
          </Text>
        </View>
      </View>

      <View style={styles.options}>
        {LOCALE_OPTIONS.map((option) => {
          const selected = option.id === value;

          return (
            <Pressable
              key={option.id}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => onChange(option.id)}
              style={({ pressed }) => [
                styles.option,
                selected ? styles.optionSelected : null,
                pressed ? styles.optionPressed : null,
              ]}
            >
              <View style={styles.optionText}>
                <Text
                  style={[
                    styles.optionLabel,
                    selected
                      ? styles.optionLabelSelected
                      : null,
                  ]}
                >
                  {t(option.labelKey)}
                </Text>
                {option.hintKey ? (
                  <Text style={styles.optionHint}>
                    {t(option.hintKey)}
                  </Text>
                ) : null}
              </View>
              <MaterialIcons
                name={
                  selected
                    ? "radio-button-checked"
                    : "radio-button-unchecked"
                }
                size={22}
                color={
                  selected
                    ? colors.background
                    : colors.textMuted
                }
              />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: spacing.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  title: {
    ...typography.bodyMedium,
    color: colors.text,
  },
  description: {
    ...typography.caption,
    color: colors.textMuted,
  },
  options: {
    gap: spacing.sm,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
  },
  optionSelected: {
    borderColor: colors.text,
    backgroundColor: colors.text,
  },
  optionPressed: {
    opacity: 0.75,
  },
  optionText: {
    flex: 1,
    gap: 2,
  },
  optionLabel: {
    ...typography.bodyMedium,
    color: colors.text,
  },
  optionLabelSelected: {
    color: colors.background,
  },
  optionHint: {
    ...typography.caption,
    color: colors.textMuted,
  },
});
