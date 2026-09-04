/**
 * Raw color palettes.
 * Never reference these directly in components — use semantic tokens from
 * `./tokens` instead.
 */

export interface ColorPalette {
  background: string;
  surface: string;
  elevatedSurface: string;
  primary: string;
  text: string;
  secondaryText: string;
  border: string;
  success: string;
  warning: string;
  error: string;
}

/**
 * Dark theme (mobile — WhatsApp-inspired)
 */
export const darkColors: ColorPalette = {
  background: "#020203",
  surface: "#0d1117",
  elevatedSurface: "#161b22",
  primary: "#25D366",
  text: "#ECECEC",
  secondaryText: "#8A8A8A",
  border: "#3A4A54",
  success: "#25D366",
  warning: "#FFA500",
  error: "#E53935",
};

/**
 * Light theme (web — Razorpay-inspired)
 */
export const lightColors: ColorPalette = {
  background: "#FFFFFF",
  surface: "#FFFFFF",
  elevatedSurface: "#F8F9FA",
  primary: "#5E6AD2",
  text: "#1A202C",
  secondaryText: "#718096",
  border: "#E2E8F0",
  success: "#48BB78",
  warning: "#FFA500",
  error: "#E53935",
};
