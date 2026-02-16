/**
 * SwipeableBankCard - Bank card with swipe-to-delete
 * Displays bank loan information with delete functionality
 */
import React, { useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  PanResponder,
  Alert,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import type { ThemeTokens } from "../../theme";

export interface BankCardData {
  name: string;
  product?: string;
  contactEmail?: string;
  description?: string;
  rate?: number;
  maxAmount?: number;
  maxYears?: number;
  bankId?: string;
}

interface BankCardProps {
  bank: BankCardData;
  theme: ThemeTokens;
  onPress?: () => void;
  onDelete?: (bank: BankCardData) => void;
}

const DELETE_THRESHOLD = -70;

export function BankCard({ bank, theme, onPress, onDelete }: BankCardProps) {
  const translateX = useRef(new Animated.Value(0)).current;
  const deleteWidth = 70;

  const handleDeleteConfirm = useCallback(() => {
    Alert.alert("حذف البنك", "هل أنت متأكد من إزالة هذا البنك من القائمة؟", [
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
        onPress: () => onDelete?.(bank),
      },
    ]);
  }, [bank, onDelete, translateX]);

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
          borderRadius: radius.lg,
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
          borderRadius: radius.lg,
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
          overflow: "hidden",
        },
        content: {
          flexDirection: "row",
          alignItems: "flex-start",
          padding: spacing.md,
          gap: spacing.sm,
        },
        iconWrap: {
          width: 40,
          height: 40,
          borderRadius: radius.md,
          backgroundColor: colors.primary + "15",
          justifyContent: "center",
          alignItems: "center",
        },
        body: { flex: 1, minWidth: 0 },
        name: {
          fontFamily: fontFamily.bold,
          fontSize: fontSize.base,
          color: colors.foreground,
          marginBottom: spacing.xs,
          textAlign: "right",
        },
        product: {
          fontSize: fontSize.sm,
          color: colors.primary,
          fontFamily: fontFamily.medium,
          marginBottom: spacing.xs,
          textAlign: "right",
        },
        meta: {
          fontSize: fontSize.sm,
          color: colors.mutedForeground,
          fontFamily: fontFamily.regular,
          textAlign: "right",
        },
        description: {
          fontSize: fontSize.sm,
          color: colors.mutedForeground,
          fontFamily: fontFamily.regular,
          marginTop: spacing.xs,
          textAlign: "right",
        },
        arrow: {
          justifyContent: "center",
          alignItems: "center",
          paddingLeft: spacing.sm,
        },
      }),
    [theme],
  );

  const content = (
    <View style={styles.content}>
      <View style={styles.iconWrap}>
        <Ionicons
          name="business-outline"
          size={20}
          color={theme.colors.primary}
        />
      </View>
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>
          {bank.name}
        </Text>
        {bank.product ? (
          <Text style={styles.product} numberOfLines={1}>
            {bank.product}
          </Text>
        ) : null}
        {bank.rate ? (
          <Text style={styles.meta}>{bank.rate}% سنوياً</Text>
        ) : null}
        {bank.description ? (
          <Text style={styles.description} numberOfLines={2}>
            {bank.description}
          </Text>
        ) : null}
      </View>
      {onPress && !onDelete && (
        <View style={styles.arrow}>
          <Ionicons
            name="chevron-back"
            size={20}
            color={colors.mutedForeground}
          />
        </View>
      )}
    </View>
  );

  // Without delete
  if (!onDelete) {
    if (onPress) {
      return (
        <TouchableOpacity
          style={styles.container}
          onPress={onPress}
          activeOpacity={0.7}
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
          onPress={onPress}
          activeOpacity={0.8}
        >
          {content}
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}
