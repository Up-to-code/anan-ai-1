/**
 * ChatHomeScreen - Main entry point for the app
 * Minimal, clean design focused on property search and AI assistance
 */
import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useMutation, useQuery } from "convex/react";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { api } from "../convex";
import { useThemedTheme, type ThemeTokens } from "../theme";
import { useSession } from "../lib/auth-client";
import { getOrCreateAnonUserId } from "../lib/anonymous-user";
import { Input } from "../components/Input";

type Nav = NativeStackNavigationProp<RootStackParamList>;

const SUGGESTIONS = [
  "شقة للبيع في الرياض",
  "فيلا للإيجار في جدة",
  "أفضل تمويل عقاري",
];

export function ChatHomeScreen() {
  const theme = useThemedTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { data: session } = useSession();
  const userId = session?.user?.id;

  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  const styles = useMemo(() => createStyles(theme, insets), [theme, insets]);

  const createThread = useMutation(
    api.features.agent.actions.createThreadAction,
  );
  const sendMessage = useMutation(api.features.agent.actions.sendMessage);

  const lastSearchContext = useQuery(
    api.services.properties.getLastSearchContext,
    userId ? { userId } : "skip",
  );

  /**
   * Sends first message and navigates to chat thread
   */
  const sendFirstMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || sending) return;
      setSending(true);
      try {
        const anonUserId = session?.user?.id ?? getOrCreateAnonUserId();
        const { threadId } = await createThread({
          userId: session?.user ? undefined : anonUserId,
          title: trimmed.slice(0, 50) || "محادثة جديدة",
        });
        await sendMessage({
          threadId,
          body: trimmed,
          userId: session?.user ? undefined : anonUserId,
        });
        navigation.replace("ChatThread", { threadId });
      } catch (e) {
        console.error(e);
        Alert.alert("خطأ", "تعذر إنشاء المحادثة. حاول مرة أخرى.");
      } finally {
        setSending(false);
      }
    },
    [createThread, sendMessage, navigation, sending, session?.user],
  );

  const handleSend = useCallback(() => {
    sendFirstMessage(input);
    setInput("");
  }, [input, sendFirstMessage]);

  const handleSuggestionPress = useCallback(
    (text: string) => {
      sendFirstMessage(text);
    },
    [sendFirstMessage],
  );

  const handleSearchPress = useCallback(() => {
    navigation.navigate("PropertySearch");
  }, [navigation]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={80}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo and Title */}
        <View style={styles.header}>
          <View style={styles.logoWrap}>
            <Ionicons name="home" size={32} color={theme.colors.primary} />
          </View>
          <Text style={styles.appName}>عنان</Text>
          <Text style={styles.tagline}>مساعدك العقاري الذكي</Text>
        </View>

        {/* Search Button */}
        <TouchableOpacity
          style={styles.searchButton}
          onPress={handleSearchPress}
        >
          <Ionicons
            name="search"
            size={20}
            color={theme.colors.mutedForeground}
          />
          <Text style={styles.searchPlaceholder}>ابحث عن عقار...</Text>
        </TouchableOpacity>

        {/* Recent Search */}
        {lastSearchContext ? (
          <TouchableOpacity
            style={styles.recentSearchCard}
            onPress={() => sendFirstMessage(lastSearchContext.query)}
          >
            <Ionicons
              name="time-outline"
              size={16}
              color={theme.colors.mutedForeground}
            />
            <Text style={styles.recentSearchText} numberOfLines={1}>
              {lastSearchContext.query}
            </Text>
          </TouchableOpacity>
        ) : null}

        {/* Suggestions */}
        <View style={styles.suggestionsSection}>
          <Text style={styles.suggestionsTitle}>ابدأ المحادثة</Text>
          {SUGGESTIONS.map((q, i) => (
            <TouchableOpacity
              key={i}
              style={styles.suggestionItem}
              onPress={() => handleSuggestionPress(q)}
              disabled={sending}
            >
              <Text style={styles.suggestionText}>{q}</Text>
              <Ionicons
                name="chevron-back"
                size={16}
                color={theme.colors.mutedForeground}
              />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Input Bar */}
      <View style={styles.inputRow}>
        <View style={styles.inputBar}>
          <TouchableOpacity
            style={[
              styles.sendBtn,
              input.trim().length > 0 && styles.sendBtnActive,
            ]}
            onPress={handleSend}
            disabled={sending || !input.trim()}
            activeOpacity={0.8}
          >
            <Ionicons
              name="send"
              size={18}
              color={
                input.trim()
                  ? theme.colors.primaryForeground
                  : theme.colors.mutedForeground
              }
            />
          </TouchableOpacity>
          <Input
            style={styles.input}
            placeholder="اكتب رسالتك..."
            value={input}
            onChangeText={setInput}
            onSubmitEditing={handleSend}
            returnKeyType="send"
            blurOnSubmit={true}
            multiline
            maxLength={4000}
            editable={!sending}
            textAlign="right"
            writingDirection="rtl"
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

function createStyles(theme: ThemeTokens, insets: { bottom: number }) {
  const { colors, radius, spacing, fontSize, fontFamily } = theme;
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      padding: spacing.lg,
      paddingBottom: spacing["2xl"] + insets.bottom,
    },
    header: {
      alignItems: "center",
      marginBottom: spacing["2xl"],
      marginTop: spacing.xl,
    },
    logoWrap: {
      width: 64,
      height: 64,
      borderRadius: radius.xl,
      backgroundColor: colors.primary + "15",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: spacing.md,
    },
    appName: {
      fontSize: 28,
      fontFamily: fontFamily.bold,
      color: colors.foreground,
      marginBottom: spacing.xs,
    },
    tagline: {
      fontSize: fontSize.base,
      fontFamily: fontFamily.regular,
      color: colors.mutedForeground,
    },
    searchButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
      gap: spacing.sm,
    },
    searchPlaceholder: {
      flex: 1,
      fontSize: fontSize.base,
      fontFamily: fontFamily.regular,
      color: colors.mutedForeground,
      textAlign: "right",
    },
    recentSearchCard: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      marginBottom: spacing.lg,
      gap: spacing.sm,
    },
    recentSearchText: {
      flex: 1,
      fontSize: fontSize.sm,
      fontFamily: fontFamily.regular,
      color: colors.mutedForeground,
      textAlign: "right",
    },
    suggestionsSection: {
      marginTop: spacing.md,
    },
    suggestionsTitle: {
      fontSize: fontSize.sm,
      fontFamily: fontFamily.medium,
      color: colors.mutedForeground,
      textAlign: "right",
      marginBottom: spacing.md,
    },
    suggestionItem: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      marginBottom: spacing.sm,
      justifyContent: "space-between",
    },
    suggestionText: {
      fontSize: fontSize.base,
      fontFamily: fontFamily.regular,
      color: colors.foreground,
      flex: 1,
      textAlign: "right",
    },
    inputRow: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      paddingBottom: Math.max(spacing.md, insets.bottom),
      backgroundColor: colors.background,
    },
    inputBar: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.card,
      borderRadius: radius.full,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderWidth: 1,
      borderColor: colors.border,
    },
    input: {
      flex: 1,
      maxHeight: 100,
      marginHorizontal: spacing.sm,
      backgroundColor: "transparent",
    },
    sendBtn: {
      width: 40,
      height: 40,
      borderRadius: radius.full,
      backgroundColor: colors.secondary,
      justifyContent: "center",
      alignItems: "center",
    },
    sendBtnActive: {
      backgroundColor: colors.primary,
    },
  });
}
