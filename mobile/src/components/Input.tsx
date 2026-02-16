import React from "react";
import {
  View,
  TextInput,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from "react-native";
import { useThemedTheme, type ThemeTokens } from "../theme";

type InputProps = TextInputProps & {
  containerStyle?: ViewStyle;
  writingDirection?: "ltr" | "rtl" | "auto";
};

function getInputStyles(theme: ThemeTokens) {
  const { colors, radius, spacing, fontSize, fontFamily } = theme;
  return StyleSheet.create({
    input: {
      backgroundColor: colors.input,
      borderRadius: radius.lg,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      minHeight: 44,
      color: colors.foreground,
      fontSize: fontSize.base,
      fontFamily: fontFamily.regular,
    },
    rtlWrapper: {
      flex: 1,
      minWidth: 0,
    },
  });
}

export function Input({
  containerStyle,
  placeholderTextColor,
  style,
  writingDirection,
  ...rest
}: InputProps) {
  const theme = useThemedTheme();
  const styles = React.useMemo(() => getInputStyles(theme), [theme]);
  const textInput = (
    <TextInput
      style={[styles.input, style]}
      placeholderTextColor={
        placeholderTextColor ?? theme.colors.mutedForeground
      }
      {...rest}
    />
  );
  if (writingDirection === "rtl") {
    return (
      <View
        style={[styles.rtlWrapper, containerStyle]}
        accessibilityElementsHidden
      >
        {textInput}
      </View>
    );
  }
  return textInput;
}
