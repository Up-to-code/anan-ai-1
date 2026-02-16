import React, { useMemo, useCallback, useRef } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Text,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useThemedTheme, type ThemeTokens } from "../../theme";
import { FilterChip } from "./FilterChip";
import {
  SAUDI_CITIES,
  PROPERTY_TYPES,
  PRICE_RANGES,
  BEDS_OPTIONS,
  type SearchFilters,
} from "../../lib/search-cache";

interface FilterBarProps {
  filters: SearchFilters;
  onFiltersChange: (filters: Partial<SearchFilters>) => void;
  onClear?: () => void;
  showClear?: boolean;
}

export function FilterBar({
  filters,
  onFiltersChange,
  onClear,
  showClear = true,
}: FilterBarProps) {
  const theme = useThemedTheme();
  const scrollViewRef = useRef<ScrollView>(null);
  const styles = useMemo(() => createStyles(theme), [theme]);

  const hasActiveFilters = Boolean(
    filters.location ||
      filters.propertyType ||
      filters.minPrice ||
      filters.maxPrice ||
      filters.beds,
  );

  const selectedCity = SAUDI_CITIES.find((c) => c.value === filters.location);
  const selectedType = PROPERTY_TYPES.find(
    (t) => t.value === filters.propertyType,
  );
  const selectedPriceRange = PRICE_RANGES.find(
    (r) => r.min === filters.minPrice && r.max === filters.maxPrice,
  );
  const selectedBeds = BEDS_OPTIONS.find((b) => b.value === filters.beds);

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <FilterChip
          label={selectedCity?.label ?? "الموقع"}
          icon="location-outline"
          selected={!!filters.location}
          onPress={() => {
            // This would open a location picker modal
            // For now, cycle through cities
            const currentIndex = SAUDI_CITIES.findIndex(
              (c) => c.value === filters.location,
            );
            const nextIndex = (currentIndex + 1) % (SAUDI_CITIES.length + 1);
            if (nextIndex === SAUDI_CITIES.length) {
              onFiltersChange({ location: undefined });
            } else {
              onFiltersChange({ location: SAUDI_CITIES[nextIndex].value });
            }
          }}
        />

        <FilterChip
          label={selectedType?.label ?? "النوع"}
          icon="home-outline"
          selected={!!filters.propertyType}
          onPress={() => {
            const currentIndex = PROPERTY_TYPES.findIndex(
              (t) => t.value === filters.propertyType,
            );
            const nextIndex = (currentIndex + 1) % (PROPERTY_TYPES.length + 1);
            if (nextIndex === PROPERTY_TYPES.length) {
              onFiltersChange({ propertyType: undefined });
            } else {
              onFiltersChange({
                propertyType: PROPERTY_TYPES[nextIndex].value,
              });
            }
          }}
        />

        <FilterChip
          label={selectedBeds?.label ?? "الغرف"}
          icon="bed-outline"
          selected={!!filters.beds}
          onPress={() => {
            const currentIndex = BEDS_OPTIONS.findIndex(
              (b) => b.value === filters.beds,
            );
            const nextIndex = (currentIndex + 1) % (BEDS_OPTIONS.length + 1);
            if (nextIndex === BEDS_OPTIONS.length) {
              onFiltersChange({ beds: undefined });
            } else {
              onFiltersChange({ beds: BEDS_OPTIONS[nextIndex].value });
            }
          }}
        />

        <FilterChip
          label={selectedPriceRange?.label ?? "السعر"}
          icon="cash-outline"
          selected={!!filters.minPrice || !!filters.maxPrice}
          onPress={() => {
            const currentIndex = PRICE_RANGES.findIndex(
              (r) => r.min === filters.minPrice && r.max === filters.maxPrice,
            );
            const nextIndex = (currentIndex + 1) % (PRICE_RANGES.length + 1);
            if (nextIndex === PRICE_RANGES.length) {
              onFiltersChange({ minPrice: undefined, maxPrice: undefined });
            } else {
              onFiltersChange({
                minPrice: PRICE_RANGES[nextIndex].min,
                maxPrice: PRICE_RANGES[nextIndex].max,
              });
            }
          }}
        />
      </ScrollView>

      {hasActiveFilters && showClear && (
        <TouchableOpacity
          style={styles.clearBtn}
          onPress={onClear}
          accessibilityLabel="مسح الفلاتر"
        >
          <Ionicons
            name="close-circle"
            size={20}
            color={theme.colors.mutedForeground}
          />
        </TouchableOpacity>
      )}
    </View>
  );
}

function createStyles(theme: ThemeTokens) {
  const { colors, spacing } = theme;
  return StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: spacing.sm,
    },
    scrollContent: {
      paddingHorizontal: spacing.md,
      gap: spacing.sm,
      flexDirection: "row",
    },
    clearBtn: {
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
    },
  });
}

export { SAUDI_CITIES, PROPERTY_TYPES, PRICE_RANGES, BEDS_OPTIONS };
