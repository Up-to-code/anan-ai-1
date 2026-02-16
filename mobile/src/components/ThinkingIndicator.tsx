import React, { useEffect, useRef } from "react";
import { View, Text, Animated, StyleSheet } from "react-native";
import type { ThemeTokens } from "../theme";

export type AgentStateVariant = "thinking" | "writing" | "searching";

const VARIANT_LABELS: Record<AgentStateVariant, string> = {
  thinking: "جاري التفكير...",
  writing: "يكتب...",
  searching: "جاري البحث في المصادر...",
};

const VARIANT_A11Y: Record<AgentStateVariant, string> = {
  thinking: "جاري التفكير",
  writing: "يكتب",
  searching: "جاري البحث في المصادر",
};

interface ThinkingIndicatorProps {
  theme: ThemeTokens;
  variant?: AgentStateVariant;
}

export function ThinkingIndicator({ theme, variant = "writing" }: ThinkingIndicatorProps) {
  const { colors, spacing, fontSize, fontFamily } = theme;
  const label = VARIANT_LABELS[variant];
  const a11yLabel = VARIANT_A11Y[variant];
  const anim1 = useRef(new Animated.Value(0)).current;
  const anim2 = useRef(new Animated.Value(0)).current;
  const anim3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const bounce = (anim: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ])
      );
    const a1 = bounce(anim1, 0);
    const a2 = bounce(anim2, 150);
    const a3 = bounce(anim3, 300);
    a1.start();
    a2.start();
    a3.start();
    return () => {
      a1.stop();
      a2.stop();
      a3.stop();
    };
  }, [anim1, anim2, anim3]);

  const y1 = anim1.interpolate({ inputRange: [0, 1], outputRange: [0, -4] });
  const y2 = anim2.interpolate({ inputRange: [0, 1], outputRange: [0, -4] });
  const y3 = anim3.interpolate({ inputRange: [0, 1], outputRange: [0, -4] });

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        container: {
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.sm,
          paddingVertical: spacing.sm,
          paddingHorizontal: spacing.md,
        },
        text: {
          fontSize: fontSize.sm,
          color: colors.mutedForeground,
          fontFamily: fontFamily.medium,
        },
        dots: { flexDirection: "row", gap: 4 },
        dot: {
          width: 6,
          height: 6,
          borderRadius: 3,
          backgroundColor: colors.primary,
        },
      }),
    [theme]
  );

  return (
    <View style={styles.container} accessibilityLabel={a11yLabel} accessibilityLiveRegion="polite">
      <Text style={styles.text}>{label}</Text>
      <View style={styles.dots}>
        <Animated.View style={[styles.dot, { transform: [{ translateY: y1 }] }]} />
        <Animated.View style={[styles.dot, { transform: [{ translateY: y2 }] }]} />
        <Animated.View style={[styles.dot, { transform: [{ translateY: y3 }] }]} />
      </View>
    </View>
  );
}
