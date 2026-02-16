/**
 * ConversationsScreen - List of all chat conversations
 * Clean, minimal design with swipe-to-delete functionality
 */
import React, {
  useCallback,
  useMemo,
  useState,
  useEffect,
  useRef,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Animated,
  PanResponder,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Ionicons from "@expo/vector-icons/Ionicons";
import {
  useMutation,
  usePaginatedQuery,
  useQuery,
} from "convex/react";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { api } from "../convex";
import { useThemedTheme, type ThemeTokens } from "../theme";
import { useSession } from "../lib/auth-client";
import {
  groupConversationsByDate,
  formatRelativeTime,
  type Conversation,
} from "../lib/convex-chat";
import { getOrCreateAnonUserId, ANON_PREFIX } from "../lib/anonymous-user";
import { Input } from "../components/Input";

const MAX_TITLE_LENGTH = 50;
const DELETE_THRESHOLD = -80;

/**
 * Truncates long titles for display
 */
function truncateTitle(title: string): string {
  if (title.length <= MAX_TITLE_LENGTH) return title;
  return title.slice(0, MAX_TITLE_LENGTH) + "...";
}

type Nav = NativeStackNavigationProp<RootStackParamList>;

/**
 * SwipeableRow - Individual conversation with swipe-to-delete
 */
function SwipeableRow({
  conv,
  onPress,
  onDelete,
  theme,
}: {
  conv: Conversation;
  onPress: (threadId: string) => void;
  onDelete: (conv: Conversation) => void;
  theme: ThemeTokens;
}) {
  const translateX = useRef(new Animated.Value(0)).current;
  const deleteWidth = 80;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gesture) => {
        return (
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
          // Show delete
          Animated.spring(translateX, {
            toValue: -deleteWidth,
            useNativeDriver: true,
            tension: 80,
            friction: 10,
          }).start();
        } else {
          // Hide delete
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

  const handleDelete = useCallback(() => {
    Alert.alert("حذف المحادثة", "هل أنت متأكد من حذف هذه المحادثة؟", [
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
          onDelete(conv);
        },
      },
    ]);
  }, [conv, onDelete, translateX]);

  return (
    <View style={localStyles.rowContainer}>
      {/* Delete button underneath */}
      <Animated.View
        style={[
          localStyles.deleteBackground,
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
          style={localStyles.deleteButton}
          onPress={handleDelete}
        >
          <Ionicons name="trash" size={22} color="#fff" />
          <Text style={localStyles.deleteText}>حذف</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Main row content */}
      <Animated.View
        style={[
          localStyles.rowContent,
          {
            backgroundColor: theme.colors.background,
            transform: [{ translateX }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          style={localStyles.rowTouchable}
          onPress={() => onPress(conv.id)}
          activeOpacity={0.7}
        >
          <View style={localStyles.rowInner}>
            <Text
              style={[localStyles.rowTitle, { color: theme.colors.foreground }]}
              numberOfLines={1}
            >
              {truncateTitle(conv.title)}
            </Text>
            <Text
              style={[
                localStyles.rowTime,
                { color: theme.colors.mutedForeground },
              ]}
            >
              {formatRelativeTime(conv.updatedAt)}
            </Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const localStyles = StyleSheet.create({
  rowContainer: {
    overflow: "hidden",
  },
  deleteBackground: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingLeft: 20,
    backgroundColor: "#dc2626",
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
  rowContent: {
    flex: 1,
  },
  rowTouchable: {
    flex: 1,
  },
  rowInner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  rowTitle: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Cairo_400Regular",
    textAlign: "right",
  },
  rowTime: {
    fontSize: 12,
    fontFamily: "Cairo_400Regular",
    marginLeft: 8,
  },
});

export function ConversationsScreen() {
  const theme = useThemedTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { data: session } = useSession();
  const userId = session?.user?.id ?? getOrCreateAnonUserId();
  const isAuthenticated = !!session?.user && !userId.startsWith(ANON_PREFIX);

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [creatingThread, setCreatingThread] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const styles = useMemo(() => createStyles(theme, insets), [theme, insets]);

  const shouldFetch = !!userId;
  const hasSearch = !!debouncedSearch;

  const { results, status } = usePaginatedQuery(
    api.features.agent.actions.listThreads,
    shouldFetch && !hasSearch ? { userId } : "skip",
    { initialNumItems: 50 },
  );

  const searchResults = useQuery(
    api.features.agent.actions.searchThreads,
    shouldFetch && hasSearch
      ? { userId, query: debouncedSearch, limit: 50 }
      : "skip",
  );

  const createThread = useMutation(
    api.features.agent.actions.createThreadAction,
  );
  const deleteThreadMutation = useMutation(api.features.agent.actions.deleteThread);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Refresh control
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  useEffect(() => {
    if (refreshing && status !== "LoadingFirstPage" && !hasSearch) {
      setRefreshing(false);
    }
  }, [refreshing, status, hasSearch]);

  // Parse conversations
  const conversations: Conversation[] = useMemo(() => {
    const list = hasSearch ? (searchResults ?? []) : (results ?? []);
    return list.map(
      (t: { _id: string; _creationTime?: number; title?: string }) => ({
        id: t._id,
        title: (t.title?.trim() && t.title) || "محادثة جديدة",
        lastMessage: undefined,
        updatedAt: t._creationTime
          ? new Date(t._creationTime).toISOString()
          : new Date().toISOString(),
        createdAt: t._creationTime
          ? new Date(t._creationTime).toISOString()
          : new Date().toISOString(),
      }),
    );
  }, [hasSearch, results, searchResults]);

  const grouped = useMemo(
    () => groupConversationsByDate(conversations),
    [conversations],
  );

  const TIME_GROUPS = [
    { key: "today" as const, title: "اليوم" },
    { key: "yesterday" as const, title: "أمس" },
    { key: "lastWeek" as const, title: "هذا الأسبوع" },
    { key: "older" as const, title: "أقدم" },
  ];

  const sections = useMemo(
    () =>
      TIME_GROUPS.filter(
        ({ key }) => grouped[key] && grouped[key].length > 0,
      ).map(({ key, title }) => ({
        title,
        data: grouped[key] ?? [],
      })),
    [grouped],
  );

  // Create new chat
  const handleNewChat = useCallback(async () => {
    if (creatingThread) return;
    setCreatingThread(true);
    try {
      const { threadId } = await createThread({
        userId: isAuthenticated ? undefined : userId,
        title: "محادثة جديدة",
      });
      navigation.replace("ChatThread", { threadId });
    } catch (e) {
      console.error(e);
      Alert.alert("خطأ", "تعذر إنشاء المحادثة.");
    } finally {
      setCreatingThread(false);
    }
  }, [createThread, navigation, userId, isAuthenticated, creatingThread]);

  // Open conversation
  const handleConversationPress = useCallback(
    (threadId: string) => {
      navigation.replace("ChatThread", { threadId });
    },
    [navigation],
  );

  // Delete conversation
  const handleDelete = useCallback(
    async (conv: Conversation) => {
      try {
        await deleteThreadMutation({ threadId: conv.id });
      } catch (e) {
        console.error(e);
        Alert.alert("خطأ", "تعذر حذف المحادثة.");
      }
    },
    [deleteThreadMutation],
  );

  const isLoading = hasSearch
    ? searchResults === undefined
    : status === "LoadingFirstPage";
  const hasAny = conversations.length > 0;

  // Render conversation row with swipe
  const renderItem = useCallback(
    ({ item }: { item: Conversation }) => (
      <SwipeableRow
        conv={item}
        onPress={handleConversationPress}
        onDelete={handleDelete}
        theme={theme}
      />
    ),
    [handleConversationPress, handleDelete, theme],
  );

  // Render section header
  const renderSectionHeader = useCallback(
    ({ section }: { section: { title: string } }) => (
      <Text style={styles.groupTitle}>{section.title}</Text>
    ),
    [styles],
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerBtn}
        >
          <Ionicons name="close" size={24} color={theme.colors.foreground} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>المحادثات</Text>
        <TouchableOpacity
          onPress={handleNewChat}
          style={styles.headerBtn}
          disabled={creatingThread}
        >
          {creatingThread ? (
            <ActivityIndicator size="small" color={theme.colors.primary} />
          ) : (
            <Ionicons name="add" size={24} color={theme.colors.primary} />
          )}
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchBar}>
        <Input
          style={styles.searchInput}
          placeholder="بحث في المحادثات..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          textAlign="right"
          writingDirection="rtl"
        />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {isLoading ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : !hasAny ? (
          <View style={styles.emptyWrap}>
            <Ionicons
              name="chatbubbles-outline"
              size={48}
              color={theme.colors.mutedForeground}
            />
            <Text style={styles.emptyText}>
              {hasSearch ? "لا توجد نتائج" : "لا توجد محادثات"}
            </Text>
            {!hasSearch && (
              <TouchableOpacity style={styles.emptyBtn} onPress={handleNewChat}>
                <Text style={styles.emptyBtnText}>ابدأ محادثة جديدة</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <FlatList
            data={conversations}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={theme.colors.primary}
              />
            }
          />
        )}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        {session?.user ? (
          <TouchableOpacity
            style={styles.footerRow}
            onPress={() => navigation.replace("Profile")}
          >
            <Ionicons
              name="settings-outline"
              size={20}
              color={theme.colors.mutedForeground}
            />
            <Text style={styles.footerText}>
              {session.user.name || session.user.phoneNumber || "الحساب"}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.footerRow}
            onPress={() => navigation.replace("Auth")}
          >
            <Ionicons
              name="log-in-outline"
              size={20}
              color={theme.colors.primary}
            />
            <Text style={styles.footerLink}>تسجيل الدخول</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function createStyles(
  theme: ThemeTokens,
  insets: { top: number; bottom: number },
) {
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
      paddingTop: Math.max(insets.top, spacing.md),
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.sm,
    },
    headerBtn: {
      width: 44,
      height: 44,
      justifyContent: "center",
      alignItems: "center",
    },
    headerTitle: {
      flex: 1,
      fontSize: fontSize.xl,
      fontFamily: fontFamily.bold,
      color: colors.foreground,
      textAlign: "center",
    },
    searchBar: {
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.sm,
    },
    searchInput: {
      backgroundColor: colors.card,
      borderRadius: radius.lg,
    },
    content: {
      flex: 1,
    },
    loaderWrap: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    emptyWrap: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: spacing.xl,
    },
    emptyText: {
      fontSize: fontSize.base,
      fontFamily: fontFamily.regular,
      color: colors.mutedForeground,
      marginTop: spacing.md,
      textAlign: "center",
    },
    emptyBtn: {
      marginTop: spacing.lg,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      backgroundColor: colors.primary,
      borderRadius: radius.lg,
    },
    emptyBtnText: {
      fontSize: fontSize.base,
      fontFamily: fontFamily.medium,
      color: colors.primaryForeground,
    },
    listContent: {
      paddingBottom: spacing.xl,
    },
    groupTitle: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      fontSize: fontSize.sm,
      fontFamily: fontFamily.medium,
      color: colors.mutedForeground,
      textAlign: "right",
    },
    footer: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      paddingBottom: Math.max(spacing.sm, insets.bottom),
    },
    footerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.sm,
    },
    footerText: {
      fontSize: fontSize.base,
      fontFamily: fontFamily.regular,
      color: colors.mutedForeground,
    },
    footerLink: {
      fontSize: fontSize.base,
      fontFamily: fontFamily.medium,
      color: colors.primary,
    },
  });
}
