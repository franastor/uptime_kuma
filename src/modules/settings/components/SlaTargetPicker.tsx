import { MaterialIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import {
  SLA_TARGET_PRESETS,
  formatSlaTargetPercent,
  nearestSlaPreset,
} from "@/src/modules/settings/types/appSettings";
import { colors, spacing, typography } from "@/src/shared/theme";

type SlaTargetPickerProps = {
  value: number;
  onChange: (value: number) => void;
  serverName?: string;
};

export function SlaTargetPicker({
  value,
  onChange,
  serverName,
}: SlaTargetPickerProps) {
  const current = nearestSlaPreset(value);
  const index = Math.max(
    0,
    SLA_TARGET_PRESETS.findIndex(
      (preset) => preset === current,
    ),
  );

  function step(delta: number): void {
    const nextIndex = Math.min(
      SLA_TARGET_PRESETS.length - 1,
      Math.max(0, index + delta),
    );
    onChange(SLA_TARGET_PRESETS[nextIndex]);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {serverName
          ? `SLA · ${serverName}`
          : "Objetivo SLA"}
      </Text>
      <Text style={styles.description}>
        {serverName
          ? "Solo aplica a los monitores de este servidor."
          : "Analytics marcará incumplido lo que quede por debajo de este umbral."}
      </Text>

      <View style={styles.dial}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Bajar objetivo SLA"
          disabled={index <= 0}
          onPress={() => step(-1)}
          style={({ pressed }) => [
            styles.arrow,
            pressed ? styles.arrowPressed : null,
            index <= 0 ? styles.arrowDisabled : null,
          ]}
        >
          <MaterialIcons
            name="chevron-left"
            size={32}
            color={
              index <= 0
                ? colors.textMuted
                : colors.textSecondary
            }
          />
        </Pressable>

        <View style={styles.valueBlock}>
          <Text style={styles.value}>
            {formatSlaTargetPercent(current)}
          </Text>
          <Text style={styles.valueHint}>
            {index + 1} /{" "}
            {SLA_TARGET_PRESETS.length}
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Subir objetivo SLA"
          disabled={
            index >= SLA_TARGET_PRESETS.length - 1
          }
          onPress={() => step(1)}
          style={({ pressed }) => [
            styles.arrow,
            pressed ? styles.arrowPressed : null,
            index >=
            SLA_TARGET_PRESETS.length - 1
              ? styles.arrowDisabled
              : null,
          ]}
        >
          <MaterialIcons
            name="chevron-right"
            size={32}
            color={
              index >=
              SLA_TARGET_PRESETS.length - 1
                ? colors.textMuted
                : colors.textSecondary
            }
          />
        </Pressable>
      </View>

      <View style={styles.presets}>
        {SLA_TARGET_PRESETS.map((preset) => {
          const selected = preset === current;

          return (
            <Pressable
              key={preset}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => onChange(preset)}
              style={[
                styles.preset,
                selected
                  ? styles.presetSelected
                  : null,
              ]}
            >
              <Text
                style={[
                  styles.presetText,
                  selected
                    ? styles.presetTextSelected
                    : null,
                ]}
              >
                {formatSlaTargetPercent(preset)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  label: {
    ...typography.bodyMedium,
    color: colors.text,
  },
  description: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  dial: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
  arrow: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
  },
  arrowPressed: {
    backgroundColor: colors.surface,
  },
  arrowDisabled: {
    opacity: 0.5,
  },
  valueBlock: {
    alignItems: "center",
    gap: spacing.xs,
  },
  value: {
    fontFamily: "MartianMono_500Medium",
    fontSize: 30,
    lineHeight: 36,
    color: colors.text,
  },
  valueHint: {
    ...typography.caption,
    color: colors.textMuted,
  },
  presets: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  preset: {
    minHeight: 34,
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
  },
  presetSelected: {
    borderColor: colors.text,
    backgroundColor: colors.text,
  },
  presetText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  presetTextSelected: {
    color: colors.background,
  },
});
