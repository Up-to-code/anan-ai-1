import React from "react";
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from "react-native";
import { useThemedTheme, type ThemeTokens } from "../theme";

type ButtonVariant = "primary" | "secondary";

type ButtonProps = {
  onPress: () => void;
  children: string;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  accessibilityLabel?: string;
  accessibilityHint?: string;
};

function getButtonStyles(theme: ThemeTokens, variant: ButtonVariant) {
  const { colors, radius, spacing, fontSize, fontFamily } = theme;
  const isPrimary = variant === "primary";
  return {
    button: {
      backgroundColor: isPrimary ? colors.primary : colors.card,
      padding: spacing.md,
      borderRadius: radius.lg,
      alignItems: "center" as const,
      borderWidth: isPrimary ? 0 : 1,
      borderColor: colors.border,
      minHeight: 44,
      justifyContent: "center" as const,
    },
    text: {
      color: isPrimary ? colors.primaryForeground : colors.foreground,
      fontSize: fontSize.base,
      fontFamily: fontFamily.medium,
    },
  };
}

export function Button({
  onPress,
  children,
  variant = "primary",
  disabled = false,
  loading = false,
  style,
  textStyle,
  accessibilityLabel,
  accessibilityHint,
}: ButtonProps) {
  const theme = useThemedTheme();
  const { colors } = theme;
  const styles = React.useMemo(() => {
    const { button, text } = getButtonStyles(theme, variant);
    return StyleSheet.create({
      button: { ...button, opacity: disabled ? 0.7 : 1 },
      text,
    });
  }, [theme, variant, disabled]);

  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      accessibilityLabel={accessibilityLabel ?? children}
      accessibilityHint={accessibilityHint}
      accessibilityRole="button"
    >
      {loading ? (
        <ActivityIndicator color={colors.primaryForeground} size="small" />
      ) : (
        <Text style={[styles.text, textStyle]}>{children}</Text>
      )}
    </TouchableOpacity>
  );
}
