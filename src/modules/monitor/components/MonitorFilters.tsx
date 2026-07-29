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

          return (
            <Pressable
              key={item.id}
              onPress={() => onFilterChange(item.id)}
              style={({ pressed }) => [
                styles.filterChip,
                selected && styles.selectedFilterChip,
                pressed && styles.filterChipPressed,
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  selected && styles.selectedFilterText,
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
                  name="workspace-premium"
                  size={12}
                  color={colors.warning}
                />
                <Text style={styles.premiumBadgeText}>
                  {t("common.premium")}
                </Text>
              </View>
            ) : selectedTags.length > 0 && onClearTags ? (
              <Pressable
                accessibilityRole="button"
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
                    pressed ? styles.filterChipPressed : null,
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
    borderRadius: 16,
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
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    backgroundColor: colors.surface,
  },
  selectedFilterChip: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceElevated,
  },
  filterChipPressed: {
    opacity: 0.7,
  },
  filterText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: "700",
  },
  selectedFilterText: {
    color: colors.primary,
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
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  premiumBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  premiumBadgeText: {
    ...typography.caption,
    color: colors.warning,
    fontWeight: "700",
  },
  clearTags: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: "700",
  },
  tagChip: {
    maxWidth: 180,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    backgroundColor: colors.surface,
  },
  tagChipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  tagChipLocked: {
    opacity: 0.85,
  },
  tagChipText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: "700",
  },
  tagChipTextSelected: {
    color: colors.background,
  },
});
