import React, { useMemo, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useThemedTheme, type ThemeTokens } from "../../theme";
import { PRICE_RANGES } from "../../lib/search-cache";

interface PriceRangeSliderProps {
  minPrice?: number;
  maxPrice?: number;
  onRangeChange: (min?: number, max?: number) => void;
  minLimit?: number;
  maxLimit?: number;
}

export function PriceRangeSlider({
  minPrice,
  maxPrice,
  onRangeChange,
  minLimit = 0,
  maxLimit = 10000000,
}: PriceRangeSliderProps) {
  const theme = useThemedTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const formatPrice = useCallback((price: number) => {
    if (price >= 1000000) {
      return `${(price / 1000000).toFixed(1)}M`;
    }
    if (price >= 1000) {
      return `${(price / 1000).toFixed(0)}K`;
    }
    return price.toString();
  }, []);

  const handlePresetSelect = useCallback(
    (min?: number, max?: number) => {
      onRangeChange(min, max);
    },
    [onRangeChange],
  );

  const isPresetSelected = (min?: number, max?: number) => {
    return minPrice === min && maxPrice === max;
  };

  const selectedLabel = useMemo(() => {
    if (!minPrice && !maxPrice) return "جميع الأسعار";
    if (minPrice && maxPrice) {
      return `${formatPrice(minPrice)} - ${formatPrice(maxPrice)}`;
    }
    if (maxPrice) return `أقل من ${formatPrice(maxPrice)}`;
    return `أكثر من ${formatPrice(minPrice!)}`;
  }, [minPrice, maxPrice, formatPrice]);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{selectedLabel}</Text>
      <View style={styles.presetsContainer}>
        <TouchableOpacity
          style={[
            styles.presetBtn,
            !minPrice && !maxPrice && styles.presetBtnSelected,
          ]}
          onPress={() => handlePresetSelect(undefined, undefined)}
          accessibilityLabel="جميع الأسعار"
          accessibilityRole="button"
        >
          <Text
            style={[
              styles.presetText,
              !minPrice && !maxPrice && styles.presetTextSelected,
            ]}
          >
            الكل
          </Text>
        </TouchableOpacity>

        {PRICE_RANGES.map((range, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.presetBtn,
              isPresetSelected(range.min, range.max) &&
                styles.presetBtnSelected,
            ]}
            onPress={() => handlePresetSelect(range.min, range.max)}
            accessibilityLabel={range.label}
            accessibilityRole="button"
          >
            <Text
              style={[
                styles.presetText,
                isPresetSelected(range.min, range.max) &&
                  styles.presetTextSelected,
              ]}
            >
              {formatPrice(range.min ?? 0)}
              {range.max ? `-${formatPrice(range.max)}` : "+"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function createStyles(theme: ThemeTokens) {
  const { colors, radius, spacing, fontSize, fontFamily } = theme;
  return StyleSheet.create({
    container: {
      paddingVertical: spacing.sm,
    },
    label: {
      fontSize: fontSize.base,
      fontFamily: fontFamily.medium,
      color: colors.foreground,
      marginBottom: spacing.sm,
      textAlign: "right",
    },
    presetsContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
      justifyContent: "flex-end",
    },
    presetBtn: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.md,
      backgroundColor: colors.secondary,
      borderWidth: 1,
      borderColor: colors.border,
      minHeight: 36,
      justifyContent: "center",
    },
    presetBtnSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    presetText: {
      fontSize: fontSize.sm,
      fontFamily: fontFamily.medium,
      color: colors.foreground,
    },
    presetTextSelected: {
      color: colors.primaryForeground,
    },
  });
}
