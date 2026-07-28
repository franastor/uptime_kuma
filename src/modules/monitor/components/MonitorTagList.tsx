import { StyleSheet, Text, View } from "react-native";

import type { MonitorTag } from "@/src/modules/monitor/types/monitor";
import { colors, spacing, typography } from "@/src/shared/theme";

interface MonitorTagListProps {
  tags: MonitorTag[];
  maxVisible?: number;
}

export function MonitorTagList({
  tags,
  maxVisible = 3,
}: MonitorTagListProps) {
  if (tags.length === 0) {
    return null;
  }

  const visibleTags = tags.slice(0, maxVisible);
  const hiddenCount = tags.length - visibleTags.length;

  return (
    <View style={styles.container}>
      {visibleTags.map((tag) => (
        <View
          key={tag.id}
          style={[
            styles.tag,
            tag.color
              ? { borderColor: tag.color }
              : null,
          ]}
        >
          <Text style={styles.tagText} numberOfLines={1}>
            {tag.name}
            {tag.value ? `: ${tag.value}` : ""}
          </Text>
        </View>
      ))}

      {hiddenCount > 0 ? (
        <View style={styles.tag}>
          <Text style={styles.tagText}>+{hiddenCount}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  tag: {
    maxWidth: 150,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    backgroundColor: colors.surfaceElevated,
  },
  tagText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
