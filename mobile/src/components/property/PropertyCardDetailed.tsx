/**
 * SwipeablePropertyCard - Property card with swipe-to-delete functionality
 * Used in search results and favorites screens
 */
import React, { useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Animated,
  PanResponder,
  Alert,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useThemedTheme, type ThemeTokens } from "../../theme";

export interface PropertyCardDetailedData {
  id: string;
  title: string;
  address: string;
  price?: number;
  beds?: number;
  baths?: number;
  sqft?: number;
  location?: string;
  imageUrl?: string;
  status?: string;
  type?: "buy" | "rent";
}

interface SwipeablePropertyCardProps {
  property: PropertyCardDetailedData;
  onPress?: () => void;
  onDelete?: (propertyId: string) => void;
  theme: ThemeTokens;
  showDelete?: boolean;
}

const DELETE_THRESHOLD = -80;

export function SwipeablePropertyCard({
  property,
  onPress,
  onDelete,
  theme,
  showDelete = false,
}: SwipeablePropertyCardProps) {
  const translateX = useRef(new Animated.Value(0)).current;
  const deleteWidth = 80;

  const formatPrice = (price?: number) => {
    if (!price) return "السعر عند الطلب";
    return `${price.toLocaleString("ar-SA")} ر.س`;
  };

  const handleDeleteConfirm = useCallback(() => {
    Alert.alert("حذف العقار", "هل أنت متأكد من حذف هذا العقار من القائمة؟", [
      {
        text: "إلغاء",
        style: "cancel",
        onPress: () => {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        },
      },
      {
        text: "حذف",
        style: "destructive",
        onPress: () => {
          onDelete?.(property.id);
        },
      },
    ]);
  }, [property.id, onDelete, translateX]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gesture) => {
        return (
          showDelete &&
          Math.abs(gesture.dx) > Math.abs(gesture.dy) &&
          Math.abs(gesture.dx) > 10
        );
      },
      onPanResponderMove: (_, gesture) => {
        if (gesture.dx < 0) {
          translateX.setValue(Math.max(gesture.dx, -deleteWidth));
        } else if (gesture.dx > 0) {
          translateX.setValue(Math.min(gesture.dx, 0));
        }
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx < DELETE_THRESHOLD) {
          Animated.spring(translateX, {
            toValue: -deleteWidth,
            useNativeDriver: true,
            tension: 80,
            friction: 10,
          }).start();
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            tension: 80,
            friction: 10,
          }).start();
        }
      },
    }),
  ).current;

  const styles = createStyles(theme);

  const content = (
    <View style={styles.content}>
      <View style={styles.imageContainer}>
        {property.imageUrl ? (
          <Image
            source={{ uri: property.imageUrl }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons
              name="image-outline"
              size={40}
              color={theme.colors.mutedForeground}
            />
          </View>
        )}
        <View style={styles.badgeContainer}>
          <View
            style={[
              styles.badge,
              property.type === "rent" ? styles.badgeRent : styles.badgeBuy,
            ]}
          >
            <Text style={styles.badgeText}>
              {property.type === "rent" ? "للإيجار" : "للبيع"}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.title} numberOfLines={2}>
          {property.title}
        </Text>

        <View style={styles.locationRow}>
          <Ionicons
            name="location-outline"
            size={14}
            color={theme.colors.mutedForeground}
          />
          <Text style={styles.locationText} numberOfLines={1}>
            {property.address || property.location || "غير محدد"}
          </Text>
        </View>

        <View style={styles.specsRow}>
          {property.beds != null && (
            <View style={styles.spec}>
              <Ionicons
                name="bed-outline"
                size={14}
                color={theme.colors.mutedForeground}
              />
              <Text style={styles.specText}>{property.beds}</Text>
            </View>
          )}
          {property.baths != null && (
            <View style={styles.spec}>
              <Ionicons
                name="water-outline"
                size={14}
                color={theme.colors.mutedForeground}
              />
              <Text style={styles.specText}>{property.baths}</Text>
            </View>
          )}
          {property.sqft != null && (
            <View style={styles.spec}>
              <Ionicons
                name="resize-outline"
                size={14}
                color={theme.colors.mutedForeground}
              />
              <Text style={styles.specText}>{property.sqft} م²</Text>
            </View>
          )}
        </View>

        <Text style={styles.price}>{formatPrice(property.price)}</Text>
      </View>
    </View>
  );

  // Without delete functionality
  if (!showDelete || !onDelete) {
    return (
      <TouchableOpacity
        style={styles.container}
        onPress={onPress}
        activeOpacity={0.8}
        accessibilityLabel={property.title}
        accessibilityRole="button"
      >
        {content}
      </TouchableOpacity>
    );
  }

  // With swipe-to-delete
  return (
    <View style={styles.swipeContainer}>
      {/* Delete background */}
      <Animated.View
        style={[
          styles.deleteBackground,
          {
            opacity: translateX.interpolate({
              inputRange: [-deleteWidth, 0],
              outputRange: [1, 0],
              extrapolate: "clamp",
            }),
          },
        ]}
      >
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDeleteConfirm}
        >
          <Ionicons name="trash" size={22} color="#fff" />
          <Text style={styles.deleteText}>حذف</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Main card content */}
      <Animated.View
        style={[
          styles.container,
          {
            transform: [{ translateX }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          style={{ flex: 1 }}
          onPress={onPress}
          activeOpacity={0.8}
        >
          {content}
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

function createStyles(theme: ThemeTokens) {
  const { colors, radius, spacing, fontSize, fontFamily } = theme;
  return StyleSheet.create({
    swipeContainer: {
      overflow: "hidden",
      marginVertical: spacing.xs,
    },
    deleteBackground: {
      position: "absolute",
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: "#dc2626",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-start",
      paddingLeft: 20,
      borderRadius: radius.lg,
    },
    deleteButton: {
      alignItems: "center",
      justifyContent: "center",
      width: 70,
    },
    deleteText: {
      color: "#fff",
      fontSize: 12,
      marginTop: 2,
      fontFamily: "Cairo_500Medium",
    },
    container: {
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: colors.border,
    },
    content: {
      flexDirection: "row",
    },
    imageContainer: {
      width: 100,
      height: 100,
      position: "relative",
    },
    image: {
      width: "100%",
      height: "100%",
    },
    imagePlaceholder: {
      width: "100%",
      height: "100%",
      backgroundColor: colors.muted,
      justifyContent: "center",
      alignItems: "center",
    },
    badgeContainer: {
      position: "absolute",
      top: spacing.xs,
      left: spacing.xs,
    },
    badge: {
      paddingHorizontal: spacing.xs,
      paddingVertical: 2,
      borderRadius: radius.sm,
    },
    badgeBuy: {
      backgroundColor: colors.primary + "30",
    },
    badgeRent: {
      backgroundColor: "#10b98130",
    },
    badgeText: {
      fontSize: fontSize.sm - 2,
      fontFamily: fontFamily.bold,
      color: colors.foreground,
    },
    infoContainer: {
      flex: 1,
      padding: spacing.sm,
      justifyContent: "center",
    },
    title: {
      fontSize: fontSize.base,
      fontFamily: fontFamily.bold,
      color: colors.foreground,
      marginBottom: spacing.xs,
      textAlign: "right",
    },
    locationRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-end",
      gap: spacing.xs,
      marginBottom: spacing.xs,
    },
    locationText: {
      fontSize: fontSize.sm,
      color: colors.mutedForeground,
      fontFamily: fontFamily.regular,
      flex: 1,
      textAlign: "right",
    },
    specsRow: {
      flexDirection: "row",
      justifyContent: "flex-end",
      gap: spacing.md,
      marginBottom: spacing.xs,
    },
    spec: {
      flexDirection: "row",
      alignItems: "center",
      gap: 2,
    },
    specText: {
      fontSize: fontSize.sm,
      color: colors.mutedForeground,
      fontFamily: fontFamily.regular,
    },
    price: {
      fontSize: fontSize.base,
      fontFamily: fontFamily.bold,
      color: colors.foreground,
      textAlign: "right",
    },
  });
}

// Keep backward compatibility
export const PropertyCardDetailed = SwipeablePropertyCard;
