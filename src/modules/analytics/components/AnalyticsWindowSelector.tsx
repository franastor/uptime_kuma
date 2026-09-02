import { Pressable, StyleSheet, Text, View } from "react-native";

import {
  ANALYTICS_WINDOWS,
  type AnalyticsWindow,
} from "@/src/modules/analytics/types/analytics";
import { colors, spacing, typography } from "@/src/shared/theme";

type AnalyticsWindowSelectorProps = {
  value: AnalyticsWindow;
  onChange: (window: AnalyticsWindow) => void;
};

export function AnalyticsWindowSelector({
  value,
  onChange,
}: AnalyticsWindowSelectorProps) {
  return (
    <View style={styles.container}>
      {ANALYTICS_WINDOWS.map((item) => {
        const selected = item.id === value;

        return (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onChange(item.id)}
            style={[
              styles.chip,
              selected ? styles.chipSelected : null,
            ]}
          >
            <Text
              style={[
                styles.chipText,
                selected
                  ? styles.chipTextSelected
                  : null,
              ]}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  chip: {
    minHeight: 36,
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.surfaceElevated,
  },
  chipSelected: {
    borderColor: colors.text,
    backgroundColor: colors.text,
  },
  chipText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  chipTextSelected: {
    color: colors.background,
  },
});
