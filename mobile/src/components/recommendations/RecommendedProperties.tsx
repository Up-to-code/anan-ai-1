import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useThemedTheme, type ThemeTokens } from "../../theme";
import {
  PropertyCardDetailed,
  type PropertyCardDetailedData,
} from "../property/PropertyCardDetailed";

interface RecommendedPropertiesProps {
  properties: PropertyCardDetailedData[];
  onPropertyPress?: (property: PropertyCardDetailedData) => void;
  onFavoritePress?: (propertyId: string) => void;
  favoriteIds?: Set<string>;
  title?: string;
  isLoading?: boolean;
  theme: ThemeTokens;
}

export function RecommendedProperties({
  properties,
  onPropertyPress,
  onFavoritePress,
  favoriteIds,
  title = "موصى بها",
  isLoading = false,
  theme,
}: RecommendedPropertiesProps) {
  const styles = useMemo(() => createStyles(theme), [theme]);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
        </View>
      </View>
    );
  }

  if (properties.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Ionicons name="star" size={16} color={theme.colors.primary} />
      </View>
      <FlatList
        data={properties}
        horizontal
        showsHorizontalScrollIndicator={false}
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
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

function createStyles(theme: ThemeTokens) {
  const { colors, spacing, fontSize, fontFamily } = theme;
  return StyleSheet.create({
    container: {
      marginVertical: spacing.sm,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-end",
      gap: spacing.xs,
      paddingHorizontal: spacing.md,
      marginBottom: spacing.sm,
    },
    title: {
      fontSize: fontSize.lg,
      fontFamily: fontFamily.bold,
      color: colors.foreground,
      textAlign: "right",
    },
    loadingContainer: {
      height: 200,
      justifyContent: "center",
      alignItems: "center",
    },
    listContent: {
      paddingHorizontal: spacing.md,
      gap: spacing.md,
    },
    cardWrapper: {
      width: 280,
    },
  });
}
