export const typography = {
  fontFamily:
    "SF Pro Display, Segoe UI, Roboto, -apple-system, BlinkMacSystemFont, sans-serif",

  headings: {
    h1: { fontSize: 32, fontWeight: 700, lineHeight: 1.2 },
    h2: { fontSize: 24, fontWeight: 700, lineHeight: 1.3 },
    h3: { fontSize: 20, fontWeight: 600, lineHeight: 1.4 },
  },

  body: {
    large: { fontSize: 16, fontWeight: 400, lineHeight: 1.5 },
    regular: { fontSize: 14, fontWeight: 400, lineHeight: 1.5 },
    small: { fontSize: 12, fontWeight: 400, lineHeight: 1.4 },
  },
} as const;

export type TypographyKey =
  | keyof typeof typography.headings
  | keyof typeof typography.body;
