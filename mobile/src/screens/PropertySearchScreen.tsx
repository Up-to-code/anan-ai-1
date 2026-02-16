import React, { useMemo, useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useThemedTheme, type ThemeTokens } from "../theme";
import { useSession } from "../lib/auth-client";
import {
  useSearchProperties,
  type SearchResult,
} from "../hooks/useSearchProperties";
import {
  PropertyCardDetailed,
  type PropertyCardDetailedData,
} from "../components/property/PropertyCardDetailed";
import type { RootStackParamList } from "../navigation/RootNavigator";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function PropertySearchScreen() {
  const theme = useThemedTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { data: session } = useSession();
  const userId = session?.user?.id;

  const [searchText, setSearchText] = useState("");

  const {
    results,
    isLoading,
    isLoadingMore,
    loadMore,
    hasResults,
    performSearch,
    lastSearchContext,
    isFromCache,
  } = useSearchProperties(userId);

  const styles = useMemo(() => createStyles(theme, insets), [theme, insets]);

  const handlePropertyPress = useCallback(
    (item: SearchResult) => {
      const isRealPropertyId =
        !item._id.startsWith("cached-") && !item._id.startsWith("recent-");

      if (isRealPropertyId) {
        navigation.navigate("PropertyDetail", { propertyId: item._id });
      } else {
        navigation.navigate("PropertyDetail", {
          propertyId: item._id,
          cachedProperty: {
            title: item.title,
            address: item.address,
            description: item.description,
            price: item.price,
            beds: item.beds,
            baths: item.baths,
            sqft: item.sqft,
            location: item.location,
            imageUrls: item.imageUrls,
            imageUrl: item.imageUrl,
            propertyUrl: item.propertyUrl,
            features: item.features,
          },
        });
      }
    },
    [navigation],
  );

  const handleSearch = useCallback(() => {
    if (searchText.trim()) {
      performSearch(searchText.trim());
    }
  }, [searchText, performSearch]);

  const renderItem = useCallback(
    ({ item }: { item: SearchResult }) => {
      const propertyData: PropertyCardDetailedData = {
        id: item._id,
        title: item.title,
        address: item.address,
        price: item.price,
        beds: item.beds,
        baths: item.baths,
        sqft: item.sqft,
        location: item.location,
        imageUrl: item.imageUrl || item.imageUrls?.[0],
        status: item.status,
      };
      return (
        <PropertyCardDetailed
          property={propertyData}
          onPress={() => handlePropertyPress(item)}
          theme={theme}
        />
      );
    },
    [handlePropertyPress, theme],
  );

  const renderFooter = useCallback(() => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
      </View>
    );
  }, [isLoadingMore, styles, theme]);

  const renderEmpty = useCallback(
    () => (
      <View style={styles.emptyContainer}>
        <Ionicons
          name="search-outline"
          size={48}
          color={theme.colors.mutedForeground}
        />
        <Text style={styles.emptyText}>
          {isLoading ? "جاري البحث..." : "لم يتم العثور على نتائج"}
        </Text>
      </View>
    ),
    [isLoading, styles, theme],
  );

  const renderHeader = useCallback(() => {
    if (isFromCache && lastSearchContext) {
      return (
        <View style={styles.cacheHeader}>
          <Ionicons
            name="time-outline"
            size={16}
            color={theme.colors.mutedForeground}
          />
          <Text style={styles.cacheHeaderText}>
            نتائج من بحثك السابق: "{lastSearchContext.query}"
          </Text>
        </View>
      );
    }
    return null;
  }, [isFromCache, lastSearchContext, styles, theme]);

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <View style={styles.searchInputWrap}>
          <TouchableOpacity onPress={handleSearch} accessibilityLabel="بحث">
            <Ionicons name="search" size={20} color={theme.colors.primary} />
          </TouchableOpacity>
          <TextInput
            style={styles.searchInput}
            placeholder="ابحث عن عقار..."
            placeholderTextColor={theme.colors.mutedForeground}
            value={searchText}
            onChangeText={setSearchText}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            textAlign="right"
            accessibilityLabel="بحث"
          />
          {searchText.length > 0 ? (
            <TouchableOpacity
              onPress={() => setSearchText("")}
              accessibilityLabel="مسح البحث"
            >
              <Ionicons
                name="close-circle"
                size={20}
                color={theme.colors.mutedForeground}
              />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <FlatList
        data={results}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        onEndReached={loadMore ?? undefined}
        onEndReachedThreshold={0.5}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

function createStyles(theme: ThemeTokens, insets: { bottom: number }) {
  const { colors, radius, spacing, fontSize, fontFamily } = theme;
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    searchBar: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      backgroundColor: colors.background,
    },
    searchInputWrap: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.input,
      borderRadius: radius.lg,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      gap: spacing.sm,
    },
    searchInput: {
      flex: 1,
      fontSize: fontSize.base,
      fontFamily: fontFamily.regular,
      color: colors.foreground,
      textAlign: "right",
    },
    cacheHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.xs,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      backgroundColor: colors.secondary,
      marginHorizontal: spacing.md,
      marginBottom: spacing.sm,
      borderRadius: radius.md,
    },
    cacheHeaderText: {
      fontSize: fontSize.sm,
      color: colors.mutedForeground,
      fontFamily: fontFamily.regular,
    },
    listContent: {
      padding: spacing.md,
      paddingBottom: spacing["2xl"],
    },
    footerLoader: {
      paddingVertical: spacing.lg,
      alignItems: "center",
    },
    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingVertical: spacing["3xl"],
    },
    emptyText: {
      marginTop: spacing.md,
      fontSize: fontSize.base,
      color: colors.mutedForeground,
      fontFamily: fontFamily.regular,
    },
  });
}
