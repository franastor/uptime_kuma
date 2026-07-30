import { Image, StyleSheet, Text, View } from "react-native";

import { branding, colors, spacing, typography } from "@/src/shared/theme";

type BrandHeaderProps = {
  compact?: boolean;
};

export function BrandHeader({ compact = false }: BrandHeaderProps) {
  return (
    <View style={[styles.container, compact && styles.compact]}>
      <Image
        accessibilityLabel="KumaPulse"
        resizeMode="contain"
        source={require("@/assets/images/kumapulse-mark.png")}
        style={[styles.mark, compact && styles.compactMark]}
      />
      <View style={styles.copy}>
        <Text style={[styles.name, compact && styles.compactName]}>
          {branding.name}
        </Text>
        <Text style={styles.tagline}>{branding.tagline}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  compact: {
    flexDirection: "row",
    justifyContent: "flex-start",
    marginBottom: spacing.lg,
  },
  mark: { width: 96, height: 96 },
  compactMark: { width: 56, height: 56 },
  copy: { alignItems: "center", gap: spacing.xs },
  name: { ...typography.title, color: colors.text, letterSpacing: -0.8 },
  compactName: { fontSize: 24, lineHeight: 28 },
  tagline: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: "center",
  },
});
