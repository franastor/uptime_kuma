export const fontFamilies = {
  display: {
    regular: "FamiljenGrotesk_400Regular",
    medium: "FamiljenGrotesk_500Medium",
    semiBold: "FamiljenGrotesk_600SemiBold",
    bold: "FamiljenGrotesk_700Bold",
  },
  mono: {
    regular: "MartianMono_400Regular",
    medium: "MartianMono_500Medium",
  },
} as const;

export const typography = {
  title: {
    fontFamily: "FamiljenGrotesk_700Bold",
    fontSize: 30,
    lineHeight: 36,
    letterSpacing: -0.8,
  },

  heading: {
    fontFamily: "FamiljenGrotesk_600SemiBold",
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.4,
  },

  body: {
    fontFamily: "FamiljenGrotesk_400Regular",
    fontSize: 16,
    lineHeight: 24,
  },

  bodyMedium: {
    fontFamily: "FamiljenGrotesk_600SemiBold",
    fontSize: 16,
    lineHeight: 24,
  },

  caption: {
    fontFamily: "FamiljenGrotesk_400Regular",
    fontSize: 13,
    lineHeight: 18,
  },

  label: {
    fontFamily: "FamiljenGrotesk_600SemiBold",
    fontSize: 13,
    lineHeight: 18,
  },

  button: {
    fontFamily: "FamiljenGrotesk_600SemiBold",
    fontSize: 16,
    lineHeight: 20,
  },

  mono: {
    fontFamily: "MartianMono_400Regular",
    fontSize: 13,
    lineHeight: 18,
  },

  monoMedium: {
    fontFamily: "MartianMono_500Medium",
    fontSize: 13,
    lineHeight: 18,
  },
} as const;
