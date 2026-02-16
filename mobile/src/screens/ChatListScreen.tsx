import React, { useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useMutation, usePaginatedQuery } from "convex/react";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { api } from "../convex";
import { useThemedTheme, type ThemeTokens } from "../theme";
import { useSession } from "../lib/auth-client";
import { Button } from "../components/Button";
import {
  groupConversationsByDate,
  formatRelativeTime,
  type Conversation,
} from "../lib/convex-chat";
import { getOrCreateAnonUserId, ANON_PREFIX } from "../lib/anonymous-user";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function ChatListScreen() {
  const theme = useThemedTheme();
  const navigation = useNavigation<Nav>();
  const { data: session } = useSession();
  const userId = session?.user?.id ?? getOrCreateAnonUserId();
  const queryUserId = userId;
  const isAuthenticated = !!session?.user && !userId.startsWith(ANON_PREFIX);
  const shouldFetch = !!queryUserId;

  const styles = useMemo(() => createStyles(theme), [theme]);

  const { results, status } = usePaginatedQuery(
    api.features.agent.actions.listThreads,
    shouldFetch ? { userId: queryUserId } : "skip",
    { initialNumItems: 50 }
  );

  const createThread = useMutation(api.features.agent.actions.createThreadAction);

  const conversations: Conversation[] = (results ?? []).map((t: { _id: string; _creationTime?: number; title?: string }) => ({
    id: t._id,
    title: (t.title?.trim() && t.title) || "محادثة جديدة",
    lastMessage: undefined,
    updatedAt: t._creationTime ? new Date(t._creationTime).toISOString() : new Date().toISOString(),
    createdAt: t._creationTime ? new Date(t._creationTime).toISOString() : new Date().toISOString(),
  }));

  const grouped = groupConversationsByDate(conversations);

  const handleNewChat = useCallback(async () => {
    try {
      const { threadId } = await createThread({
        userId: isAuthenticated ? undefined : queryUserId,
        title: "محادثة جديدة",
      });
      navigation.replace("ChatThread", { threadId });
    } catch (e) {
      console.error(e);
    }
  }, [createThread, navigation, queryUserId, isAuthenticated]);

  const renderItem = useCallback(
    ({ item }: { item: Conversation }) => (
      <TouchableOpacity
        style={styles.row}
        onPress={() => navigation.replace("ChatThread", { threadId: item.id })}
        activeOpacity={0.7}
        accessibilityLabel={item.title}
        accessibilityRole="button"
      >
        <Text style={styles.rowTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.rowTime}>{formatRelativeTime(item.updatedAt)}</Text>
      </TouchableOpacity>
    ),
    [navigation, styles]
  );

  const isLoading = status === "LoadingFirstPage";

  return (
    <View style={styles.container}>
      <View style={styles.newButtonWrap}>
        <Button onPress={handleNewChat} accessibilityLabel="محادثة جديدة">
          محادثة جديدة
        </Button>
      </View>
      {isLoading ? (
        <ActivityIndicator size="large" color={theme.colors.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListEmptyComponent={
            <Text style={styles.empty}>لا توجد محادثات. ابدأ محادثة جديدة.</Text>
          }
          contentContainerStyle={conversations.length === 0 ? styles.emptyList : undefined}
        />
      )}
    </View>
  );
}

function createStyles(theme: ThemeTokens) {
  const { colors, radius, spacing, fontSize, fontFamily } = theme;
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingHorizontal: spacing.lg,
    },
    newButtonWrap: {
      margin: spacing.md,
      marginHorizontal: 0,
    },
    row: {
      padding: spacing.md,
      minHeight: 44,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      borderRadius: radius.lg,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    rowTitle: {
      color: colors.foreground,
      fontSize: fontSize.base,
      fontFamily: fontFamily.regular,
      flex: 1,
    },
    rowTime: {
      color: colors.mutedForeground,
      fontSize: fontSize.sm,
      fontFamily: fontFamily.regular,
      marginLeft: spacing.sm,
    },
    loader: {
      marginTop: spacing.xl,
    },
    empty: {
      color: colors.mutedForeground,
      textAlign: "center",
      fontFamily: fontFamily.regular,
      marginTop: spacing.xl,
      padding: spacing.lg,
    },
    emptyList: {
      flexGrow: 1,
    },
  });
}
