import { MaterialIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet } from "react-native";

import { colors } from "@/src/shared/theme";

interface FavoriteButtonProps {
  favorite: boolean;
  disabled?: boolean;
  onPress: () => void;
}

export function FavoriteButton({
  favorite,
  disabled = false,
  onPress,
}: FavoriteButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        favorite
          ? "Quitar de favoritos"
          : "Añadir a favoritos"
      }
      disabled={disabled}
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <MaterialIcons
        name={favorite ? "star" : "star-border"}
        size={24}
        color={favorite ? colors.warning : colors.textMuted}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
  pressed: {
    opacity: 0.6,
    backgroundColor: colors.surfaceElevated,
  },
  disabled: {
    opacity: 0.4,
  },
});
