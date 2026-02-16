import React, { useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useThemedTheme, type ThemeTokens } from "../theme";
import { useSession } from "../lib/auth-client";
import { useFavorites } from "../hooks/useFavorites";
import {
  PropertyCardDetailed,
  type PropertyCardDetailedData,
} from "../components/property/PropertyCardDetailed";
import type { RootStackParamList } from "../navigation/RootNavigator";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function FavoritesScreen() {
  const theme = useThemedTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { data: session } = useSession();
  const userId = session?.user?.id;

  const { favorites, toggleFavorite, favoriteIds, isLoading, count } =
    useFavorites(userId);

  const styles = useMemo(() => createStyles(theme, insets), [theme, insets]);

  const handlePropertyPress = useCallback(
    (property: PropertyCardDetailedData) => {
      navigation.navigate("PropertyDetail", { propertyId: property.id });
    },
    [navigation],
  );

  const handleFavoritePress = useCallback(
    async (propertyId: string) => {
      await toggleFavorite(propertyId);
    },
    [toggleFavorite],
  );

  const propertyData: PropertyCardDetailedData[] = useMemo(() => {
    return favorites.map((fav) => ({
      id: fav.entityId,
      title: `عقار محفوظ`,
      address: "العنوان غير متوفر",
      type: "buy" as const,
    }));
  }, [favorites]);

  const renderItem = useCallback(
    ({ item }: { item: PropertyCardDetailedData }) => (
      <PropertyCardDetailed
        property={item}
        onPress={() => handlePropertyPress(item)}
        theme={theme}
      />
    ),
    [handlePropertyPress, theme],
  );

  const renderEmpty = useCallback(
    () => (
      <View style={styles.emptyContainer}>
        <Ionicons
          name="heart-outline"
          size={64}
          color={theme.colors.mutedForeground}
        />
        <Text style={styles.emptyTitle}>لا توجد عقارات محفوظة</Text>
        <Text style={styles.emptyText}>
          احفظ العقارات التي تعجبك لتجدها هنا بسهولة
        </Text>
        <TouchableOpacity
          style={styles.browseBtn}
          onPress={() => navigation.navigate("PropertySearch")}
        >
          <Text style={styles.browseBtnText}>تصفح العقارات</Text>
        </TouchableOpacity>
      </View>
    ),
    [styles, theme, navigation],
  );

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.countText}>{count} عقار محفوظ</Text>
      </View>

      <FlatList
        data={propertyData}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

function createStyles(
  theme: ThemeTokens,
  insets: { top: number; bottom: number },
) {
  const { colors, radius, spacing, fontSize, fontFamily } = theme;
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    centerContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.background,
    },
    header: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    countText: {
      fontSize: fontSize.base,
      fontFamily: fontFamily.medium,
      color: colors.mutedForeground,
      textAlign: "right",
    },
    listContent: {
      padding: spacing.md,
      paddingBottom: spacing["2xl"],
    },
    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingVertical: spacing["3xl"],
      paddingHorizontal: spacing.lg,
    },
    emptyTitle: {
      marginTop: spacing.lg,
      fontSize: fontSize.lg,
      fontFamily: fontFamily.bold,
      color: colors.foreground,
      textAlign: "center",
    },
    emptyText: {
      marginTop: spacing.sm,
      fontSize: fontSize.base,
      color: colors.mutedForeground,
      fontFamily: fontFamily.regular,
      textAlign: "center",
    },
    browseBtn: {
      marginTop: spacing.xl,
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.md,
      backgroundColor: colors.primary,
      borderRadius: radius.lg,
    },
    browseBtnText: {
      color: colors.primaryForeground,
      fontSize: fontSize.base,
      fontFamily: fontFamily.medium,
    },
  });
}
