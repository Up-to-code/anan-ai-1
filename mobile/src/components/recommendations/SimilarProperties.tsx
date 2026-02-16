import React, { useMemo } from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";
import { useThemedTheme, type ThemeTokens } from "../../theme";
import {
  PropertyCardDetailed,
  type PropertyCardDetailedData,
} from "../property/PropertyCardDetailed";

interface SimilarPropertiesProps {
  properties: PropertyCardDetailedData[];
  currentPropertyId?: string;
  onPropertyPress?: (property: PropertyCardDetailedData) => void;
  onFavoritePress?: (propertyId: string) => void;
  favoriteIds?: Set<string>;
  theme: ThemeTokens;
}

export function SimilarProperties({
  properties,
  currentPropertyId,
  onPropertyPress,
  onFavoritePress,
  favoriteIds,
  theme,
}: SimilarPropertiesProps) {
  const styles = useMemo(() => createStyles(theme), [theme]);

  const filteredProperties = useMemo(
    () => properties.filter((p) => p.id !== currentPropertyId).slice(0, 4),
    [properties, currentPropertyId],
  );

  if (filteredProperties.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>عقارات مشابهة</Text>
      <FlatList
        data={filteredProperties}
        numColumns={2}
        scrollEnabled={false}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.cardWrapper}>
            <PropertyCardDetailed
              property={item}
              onPress={() => onPropertyPress?.(item)}
              theme={theme}
            />
          </View>
        )}
        columnWrapperStyle={styles.row}
      />
    </View>
  );
}

function createStyles(theme: ThemeTokens) {
  const { colors, spacing, fontSize, fontFamily } = theme;
  return StyleSheet.create({
    container: {
      marginTop: spacing.lg,
    },
    title: {
      fontSize: fontSize.lg,
      fontFamily: fontFamily.bold,
      color: colors.foreground,
      textAlign: "right",
      marginBottom: spacing.md,
      paddingHorizontal: spacing.md,
    },
    row: {
      justifyContent: "space-between",
      paddingHorizontal: spacing.md,
    },
    cardWrapper: {
      flex: 1,
      marginHorizontal: spacing.xs,
    },
  });
}
