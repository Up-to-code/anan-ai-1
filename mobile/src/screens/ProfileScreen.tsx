/**
 * ProfileScreen - User profile management
 * Simple, clean design with inline editing
 */
import React, { useMemo, useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useThemedTheme, type ThemeTokens } from "../theme";
import { useSession, authClient } from "../lib/auth-client";
import { useTheme } from "../contexts/ThemeContext";
import type { RootStackParamList } from "../navigation/RootNavigator";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function ProfileScreen() {
  const theme = useThemedTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { data: session } = useSession();
  const { theme: themeMode, toggleTheme } = useTheme();

  const [name, setName] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [savingName, setSavingName] = useState(false);

  const styles = useMemo(() => createStyles(theme, insets), [theme, insets]);

  // Initialize name from session
  useEffect(() => {
    if (session?.user?.name) {
      setName(session.user.name);
    } else if (session?.user?.phoneNumber) {
      setName(session.user.phoneNumber);
    }
  }, [session?.user?.name, session?.user?.phoneNumber]);

  const handleSaveName = useCallback(async () => {
    if (savingName || !name.trim()) return;
    setSavingName(true);
    try {
      await authClient.updateUser({ name: name.trim() });
      setIsEditingName(false);
    } catch (e) {
      console.error(e);
      Alert.alert("خطأ", "تعذر حفظ الاسم.");
    } finally {
      setSavingName(false);
    }
  }, [name, savingName]);

  const handleCancelEdit = useCallback(() => {
    setName(session?.user?.name || session?.user?.phoneNumber || "");
    setIsEditingName(false);
  }, [session?.user?.name, session?.user?.phoneNumber]);

  const phoneNumber = session?.user?.phoneNumber
    ? String(session.user.phoneNumber)
    : null;

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
        <Text style={styles.headerTitle}>الملف الشخصي</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarWrap}>
            <Ionicons name="person" size={32} color={theme.colors.primary} />
          </View>

          {/* Name Field */}
          {isEditingName ? (
            <View style={styles.editRow}>
              <TextInput
                style={styles.nameInput}
                value={name}
                onChangeText={setName}
                placeholder="الاسم"
                placeholderTextColor={theme.colors.mutedForeground}
                textAlign="right"
                autoFocus
              />
              <View style={styles.editActions}>
                <TouchableOpacity
                  style={styles.saveBtn}
                  onPress={handleSaveName}
                  disabled={savingName}
                >
                  {savingName ? (
                    <ActivityIndicator
                      size="small"
                      color={theme.colors.primaryForeground}
                    />
                  ) : (
                    <Ionicons
                      name="checkmark"
                      size={20}
                      color={theme.colors.primaryForeground}
                    />
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={handleCancelEdit}
                >
                  <Ionicons
                    name="close"
                    size={20}
                    color={theme.colors.mutedForeground}
                  />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.nameRow}
              onPress={() => setIsEditingName(true)}
            >
              <Text style={styles.nameText}>{name || "اضغط لإضافة الاسم"}</Text>
              <Ionicons
                name="pencil"
                size={16}
                color={theme.colors.mutedForeground}
              />
            </TouchableOpacity>
          )}

          {/* Phone Number */}
          {phoneNumber && (
            <View style={styles.phoneRow}>
              <Ionicons
                name="call-outline"
                size={16}
                color={theme.colors.mutedForeground}
              />
              <Text style={styles.phoneText}>{phoneNumber}</Text>
            </View>
          )}
        </View>

        {/* Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>الإعدادات</Text>

          {/* Theme Toggle */}
          <TouchableOpacity style={styles.settingRow} onPress={toggleTheme}>
            <View style={styles.settingLeft}>
              <Ionicons
                name={themeMode === "dark" ? "moon" : "sunny"}
                size={20}
                color={theme.colors.primary}
              />
              <Text style={styles.settingLabel}>المظهر</Text>
            </View>
            <View style={styles.settingRight}>
              <Text style={styles.settingValue}>
                {themeMode === "dark" ? "داكن" : "فاتح"}
              </Text>
              <Ionicons
                name="chevron-back"
                size={16}
                color={theme.colors.mutedForeground}
              />
            </View>
          </TouchableOpacity>
        </View>

        {/* Legal Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>قانوني</Text>

          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => navigation.navigate("Privacy")}
          >
            <View style={styles.settingLeft}>
              <Ionicons
                name="shield-outline"
                size={20}
                color={theme.colors.mutedForeground}
              />
              <Text style={styles.settingLabel}>سياسة الخصوصية</Text>
            </View>
            <Ionicons
              name="chevron-back"
              size={16}
              color={theme.colors.mutedForeground}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => navigation.navigate("Terms")}
          >
            <View style={styles.settingLeft}>
              <Ionicons
                name="document-text-outline"
                size={20}
                color={theme.colors.mutedForeground}
              />
              <Text style={styles.settingLabel}>الشروط والأحكام</Text>
            </View>
            <Ionicons
              name="chevron-back"
              size={16}
              color={theme.colors.mutedForeground}
            />
          </TouchableOpacity>
        </View>
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
    profileCard: {
      backgroundColor: colors.card,
      borderRadius: radius.xl,
      padding: spacing.lg,
      alignItems: "center",
      marginBottom: spacing.lg,
    },
    avatarWrap: {
      width: 64,
      height: 64,
      borderRadius: radius.full,
      backgroundColor: colors.primary + "20",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: spacing.md,
    },
    nameRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    nameText: {
      fontSize: fontSize.lg,
      fontFamily: fontFamily.bold,
      color: colors.foreground,
      textAlign: "center",
    },
    editRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      width: "100%",
    },
    nameInput: {
      flex: 1,
      fontSize: fontSize.lg,
      fontFamily: fontFamily.bold,
      color: colors.foreground,
      textAlign: "center",
      backgroundColor: colors.input,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    editActions: {
      flexDirection: "row",
      gap: spacing.xs,
    },
    saveBtn: {
      width: 36,
      height: 36,
      borderRadius: radius.full,
      backgroundColor: colors.primary,
      justifyContent: "center",
      alignItems: "center",
    },
    cancelBtn: {
      width: 36,
      height: 36,
      borderRadius: radius.full,
      backgroundColor: colors.secondary,
      justifyContent: "center",
      alignItems: "center",
    },
    phoneRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      marginTop: spacing.sm,
    },
    phoneText: {
      fontSize: fontSize.base,
      fontFamily: fontFamily.regular,
      color: colors.mutedForeground,
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
    settingRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      marginBottom: spacing.sm,
    },
    settingLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    settingLabel: {
      fontSize: fontSize.base,
      fontFamily: fontFamily.regular,
      color: colors.foreground,
    },
    settingRight: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
    },
    settingValue: {
      fontSize: fontSize.base,
      fontFamily: fontFamily.regular,
      color: colors.mutedForeground,
    },
  });
}
