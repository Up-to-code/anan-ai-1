import React from "react";
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle, I18nManager } from "react-native";
import { useThemedTheme, type ThemeTokens } from "../theme";

type ChipProps = {
  onPress: () => void;
  children: string;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  accessibilityLabel?: string;
};

function getChipStyles(theme: ThemeTokens) {
  const { colors, radius, spacing, fontSize, fontFamily } = theme;
  return StyleSheet.create({
    chip: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.lg,
      padding: spacing.md,
      minHeight: 44,
      justifyContent: "center" as const,
    },
    text: {
      color: colors.foreground,
      fontSize: fontSize.base,
      fontFamily: fontFamily.regular,
      textAlign: I18nManager.isRTL ? "right" : "left",
    },
  });
}

export function Chip({ onPress, children, disabled = false, style, textStyle, accessibilityLabel }: ChipProps) {
  const theme = useThemedTheme();
  const styles = React.useMemo(() => getChipStyles(theme), [theme]);
  return (
    <TouchableOpacity
      style={[styles.chip, style]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      accessibilityLabel={accessibilityLabel ?? children}
      accessibilityRole="button"
    >
      <Text style={[styles.text, textStyle]}>{children}</Text>
    </TouchableOpacity>
  );
}
