export const colors = {
    background: "#07110D",
    surface: "#0D1F17",
    surfaceElevated: "#132A20",
  
    primary: "#5CDD8B",
    primaryDark: "#32B867",
  
    text: "#F5FFF8",
    textSecondary: "#A7B8AD",
    textMuted: "#6F8276",
  
    border: "#1E3A2B",
  
    success: "#45D483",
    warning: "#F5C451",
    danger: "#F06464",
    info: "#5FA8FF",
  
    white: "#FFFFFF",
    black: "#000000",
    transparent: "transparent",
  } as const;
  
  export type AppColor = keyof typeof colors;