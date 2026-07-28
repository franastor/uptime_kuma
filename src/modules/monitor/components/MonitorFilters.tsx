import { MaterialIcons } from "@expo/vector-icons";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

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
  onQueryChange: (value: string) => void;
  onFilterChange: (filter: MonitorFilter) => void;
}

const FILTERS: {
  id: MonitorFilter;
  label: string;
}[] = [
  { id: "all", label: "Todos" },
  { id: "up", label: "UP" },
  { id: "down", label: "DOWN" },
  { id: "paused", label: "Pausados" },
  { id: "favorites", label: "Favoritos" },
];

export function MonitorFilters({
  query,
  filter,
  onQueryChange,
  onFilterChange,
}: MonitorFiltersProps) {
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
          placeholder="Buscar por nombre, URL o etiqueta"
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
});
