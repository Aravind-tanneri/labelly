/**
 * Web design tokens.
 *
 * Re-exports the shared light theme (Razorpay-inspired supervisor UI) so
 * components never hardcode raw colors — all visual values come from
 * @labelly/shared design tokens.
 */
import {
  theme,
  lightColors,
  spacing,
  borderRadius,
  typography,
  type Theme,
} from "@labelly/shared";

export const light: Theme = theme.light;
export const colors = lightColors;
export { spacing, borderRadius, typography };
export type { Theme };

export const layout = {
  sidebarWidth: 232,
  headerHeight: 68,
  contentMaxWidth: 1280,
} as const;