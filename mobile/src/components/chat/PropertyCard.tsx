/**
 * SwipeablePropertyCard - Chat property card with swipe-to-delete
 * Used in chat messages for property display
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
import type { ThemeTokens } from "../../theme";

export interface PropertyCardData {
  id?: string;
  title: string;
  location: string;
  price: string;
  type?: "buy" | "rent";
  bedrooms?: number;
  bathrooms?: number;
  area?: string;
  image?: string;
}

interface PropertyCardProps {
  property: PropertyCardData;
  theme: ThemeTokens;
  onPress?: (property: PropertyCardData) => void;
  onDelete?: (property: PropertyCardData) => void;
}

const DELETE_THRESHOLD = -70;

export function PropertyCard({
  property,
  theme,
  onPress,
  onDelete,
}: PropertyCardProps) {
  const translateX = useRef(new Animated.Value(0)).current;
  const deleteWidth = 70;

  const handleDeleteConfirm = useCallback(() => {
    Alert.alert("حذف العقار", "هل أنت متأكد من إزالة هذا العقار؟", [
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
        onPress: () => onDelete?.(property),
      },
    ]);
  }, [property, onDelete, translateX]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gesture) => {
        return (
          !!onDelete &&
          Math.abs(gesture.dx) > Math.abs(gesture.dy) &&
          Math.abs(gesture.dx) > 10
        );
      },
      onPanResponderMove: (_, gesture) => {
        if (gesture.dx < 0) {
          translateX.setValue(Math.max(gesture.dx, -deleteWidth));
        } else {
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

  const { colors, radius, spacing, fontSize, fontFamily } = theme;
  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        swipeContainer: { overflow: "hidden", marginVertical: spacing.xs },
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
          paddingLeft: 16,
          borderRadius: radius.xl,
        },
        deleteButton: {
          alignItems: "center",
          justifyContent: "center",
          width: 60,
        },
        deleteText: {
          color: "#fff",
          fontSize: 12,
          marginTop: 2,
          fontFamily: "Cairo_500Medium",
        },
        container: {
          width: "100%",
          borderRadius: radius.xl,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.card,
          padding: spacing.md,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 3,
        },
        row: { flexDirection: "row", gap: spacing.md },
        image: {
          width: 88,
          height: 88,
          borderRadius: radius.lg,
          backgroundColor: colors.muted,
        },
        body: { flex: 1, minWidth: 0 },
        title: {
          fontFamily: fontFamily.bold,
          fontSize: fontSize.base,
          color: colors.foreground,
          marginBottom: spacing.xs,
        },
        badge: {
          alignSelf: "flex-start",
          paddingHorizontal: spacing.sm,
          paddingVertical: 2,
          borderRadius: radius.sm,
          marginBottom: spacing.xs,
        },
        badgeBuy: {
          backgroundColor: colors.primary + "20",
          color: colors.primary,
        },
        badgeRent: { backgroundColor: "#10b98120", color: "#10b981" },
        locationRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.xs,
          marginBottom: spacing.xs,
        },
        locationText: {
          fontSize: fontSize.sm,
          color: colors.mutedForeground,
          fontFamily: fontFamily.regular,
        },
        specsRow: {
          flexDirection: "row",
          flexWrap: "wrap",
          gap: spacing.md,
          marginBottom: spacing.sm,
        },
        spec: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
        specText: {
          fontSize: fontSize.sm,
          color: colors.mutedForeground,
          fontFamily: fontFamily.regular,
        },
        price: {
          fontFamily: fontFamily.bold,
          fontSize: fontSize.lg,
          color: colors.foreground,
        },
      }),
    [theme],
  );

  const badgeStyle =
    property.type === "rent"
      ? [styles.badge, styles.badgeRent]
      : [styles.badge, styles.badgeBuy];

  const content = (
    <View style={styles.row}>
      {property.image ? (
        <Image
          source={{ uri: property.image }}
          style={styles.image}
          resizeMode="cover"
        />
      ) : null}
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>
          {property.title}
        </Text>
        <View style={badgeStyle}>
          <Text style={{ fontSize: fontSize.sm, fontFamily: fontFamily.bold }}>
            {property.type === "rent" ? "للإيجار" : "للبيع"}
          </Text>
        </View>
        <View style={styles.locationRow}>
          <Ionicons
            name="location-outline"
            size={14}
            color={colors.mutedForeground}
          />
          <Text style={styles.locationText} numberOfLines={1}>
            {property.location}
          </Text>
        </View>
        {(property.bedrooms != null ||
          property.bathrooms != null ||
          property.area) && (
          <View style={styles.specsRow}>
            {property.bedrooms != null && (
              <View style={styles.spec}>
                <Ionicons
                  name="bed-outline"
                  size={14}
                  color={colors.mutedForeground}
                />
                <Text style={styles.specText}>{property.bedrooms}</Text>
              </View>
            )}
            {property.bathrooms != null && (
              <View style={styles.spec}>
                <Ionicons
                  name="water-outline"
                  size={14}
                  color={colors.mutedForeground}
                />
                <Text style={styles.specText}>{property.bathrooms}</Text>
              </View>
            )}
            {property.area && (
              <View style={styles.spec}>
                <Ionicons
                  name="resize-outline"
                  size={14}
                  color={colors.mutedForeground}
                />
                <Text style={styles.specText}>{property.area}</Text>
              </View>
            )}
          </View>
        )}
        <Text style={styles.price}>{property.price}</Text>
      </View>
    </View>
  );

  // Without delete
  if (!onDelete) {
    if (onPress) {
      return (
        <TouchableOpacity
          style={styles.container}
          onPress={() => onPress(property)}
          activeOpacity={0.8}
        >
          {content}
        </TouchableOpacity>
      );
    }
    return <View style={styles.container}>{content}</View>;
  }

  // With swipe-to-delete
  return (
    <View style={styles.swipeContainer}>
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
          <Ionicons name="trash" size={20} color="#fff" />
          <Text style={styles.deleteText}>حذف</Text>
        </TouchableOpacity>
      </Animated.View>

      <Animated.View
        style={[styles.container, { transform: [{ translateX }] }]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          style={{ flex: 1 }}
          onPress={() => onPress?.(property)}
          activeOpacity={0.8}
        >
          {content}
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}
