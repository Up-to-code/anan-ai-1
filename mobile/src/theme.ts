/**
 * Theme for mobile app - light/dark palettes, rounder radii, spacing.
 * Use getTheme(mode) or useThemedTheme() / useThemeColors() for mode-aware values.
 */

import { useMemo } from "react";
import { useTheme } from "./contexts/ThemeContext";
import type { ThemeMode } from "./contexts/ThemeContext";

const darkColors = {
  background: "#0a0a0f",
  foreground: "#fafafa",
  card: "#18181b",
  cardForeground: "#fafafa",
  primary: "#0B2C4B",
  primaryForeground: "#ffffff",
  sendButton: "#0B2C4B",
  secondary: "#27272a",
  secondaryForeground: "#fafafa",
  muted: "#27272a",
  mutedForeground: "#a1a1aa",
  accent: "#27272a",
  accentForeground: "#fafafa",
  destructive: "#7f1d1d",
  destructiveForeground: "#fafafa",
  border: "#27272a",
  input: "#27272a",
  ring: "#0B2C4B",
} as const;

const lightColors = {
  background: "#fafafa",
  foreground: "#0a0a0f",
  card: "#ffffff",
  cardForeground: "#0a0a0f",
  primary: "#0B2C4B",
  primaryForeground: "#ffffff",
  sendButton: "#0B2C4B",
  secondary: "#f4f4f5",
  secondaryForeground: "#0a0a0f",
  muted: "#f4f4f5",
  mutedForeground: "#71717a",
  accent: "#f4f4f5",
  accentForeground: "#0a0a0f",
  destructive: "#dc2626",
  destructiveForeground: "#fafafa",
  border: "#e4e4e7",
  input: "#e4e4e7",
  ring: "#0B2C4B",
} as const;

const radius = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 24,
  full: 9999,
} as const;

const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  "2xl": 40,
  "3xl": 48,
} as const;

const fontSize = {
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
} as const;

const fontFamily = {
  regular: "Cairo_400Regular",
  medium: "Cairo_500Medium",
  bold: "Cairo_700Bold",
} as const;

export type ThemeColors = { [K in keyof typeof darkColors]: string };

export type ThemeTokens = {
  colors: ThemeColors;
  radius: typeof radius;
  spacing: typeof spacing;
  fontSize: typeof fontSize;
  fontFamily: typeof fontFamily;
};

export function getTheme(mode: ThemeMode): ThemeTokens {
  return {
    colors: mode === "dark" ? darkColors : lightColors,
    radius,
    spacing,
    fontSize,
    fontFamily,
  };
}

export function useThemedTheme(): ThemeTokens {
  const { theme: mode } = useTheme();
  return useMemo(() => getTheme(mode), [mode]);
}

export function useThemeColors(): ThemeColors {
  return useThemedTheme().colors;
}

/** Shared tokens (radius, spacing, fontSize, fontFamily) for use when mode doesn't matter. */
export const themeTokens = {
  radius,
  spacing,
  fontSize,
  fontFamily,
} as const;

/** @deprecated Use getTheme(mode) or useThemedTheme() for mode-aware theme. Kept for backward compatibility during migration. */
export const theme: ThemeTokens = {
  colors: darkColors,
  radius,
  spacing,
  fontSize,
  fontFamily,
};

export type Theme = ThemeTokens;
