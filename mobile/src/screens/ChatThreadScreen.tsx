import React, {
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRoute, useNavigation } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useMutation } from "convex/react";
import { useUIMessages } from "@convex-dev/agent/react";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { api } from "../convex";
import { useThemedTheme, type ThemeTokens } from "../theme";
import { useSession } from "../lib/auth-client";
import { uiMessageToMessage } from "../lib/ui-message-mapper";
import type { ChatMessage } from "../lib/chat-types";
import { Chip } from "../components/Chip";
import { Input } from "../components/Input";
import { ArticleMessage } from "../components/ArticleMessage";
import { ComponentMapper } from "../components/chat/ComponentMapper";
import { type PropertyCardData } from "../components/chat/PropertyCard";
import { ThinkingIndicator } from "../components/ThinkingIndicator";

const SUGGESTIONS = [
  "عرض عقارات للبيع في الرياض",
  "عقارات للإيجار بجدة",
  "قروض الإسكان والتمويل العقاري",
  "ما هي أفضل البنوك للقرض العقاري؟",
];

type ChatThreadRoute = RouteProp<RootStackParamList, "ChatThread">;

type RawUIMessage = {
  role?: string;
  key: string;
  text: string;
  parts?: {
    type?: string;
    toolCallId?: string;
    input?: unknown;
    output?: unknown;
  }[];
};

const MemoizedMessageRow = React.memo(
  function MessageRow({
    item,
    theme,
    styles,
    renderStructuredBlock,
  }: {
    item: ChatMessage;
    theme: ThemeTokens;
    styles: ReturnType<typeof createStyles>;
    renderStructuredBlock: (
      type: ChatMessage["type"],
      data: unknown,
    ) => React.ReactNode;
  }) {
    if (item.isAi) {
      return (
        <View style={styles.articleWrap}>
          <ArticleMessage
            message={item}
            theme={theme}
            renderStructuredBlock={renderStructuredBlock}
          />
        </View>
      );
    }
    return (
      <View style={[styles.bubbleUser]}>
        <Text style={styles.bubbleUserText}>{item.content || " "}</Text>
      </View>
    );
  },
  (prev, next) =>
    prev.item.id === next.item.id &&
    prev.item.content === next.item.content &&
    prev.item.type === next.item.type,
);

