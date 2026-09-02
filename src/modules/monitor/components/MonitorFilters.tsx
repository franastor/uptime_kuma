import { MaterialIcons } from "@expo/vector-icons";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useTranslation } from "@/src/shared/i18n/useTranslation";
import { colors, spacing, typography } from "@/src/shared/theme";

export type MonitorFilter =
  | "all"
  | "up"
  | "down"
  | "paused"
  | "favorites";

const FILTER_DOT_COLORS: Partial<
  Record<MonitorFilter, string>
> = {
  up: colors.success,
  down: colors.danger,
  paused: colors.warning,
};

interface MonitorFiltersProps {
  query: string;
  filter: MonitorFilter;
  availableTags: string[];
  selectedTags: string[];
  canFilterByTags: boolean;
  onQueryChange: (value: string) => void;
  onFilterChange: (filter: MonitorFilter) => void;
  onToggleTag: (tag: string) => void;
  onRequestTagPremium?: () => void;
  onClearTags?: () => void;
}

export function MonitorFilters({
  query,
  filter,
  availableTags,
  selectedTags,
  canFilterByTags,
  onQueryChange,
  onFilterChange,
  onToggleTag,
  onRequestTagPremium,
  onClearTags,
}: MonitorFiltersProps) {
  const { t } = useTranslation();

  const filters: {
    id: MonitorFilter;
    label: string;
  }[] = [
    { id: "all", label: t("monitors.filterAll") },
    { id: "up", label: t("monitors.filterUp") },
    { id: "down", label: t("monitors.filterDown") },
    { id: "paused", label: t("monitors.filterPaused") },
    {
      id: "favorites",
      label: t("monitors.filterFavorites"),
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <MaterialIcons
          name="search"
          size={22}
          color={colors.textMuted}
        />
        <TextInput
          value={query}
          onChangeText={onQueryChange}
          placeholder={t("monitors.searchPlaceholder")}
          placeholderTextColor={colors.textMuted}
          selectionColor={colors.primary}
          autoCorrect={false}
          autoCapitalize="none"
          style={styles.input}
        />
        {query ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("monitors.clearSearch")}
            hitSlop={8}
            onPress={() => onQueryChange("")}
          >
            <MaterialIcons
              name="cancel"
              size={20}
              color={colors.textMuted}
            />
          </Pressable>
        ) : null}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterList}
      >
        {filters.map((item) => {
          const selected = item.id === filter;
          const dotColor = FILTER_DOT_COLORS[item.id];

          return (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              hitSlop={4}
              onPress={() => onFilterChange(item.id)}
              style={({ pressed }) => [
                styles.filterChip,
                selected && styles.selectedChip,
                pressed && styles.chipPressed,
              ]}
            >
              {dotColor ? (
                <View
                  style={[
                    styles.filterDot,
                    { backgroundColor: dotColor },
                  ]}
                />
              ) : null}
              <Text
                style={[
                  styles.filterText,
                  selected && styles.selectedText,
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {availableTags.length > 0 ? (
        <View style={styles.tagsBlock}>
          <View style={styles.tagsHeader}>
            <Text style={styles.tagsTitle}>
              {t("monitors.tags")}
            </Text>
            {!canFilterByTags ? (
              <View style={styles.premiumBadge}>
                <MaterialIcons
                  name="lock"
                  size={12}
                  color={colors.textMuted}
                />
                <Text style={styles.premiumBadgeText}>
                  {t("common.premium")}
                </Text>
              </View>
            ) : selectedTags.length > 0 && onClearTags ? (
              <Pressable
                accessibilityRole="button"
                hitSlop={8}
                onPress={onClearTags}
              >
                <Text style={styles.clearTags}>
                  {t("common.clear")}
                </Text>
              </Pressable>
            ) : null}
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterList}
          >
            {availableTags.map((tag) => {
              const selected =
                canFilterByTags &&
                selectedTags.includes(tag);

              return (
                <Pressable
                  key={tag}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  hitSlop={4}
                  onPress={() => {
                    if (!canFilterByTags) {
                      onRequestTagPremium?.();
                      return;
                    }

                    onToggleTag(tag);
                  }}
                  style={({ pressed }) => [
                    styles.tagChip,
                    selected ? styles.tagChipSelected : null,
                    !canFilterByTags
                      ? styles.tagChipLocked
                      : null,
                    pressed ? styles.chipPressed : null,
                  ]}
                >
                  {!canFilterByTags ? (
                    <MaterialIcons
                      name="lock"
                      size={12}
                      color={colors.textMuted}
                    />
                  ) : null}
                  <Text
                    style={[
                      styles.tagChipText,
                      selected
                        ? styles.tagChipTextSelected
                        : null,
                    ]}
                    numberOfLines={1}
                  >
                    {tag}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  searchContainer: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.surface,
  },
  input: {
    ...typography.body,
    flex: 1,
    color: colors.text,
  },
  filterList: {
    gap: spacing.sm,
  },
  filterChip: {
    minHeight: 36,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.surface,
  },
  selectedChip: {
    borderColor: colors.text,
    backgroundColor: colors.text,
  },
  chipPressed: {
    opacity: 0.75,
  },
  filterDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  filterText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  selectedText: {
    color: colors.background,
  },
  tagsBlock: {
    gap: spacing.sm,
  },
  tagsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  tagsTitle: {
    ...typography.caption,
    color: colors.textMuted,
  },
  premiumBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  premiumBadgeText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  clearTags: {
    ...typography.label,
    color: colors.primary,
  },
  tagChip: {
    maxWidth: 180,
    minHeight: 36,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.surface,
  },
  tagChipSelected: {
    borderColor: colors.text,
    backgroundColor: colors.text,
  },
  tagChipLocked: {
    opacity: 0.85,
  },
  tagChipText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  tagChipTextSelected: {
    color: colors.background,
  },
});
