import { MaterialIcons } from "@expo/vector-icons";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import type { TimelineFilter } from "@/src/modules/timeline/utils/filterTimelineEvents";
import { colors, spacing, typography } from "@/src/shared/theme";

type TimelineFiltersProps = {
  query: string;
  filter: TimelineFilter;
  onQueryChange: (value: string) => void;
  onFilterChange: (filter: TimelineFilter) => void;
};

const FILTERS: {
  id: TimelineFilter;
  label: string;
}[] = [
  { id: "all", label: "Todos" },
  { id: "down", label: "DOWN" },
  { id: "up", label: "UP" },
  { id: "pending", label: "Pending" },
  { id: "maintenance", label: "Mant." },
];

export function TimelineFilters({
  query,
  filter,
  onQueryChange,
  onFilterChange,
}: TimelineFiltersProps) {
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
          placeholder="Buscar monitor, servidor o mensaje"
          placeholderTextColor={colors.textMuted}
          selectionColor={colors.primary}
          style={styles.input}
        />
        {query ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Limpiar búsqueda"
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
        {FILTERS.map((item) => {
          const selected = filter === item.id;

          return (
            <Pressable
              key={item.id}
              onPress={() =>
                onFilterChange(item.id)
              }
              style={[
                styles.filterChip,
                selected
                  ? styles.filterChipSelected
                  : null,
              ]}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selected
                    ? styles.filterChipTextSelected
                    : null,
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.surface,
  },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.text,
    paddingVertical: spacing.sm,
  },
  filterList: {
    gap: spacing.sm,
  },
  filterChip: {
    minHeight: 36,
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
  },
  filterChipSelected: {
    borderColor: colors.text,
    backgroundColor: colors.text,
  },
  filterChipText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  filterChipTextSelected: {
    color: colors.background,
  },
});