export function ChatThreadScreen() {
  const theme = useThemedTheme();
  const insets = useSafeAreaInsets();
  const route = useRoute<ChatThreadRoute>();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const threadId = route.params?.threadId ?? null;
  const { data: session } = useSession();
  const userName = session?.user?.name || session?.user?.phoneNumber || "هناك";

  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const lastMessageRef = useRef<{
    id: string;
    content: string;
    length: number;
  } | null>(null);
  const scrollThrottleRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const styles = useMemo(() => createStyles(theme, insets), [theme, insets]);

  const messagesResult = useUIMessages(
    api.agents.actions.getThreadMessages,
    threadId ? { threadId } : "skip",
    { initialNumItems: 50, stream: true },
  );

  const sendMessage = useMutation(api.features.agent.actions.sendMessage);

  const rawMessages = (messagesResult?.results ?? []) as RawUIMessage[];
  const messages: ChatMessage[] = useMemo(() => {
    return rawMessages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => {
        try {
          return uiMessageToMessage({
            role: m.role,
            key: m.key,
            text: m.text ?? "",
            parts: m.parts,
          });
        } catch {
          return {
            id: m.key,
            content: m.text ?? "",
            isAi: m.role === "assistant",
            timestamp: "",
            type: "text" as const,
          };
        }
      });
  }, [rawMessages]);

  const lastRawMessage =
    rawMessages.length > 0 ? rawMessages[rawMessages.length - 1] : null;
  const isSearching = useMemo(() => {
    if (!lastRawMessage || lastRawMessage.role !== "assistant") return false;
    const parts = lastRawMessage.parts ?? [];
    return parts.some((p) => p.type === "tool-call");
  }, [lastRawMessage]);

  useEffect(() => {
    if (messages.length === 0) {
      setIsStreaming(false);
      lastMessageRef.current = null;
      return;
    }
    const last = messages[messages.length - 1];
    if (!last.isAi || last.content == null) {
      setIsStreaming(false);
      lastMessageRef.current = null;
      return;
    }
    const currentContent = String(last.content);
    const currentLength = currentContent.length;
    const currentId = last.id ?? "";
    const prev = lastMessageRef.current;
    if (prev && prev.id !== currentId) {
      setIsStreaming(currentLength > 0);
      lastMessageRef.current = {
        id: currentId,
        content: currentContent,
        length: currentLength,
      };
      return;
    }
    if (prev && prev.id === currentId) {
      if (prev.content === currentContent) {
        setIsStreaming(false);
      } else if (currentLength > prev.length) {
        setIsStreaming(true);
      } else {
        setIsStreaming(false);
      }
    } else if (!prev && currentLength > 0) {
      setIsStreaming(true);
    }
    lastMessageRef.current = {
      id: currentId,
      content: currentContent,
      length: currentLength,
    };
  }, [messages]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || !threadId || sending) return;
    setSendError(null);
    setInput("");
    setSending(true);
    try {
      await sendMessage({ threadId, body: text });
    } catch (e) {
      console.error(e);
      const msg =
        e instanceof Error
          ? e.message
          : "حدث خطأ أثناء الإرسال. حاول مرة أخرى.";
      setSendError(msg);
      Alert.alert("خطأ", msg);
    } finally {
      setSending(false);
    }
  }, [input, threadId, sending, sendMessage]);

  const handleSuggestionPress = useCallback(
    async (text: string) => {
      if (!threadId || sending) return;
      setSendError(null);
      setSending(true);
      try {
        await sendMessage({ threadId, body: text });
      } catch (e) {
        console.error(e);
        const msg =
          e instanceof Error
            ? e.message
            : "حدث خطأ أثناء الإرسال. حاول مرة أخرى.";
        setSendError(msg);
        Alert.alert("خطأ", msg);
      } finally {
        setSending(false);
      }
    },
    [threadId, sending, sendMessage],
  );

  const handlePropertyPress = useCallback(
    (property: PropertyCardData) => {
      if (property.id) {
        navigation.navigate("PropertyDetail", {
          propertyId: property.id,
          threadId: threadId ?? undefined,
        });
      }
    },
    [navigation, threadId],
  );

  const handleBankPress = useCallback(
    (bank: {
      name: string;
      product?: string;
      rate?: number;
      maxAmount?: number;
      maxYears?: number;
      bankId?: string;
    }) => {
      navigation.navigate("BankDetail", {
        bankId: bank.bankId || "unknown",
        bankName: bank.name,
        product: bank.product,
        rate: bank.rate,
        maxAmount: bank.maxAmount,
        maxYears: bank.maxYears,
      });
    },
    [navigation],
  );

  const renderStructuredBlock = useCallback(
    (type: ChatMessage["type"], data: unknown) => {
      return (
        <ComponentMapper
          type={type}
          data={data}
          theme={theme}
          onPropertyPress={handlePropertyPress}
          onBankPress={handleBankPress}
        />
      );
    },
    [theme, handlePropertyPress, handleBankPress],
  );

  const renderItem = useCallback(
    ({ item }: { item: ChatMessage }) => (
      <MemoizedMessageRow
        item={item}
        theme={theme}
        styles={styles}
        renderStructuredBlock={renderStructuredBlock}
      />
    ),
    [styles, theme, renderStructuredBlock],
  );

  const isLoadingFirstPage =
    messagesResult?.status === "LoadingFirstPage" ||
    messagesResult?.status === "LoadingMore";
  const isThinking = messages.length > 0 && !messages[messages.length - 1].isAi;

  const lastMessageContentLength =
    messages.length > 0
      ? (messages[messages.length - 1].content?.length ?? 0)
      : 0;
  const showFooterIndicator = isThinking || isSearching || isStreaming;
  const footerVariant: "thinking" | "writing" | "searching" = isThinking
    ? "thinking"
    : isSearching
      ? "searching"
      : "writing";

  useEffect(() => {
    if (messages.length === 0) return;
    const t = setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: messages.length > 2 });
    }, 100);
    return () => clearTimeout(t);
  }, [messages.length, lastMessageContentLength]);

  useEffect(() => {
    if (!isStreaming || messages.length === 0) return;
    const throttleMs = 150;
    if (scrollThrottleRef.current) clearTimeout(scrollThrottleRef.current);
    scrollThrottleRef.current = setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
      scrollThrottleRef.current = null;
    }, throttleMs);
    return () => {
      if (scrollThrottleRef.current) {
        clearTimeout(scrollThrottleRef.current);
        scrollThrottleRef.current = null;
      }
    };
  }, [isStreaming, lastMessageContentLength]);

  if (!threadId) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>اختر محادثة أو أنشئ واحدة جديدة.</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={80}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        keyboardDismissMode="on-drag"
        ListEmptyComponent={
          isLoadingFirstPage ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={styles.loadingText}>جاري تحميل المحادثة...</Text>
            </View>
          ) : (
            <View style={styles.welcome}>
              <Text style={styles.welcomeTitle}>مرحباً، {userName}</Text>
              <Text style={styles.welcomeSub}>كيف يمكنني مساعدتك؟</Text>
              <View style={styles.chips}>
                {SUGGESTIONS.map((q, i) => (
                  <Chip
                    key={i}
                    onPress={() => handleSuggestionPress(q)}
                    disabled={sending}
                    accessibilityLabel={q}
                  >
                    {q}
                  </Chip>
                ))}
              </View>
            </View>
          )
        }
        ListFooterComponent={
          showFooterIndicator ? (
            <View
              style={styles.thinkingWrap}
              accessibilityLabel={
                footerVariant === "thinking"
                  ? "جاري التفكير"
                  : footerVariant === "searching"
                    ? "جاري البحث في المصادر"
                    : "يكتب"
              }
              accessibilityLiveRegion="polite"
            >
              <ThinkingIndicator theme={theme} variant={footerVariant} />
            </View>
          ) : null
        }
      />
      {sendError ? (
        <View style={styles.errorWrap}>
          <Text style={styles.errorText}>{sendError}</Text>
        </View>
      ) : null}
      <View style={styles.inputRow}>
        <View style={styles.inputBar}>
          <TouchableOpacity
            style={[
              styles.sendBtn,
              input.trim().length > 0 && styles.sendBtnActive,
              sending && styles.sendBtnDisabled,
            ]}
            onPress={handleSend}
            disabled={sending}
            activeOpacity={0.8}
            accessibilityLabel="إرسال"
            accessibilityRole="button"
          >
            <Text
              style={[
                styles.sendBtnIcon,
                input.trim().length > 0 && styles.sendBtnIconActive,
              ]}
            >
              ↑
            </Text>
          </TouchableOpacity>
          <Input
            style={[styles.input, { textAlignVertical: "center" }]}
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
            accessibilityLabel="حقل الرسالة"
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
    center: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.background,
    },
    muted: {
      color: colors.mutedForeground,
      fontSize: fontSize.base,
      fontFamily: fontFamily.regular,
    },
    listContent: {
      padding: spacing.lg,
      paddingBottom: spacing["2xl"] + insets.bottom,
    },
    loadingWrap: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingVertical: spacing["3xl"],
      gap: spacing.md,
    },
    loadingText: {
      fontSize: fontSize.base,
      color: colors.mutedForeground,
      fontFamily: fontFamily.regular,
    },
    thinkingWrap: {
      width: "100%",
      alignSelf: "flex-start",
    },
    errorWrap: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      backgroundColor: colors.destructive + "20",
    },
    errorText: {
      fontSize: fontSize.sm,
      color: colors.destructive,
      fontFamily: fontFamily.regular,
    },
    bubble: {
      maxWidth: "85%",
      padding: spacing.md,
      borderRadius: radius.xl,
      marginVertical: spacing.xs,
    },
    articleWrap: {
      width: "100%",
      alignSelf: "flex-start",
    },
    bubbleUser: {
      maxWidth: "85%",
      padding: spacing.md,
      borderRadius: radius.xl,
      marginVertical: spacing.xs,
      alignSelf: "flex-end",
      backgroundColor: colors.primary,
    },
    bubbleUserText: {
      color: colors.primaryForeground,
      fontSize: fontSize.base,
      fontFamily: fontFamily.regular,
    },
    welcome: {
      padding: spacing.lg,
      paddingBottom: spacing["2xl"],
      alignItems: "center",
    },
    welcomeTitle: {
      fontSize: fontSize.xl,
      fontFamily: fontFamily.bold,
      color: colors.foreground,
      marginBottom: spacing.sm,
    },
    welcomeSub: {
      fontSize: fontSize.lg,
      fontFamily: fontFamily.regular,
      color: colors.mutedForeground,
      marginBottom: spacing.lg,
    },
    chips: {
      width: "100%",
      gap: spacing.md,
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
      backgroundColor: colors.input,
      borderRadius: 28,
      paddingHorizontal: spacing.sm,
      paddingVertical: 8,
    },
    input: {
      flex: 1,
      maxHeight: 120,
      marginStart: spacing.sm,
      backgroundColor: "transparent",
    },
    sendBtn: {
      width: 44,
      height: 44,
      minWidth: 44,
      minHeight: 44,
      borderRadius: radius.full,
      backgroundColor: colors.secondary,
      justifyContent: "center",
      alignItems: "center",
    },
    sendBtnActive: {
      backgroundColor: colors.primary,
    },
    sendBtnDisabled: {
      opacity: 0.6,
    },
    sendBtnIcon: {
      color: colors.mutedForeground,
      fontSize: 20,
      fontFamily: fontFamily.bold,
    },
    sendBtnIconActive: {
      color: colors.primaryForeground,
    },
  });
}
