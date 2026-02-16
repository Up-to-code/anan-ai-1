import React, { useMemo } from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useThemedTheme, type ThemeTokens } from "../../theme";

interface FilterChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
  style?: ViewStyle;
  compact?: boolean;
}

export function FilterChip({
  label,
  selected = false,
  onPress,
  icon,
  disabled = false,
  style,
  compact = false,
}: FilterChipProps) {
  const theme = useThemedTheme();
  const styles = useMemo(() => createStyles(theme, compact), [theme, compact]);

  const containerStyle: ViewStyle[] = [
    styles.container,
    selected ? styles.containerSelected : {},
    disabled ? styles.containerDisabled : {},
    style,
  ].filter(Boolean) as ViewStyle[];

  const textStyle: TextStyle[] = [
    styles.label,
    selected ? styles.labelSelected : {},
    disabled ? styles.labelDisabled : {},
  ].filter(Boolean) as TextStyle[];

  return (
    <TouchableOpacity
      style={containerStyle}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      accessibilityLabel={label}
    >
      {icon ? (
        <Ionicons
          name={icon}
          size={compact ? 14 : 16}
          color={
            selected
              ? theme.colors.primaryForeground
              : theme.colors.mutedForeground
          }
          style={styles.icon}
        />
      ) : null}
      <Text style={textStyle} numberOfLines={1}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function createStyles(theme: ThemeTokens, compact: boolean) {
  const { colors, radius, spacing, fontSize, fontFamily } = theme;
  const paddingH = compact ? spacing.sm : spacing.md;
  const paddingV = compact ? spacing.xs : spacing.sm;
  const fontSz = compact ? fontSize.sm : fontSize.base;

  return StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: paddingH,
      paddingVertical: paddingV,
      borderRadius: radius.full,
      backgroundColor: colors.secondary,
      borderWidth: 1,
      borderColor: colors.border,
      minHeight: compact ? 28 : 36,
    },
    containerSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    containerDisabled: {
      opacity: 0.5,
    },
    icon: {
      marginEnd: spacing.xs,
    },
    label: {
      fontSize: fontSz,
      fontFamily: fontFamily.medium,
      color: colors.foreground,
    },
    labelSelected: {
      color: colors.primaryForeground,
    },
    labelDisabled: {
      color: colors.mutedForeground,
    },
  });
}
