import { darkColors, lightColors, type ColorPalette } from "./colors";
import { spacing, borderRadius } from "./spacing";
import { typography } from "./typography";

export type ThemeMode = "dark" | "light";

export interface Theme {
  mode: ThemeMode;
  colors: ColorPalette;
  spacing: typeof spacing;
  borderRadius: typeof borderRadius;
  typography: typeof typography;
}

export const theme: Record<ThemeMode, Theme> = {
  dark: {
    mode: "dark",
    colors: darkColors,
    spacing,
    borderRadius,
    typography,
  },
  light: {
    mode: "light",
    colors: lightColors,
    spacing,
    borderRadius,
    typography,
  },
};

export const colors = {
  dark: darkColors,
  light: lightColors,
};

export { darkColors, lightColors, spacing, borderRadius, typography };
export type { ColorPalette };
