import type { ViewStyle } from "react-native";

export const shadows = {
  soft: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  } satisfies ViewStyle,
} as const;
