import React, { useMemo, useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useThemedTheme, type ThemeTokens } from "../theme";
import { useSession } from "../lib/auth-client";
import { usePropertyDetail } from "../hooks/usePropertyDetail";
import { useFavorites } from "../hooks/useFavorites";
import { PropertyImageGallery } from "../components/property/PropertyImageGallery";
import type { RootStackParamList } from "../navigation/RootNavigator";

type PropertyDetailRoute = RouteProp<RootStackParamList, "PropertyDetail">;

interface CachedProperty {
  title: string;
  address?: string;
  description?: string;
  price?: number;
  beds?: number;
  baths?: number;
  sqft?: number;
  location?: string;
  imageUrls?: string[];
  imageUrl?: string;
  propertyUrl?: string;
  features?: string[];
}

export function PropertyDetailScreen() {
  const theme = useThemedTheme();
  const insets = useSafeAreaInsets();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<PropertyDetailRoute>();
  const { propertyId, threadId, cachedProperty } = route.params;

  const { data: session } = useSession();
  const userId = session?.user?.id;

  const isRealPropertyId =
    !propertyId.startsWith("cached-") && !propertyId.startsWith("recent-");

  const {
    property: dbProperty,
    isLoading,
    isError,
    trackView,
    trackLike,
    trackUnlike,
    trackShare,
  } = usePropertyDetail(isRealPropertyId ? propertyId : undefined, userId);

  const { toggleFavorite, isFavorite } = useFavorites(userId);

  const [viewTracked, setViewTracked] = useState(false);

  const styles = useMemo(() => createStyles(theme, insets), [theme, insets]);

  const property = useMemo(() => {
    if (cachedProperty) {
      return {
        _id: propertyId,
        title: cachedProperty.title,
        address: cachedProperty.address ?? "",
        description: cachedProperty.description ?? "",
        price: cachedProperty.price,
        beds: cachedProperty.beds,
        baths: cachedProperty.baths,
        sqft: cachedProperty.sqft,
        location: cachedProperty.location,
        imageUrl: cachedProperty.imageUrl,
        imageUrls: cachedProperty.imageUrls,
        propertyUrl: cachedProperty.propertyUrl,
        features: cachedProperty.features,
        status: "available" as const,
      };
    }

    if (dbProperty) {
      return {
        ...dbProperty,
        imageUrls: dbProperty.imageUrl ? [dbProperty.imageUrl] : [],
      };
    }

    return null;
  }, [cachedProperty, dbProperty, propertyId]);

  useEffect(() => {
    if (property && !viewTracked && isRealPropertyId) {
      trackView({ source: "detail_screen" });
      setViewTracked(true);
    }
  }, [property, viewTracked, trackView, isRealPropertyId]);

  const handleFavoritePress = useCallback(async () => {
    if (!propertyId || !isRealPropertyId) return;
    const result = await toggleFavorite(propertyId);
    if (result) {
      if (isFavorite(propertyId)) {
        trackUnlike();
      } else {
        trackLike();
      }
    }
  }, [
    propertyId,
    isRealPropertyId,
    toggleFavorite,
    isFavorite,
    trackLike,
    trackUnlike,
  ]);

  const handleShare = useCallback(async () => {
    if (!property) return;
    if (isRealPropertyId) trackShare();
    try {
      const shareUrl =
        property.propertyUrl ?? `https://anan.ai/property/${propertyId}`;
      await Linking.openURL(
        `whatsapp://send?text=${encodeURIComponent(`${property.title}\n${shareUrl}`)}`,
      );
    } catch {
      Alert.alert("مشاركة", "تعذر فتح واتساب للمشاركة");
    }
  }, [property, propertyId, trackShare, isRealPropertyId]);

  const handleAskAbout = useCallback(() => {
    if (threadId) {
      navigation.navigate("ChatThread", { threadId });
    } else {
      navigation.navigate("ChatHome");
    }
  }, [threadId, navigation]);

  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleOpenUrl = useCallback(async () => {
    if (property?.propertyUrl) {
      try {
        await Linking.openURL(property.propertyUrl);
      } catch {
        Alert.alert("خطأ", "تعذر فتح الرابط");
      }
    }
  }, [property]);

  if (isLoading && !cachedProperty) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>جاري تحميل العقار...</Text>
      </View>
    );
  }

  if ((isError || !property) && !cachedProperty) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons
          name="alert-circle-outline"
          size={48}
          color={theme.colors.destructive}
        />
        <Text style={styles.errorText}>تعذر تحميل العقار</Text>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backButtonText}>رجوع</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!property) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons
          name="alert-circle-outline"
          size={48}
          color={theme.colors.destructive}
        />
        <Text style={styles.errorText}>لا توجد بيانات</Text>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backButtonText}>رجوع</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const formatPrice = (price?: number) => {
    if (!price) return "السعر عند الطلب";
    return `${price.toLocaleString("ar-SA")} ر.س`;
  };

  const images = property.imageUrls?.length
    ? property.imageUrls
    : property.imageUrl
      ? [property.imageUrl]
      : [];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
          <Ionicons
            name="arrow-forward"
            size={24}
            color={theme.colors.foreground}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {property.title}
        </Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        {images.length > 0 ? (
          <PropertyImageGallery images={images} theme={theme} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons
              name="image-outline"
              size={64}
              color={theme.colors.mutedForeground}
            />
          </View>
        )}

        <View style={styles.content}>
          <Text style={styles.title}>{property.title}</Text>

          <View style={styles.priceRow}>
            <Text style={styles.price}>{formatPrice(property.price)}</Text>
          </View>

          <View style={styles.specsContainer}>
            {property.beds != null && (
              <View style={styles.specItem}>
                <Ionicons
                  name="bed-outline"
                  size={22}
                  color={theme.colors.primary}
                />
                <Text style={styles.specValue}>{property.beds}</Text>
                <Text style={styles.specLabel}>غرف</Text>
              </View>
            )}
            {property.baths != null && (
              <View style={styles.specItem}>
                <Ionicons
                  name="water-outline"
                  size={22}
                  color={theme.colors.primary}
                />
                <Text style={styles.specValue}>{property.baths}</Text>
                <Text style={styles.specLabel}>حمام</Text>
              </View>
            )}
            {property.sqft != null && (
              <View style={styles.specItem}>
                <Ionicons
                  name="resize-outline"
                  size={22}
                  color={theme.colors.primary}
                />
                <Text style={styles.specValue}>{property.sqft}</Text>
                <Text style={styles.specLabel}>م²</Text>
              </View>
            )}
          </View>

          {property.description ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>الوصف</Text>
              <Text style={styles.description}>{property.description}</Text>
            </View>
          ) : null}

          {property.location || property.address ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>الموقع</Text>
              <View style={styles.locationRow}>
                <Ionicons
                  name="location-outline"
                  size={18}
                  color={theme.colors.mutedForeground}
                />
                <Text style={styles.locationText}>
                  {property.location || property.address}
                </Text>
              </View>
            </View>
          ) : null}

          {property.features && property.features.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>المميزات</Text>
              <View style={styles.featuresRow}>
                {property.features.map((feature, i) => (
                  <View key={i} style={styles.featureBadge}>
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {property.propertyUrl ? (
            <TouchableOpacity style={styles.linkButton} onPress={handleOpenUrl}>
              <Ionicons
                name="open-outline"
                size={18}
                color={theme.colors.primary}
              />
              <Text style={styles.linkButtonText}>عرض المصدر</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.actionButton} onPress={handleAskAbout}>
          <Ionicons
            name="chatbubble-outline"
            size={20}
            color={theme.colors.primaryForeground}
          />
          <Text style={styles.actionButtonText}>استفسر</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.iconButton} onPress={handleShare}>
          <Ionicons
            name="share-outline"
            size={24}
            color={theme.colors.foreground}
          />
        </TouchableOpacity>
      </View>
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
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: spacing.md,
      paddingTop: spacing.md,
      paddingBottom: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backBtn: {
      width: 44,
      height: 44,
      justifyContent: "center",
      alignItems: "center",
    },
    headerTitle: {
      flex: 1,
      fontSize: fontSize.lg,
      fontFamily: fontFamily.bold,
      color: colors.foreground,
      textAlign: "center",
      marginHorizontal: spacing.sm,
    },
    headerRight: {
      width: 44,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: spacing["2xl"],
    },
    imagePlaceholder: {
      height: 220,
      backgroundColor: colors.muted,
      justifyContent: "center",
      alignItems: "center",
    },
    centerContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.background,
      padding: spacing.lg,
    },
    loadingText: {
      marginTop: spacing.md,
      fontSize: fontSize.base,
      color: colors.mutedForeground,
      fontFamily: fontFamily.regular,
    },
    errorText: {
      marginTop: spacing.md,
      fontSize: fontSize.base,
      color: colors.destructive,
      fontFamily: fontFamily.medium,
    },
    backButton: {
      marginTop: spacing.lg,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      backgroundColor: colors.primary,
      borderRadius: radius.md,
    },
    backButtonText: {
      color: colors.primaryForeground,
      fontSize: fontSize.base,
      fontFamily: fontFamily.medium,
    },
    content: {
      padding: spacing.md,
    },
    title: {
      fontSize: fontSize.xl,
      fontFamily: fontFamily.bold,
      color: colors.foreground,
      textAlign: "right",
      marginBottom: spacing.sm,
    },
    priceRow: {
      marginBottom: spacing.md,
    },
    price: {
      fontSize: 24,
      fontFamily: fontFamily.bold,
      color: colors.primary,
      textAlign: "right",
    },
    specsContainer: {
      flexDirection: "row",
      justifyContent: "center",
      gap: spacing.xl,
      paddingVertical: spacing.md,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: colors.border,
      marginBottom: spacing.lg,
    },
    specItem: {
      alignItems: "center",
      gap: spacing.xs,
    },
    specValue: {
      fontSize: fontSize.lg,
      fontFamily: fontFamily.bold,
      color: colors.foreground,
    },
    specLabel: {
      fontSize: fontSize.sm,
      color: colors.mutedForeground,
      fontFamily: fontFamily.regular,
    },
    section: {
      marginBottom: spacing.lg,
    },
    sectionTitle: {
      fontSize: fontSize.lg,
      fontFamily: fontFamily.bold,
      color: colors.foreground,
      textAlign: "right",
      marginBottom: spacing.sm,
    },
    description: {
      fontSize: fontSize.base,
      color: colors.foreground,
      fontFamily: fontFamily.regular,
      textAlign: "right",
      lineHeight: 24,
    },
    locationRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-end",
      gap: spacing.xs,
    },
    locationText: {
      fontSize: fontSize.base,
      color: colors.mutedForeground,
      fontFamily: fontFamily.regular,
      textAlign: "right",
    },
    featuresRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "flex-end",
      gap: spacing.sm,
    },
    featureBadge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      backgroundColor: colors.secondary,
      borderRadius: radius.sm,
    },
    featureText: {
      fontSize: fontSize.sm,
      color: colors.foreground,
      fontFamily: fontFamily.regular,
    },
    linkButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.xs,
      paddingVertical: spacing.md,
      backgroundColor: colors.secondary,
      borderRadius: radius.lg,
      marginTop: spacing.md,
    },
    linkButtonText: {
      fontSize: fontSize.base,
      color: colors.primary,
      fontFamily: fontFamily.medium,
    },
    footer: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      paddingBottom: Math.max(spacing.md, insets.bottom),
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.background,
      gap: spacing.sm,
    },
    actionButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.primary,
      paddingVertical: spacing.md,
      borderRadius: radius.lg,
      gap: spacing.sm,
    },
    actionButtonText: {
      fontSize: fontSize.base,
      fontFamily: fontFamily.bold,
      color: colors.primaryForeground,
    },
    iconButton: {
      width: 48,
      height: 48,
      borderRadius: radius.full,
      backgroundColor: colors.secondary,
      justifyContent: "center",
      alignItems: "center",
    },
  });
}
