/**
 * PropertyList - Renders a list of property cards with optional delete
 */
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { PropertyCard, type PropertyCardData } from "./PropertyCard";
import type { ThemeTokens } from "../../theme";

interface PropertyListProps {
  properties: PropertyCardData[] | PropertyCardData;
  theme: ThemeTokens;
  onPropertyPress?: (property: PropertyCardData) => void;
  onPropertyDelete?: (property: PropertyCardData) => void;
}

export function PropertyList({
  properties,
  theme,
  onPropertyPress,
  onPropertyDelete,
}: PropertyListProps) {
  const list = Array.isArray(properties) ? properties : [properties];
  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        empty: { paddingVertical: theme.spacing.md },
        emptyText: {
          fontSize: theme.fontSize.sm,
          color: theme.colors.mutedForeground,
          fontFamily: theme.fontFamily.regular,
        },
      }),
    [theme],
  );
  if (list.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>لا توجد نتائج</Text>
      </View>
    );
  }
  return (
    <View style={{ gap: 8 }}>
      {list.map((p, i) => (
        <PropertyCard
          key={(p as { id?: string }).id ?? i}
          property={p}
          theme={theme}
          onPress={onPropertyPress}
          onDelete={onPropertyDelete}
        />
      ))}
    </View>
  );
}
