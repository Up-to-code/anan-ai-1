/**
 * SettingsScreen - App settings with clean navigation
 * Minimal design focused on essential settings
 */
import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Ionicons from "@expo/vector-icons/Ionicons";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { useThemedTheme, type ThemeTokens } from "../theme";
import { useTheme } from "../contexts/ThemeContext";
import { useSession } from "../lib/auth-client";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function SettingsScreen() {
  const theme = useThemedTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { theme: themeMode, toggleTheme } = useTheme();
  const { data: session } = useSession();

  const styles = useMemo(() => createStyles(theme, insets), [theme, insets]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons
            name="arrow-forward"
            size={24}
            color={theme.colors.foreground}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>الإعدادات</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Account Section */}
        {session?.user && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>الحساب</Text>
            <TouchableOpacity
              style={styles.row}
              onPress={() => navigation.navigate("Profile")}
            >
              <View style={styles.rowLeft}>
                <Ionicons
                  name="person-outline"
                  size={20}
                  color={theme.colors.primary}
                />
                <Text style={styles.rowLabel}>الملف الشخصي</Text>
              </View>
              <Ionicons
                name="chevron-back"
                size={20}
                color={theme.colors.mutedForeground}
              />
            </TouchableOpacity>
          </View>
        )}

        {/* Appearance Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>المظهر</Text>
          <TouchableOpacity style={styles.row} onPress={toggleTheme}>
            <View style={styles.rowLeft}>
              <Ionicons
                name={themeMode === "dark" ? "moon-outline" : "sunny-outline"}
                size={20}
                color={theme.colors.primary}
              />
              <Text style={styles.rowLabel}>الوضع</Text>
            </View>
            <View style={styles.rowRight}>
              <Text style={styles.rowValue}>
                {themeMode === "dark" ? "داكن" : "فاتح"}
              </Text>
              <Ionicons
                name="chevron-back"
                size={20}
                color={theme.colors.mutedForeground}
              />
            </View>
          </TouchableOpacity>
        </View>

        {/* Legal Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>قانوني</Text>
          <TouchableOpacity
            style={styles.row}
            onPress={() => navigation.navigate("Privacy")}
          >
            <View style={styles.rowLeft}>
              <Ionicons
                name="shield-outline"
                size={20}
                color={theme.colors.mutedForeground}
              />
              <Text style={styles.rowLabel}>سياسة الخصوصية</Text>
            </View>
            <Ionicons
              name="chevron-back"
              size={20}
              color={theme.colors.mutedForeground}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.row}
            onPress={() => navigation.navigate("Terms")}
          >
            <View style={styles.rowLeft}>
              <Ionicons
                name="document-text-outline"
                size={20}
                color={theme.colors.mutedForeground}
              />
              <Text style={styles.rowLabel}>الشروط والأحكام</Text>
            </View>
            <Ionicons
              name="chevron-back"
              size={20}
              color={theme.colors.mutedForeground}
            />
          </TouchableOpacity>
        </View>

        {/* Version */}
        <Text style={styles.version}>عنان v1.0.0</Text>
      </ScrollView>
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
    },
    headerRight: {
      width: 44,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      padding: spacing.md,
      paddingBottom: spacing["2xl"],
    },
    section: {
      marginBottom: spacing.lg,
    },
    sectionTitle: {
      fontSize: fontSize.sm,
      fontFamily: fontFamily.medium,
      color: colors.mutedForeground,
      textAlign: "right",
      marginBottom: spacing.sm,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      marginBottom: spacing.sm,
    },
    rowLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    rowLabel: {
      flex: 1,
      fontSize: fontSize.base,
      fontFamily: fontFamily.regular,
      color: colors.foreground,
      textAlign: "right",
    },
    rowRight: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
    },
    rowValue: {
      fontSize: fontSize.base,
      fontFamily: fontFamily.regular,
      color: colors.mutedForeground,
    },
    version: {
      textAlign: "center",
      fontSize: fontSize.sm,
      fontFamily: fontFamily.regular,
      color: colors.mutedForeground,
      marginTop: spacing.xl,
    },
  });
}
