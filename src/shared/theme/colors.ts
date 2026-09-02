export const colors = {
  background: "#0B120F", // grafito — fondo
  surface: "#131C17", // superficie — cards, inputs
  surfaceElevated: "#18231D", // raised — modales, iconos sobre surface

  primary: "#2FBF87", // ok — UP, CTA, foco, enlace, toggle activo
  primaryDark: "#07130C", // ok-ink — texto/icono sobre primary

  text: "#EDF4EF", // papel — texto principal
  textSecondary: "#A9B8AE", // ink-soft — texto secundario
  textMuted: "#77887E", // ink-muted — solo no esencial

  border: "#24342B", // line — hairlines, bordes

  success: "#2FBF87", // UP (mismo token que primary)
  warning: "#E8B64C", // ámbar — PAUSED / pendiente / mantenimiento
  danger: "#E5484D", // DOWN / destructivo / error

  white: "#FFFFFF",
  black: "#000000",
  transparent: "transparent",
} as const;

export type AppColor = keyof typeof colors;
