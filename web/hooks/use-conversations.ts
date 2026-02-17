"use client";

/**
 * useConversations - Convex backend
 * Uses listThreads and createThreadAction from our Convex agent.
 * Thread titles come from the first user message (stored when creating).
 */

import {
  useMutation,
  usePaginatedQuery,
  useQuery,
} from "convex/react";
import { useCallback, useMemo, useState } from "react";
import { api } from "convex/_generated/api";
import {
  groupConversationsByDate,
  formatRelativeTime,
  type Conversation,
} from "@/lib/convex-chat";
import { createLogger } from "@/lib/logger";

const log = createLogger("useConversations");

export interface UseConversationsOptions {
  /** User ID for listing threads. */
  userId?: string;
  /** Whether to fetch when userId is set. Default true. */
  autoFetch?: boolean;
  /** When set, search threads by title instead of listing all. */
  searchQuery?: string;
}

export interface UseConversationsReturn {
  conversations: Conversation[];
  groupedConversations: ReturnType<typeof groupConversationsByDate>;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
  createNew: (title: string) => Promise<Conversation | null>;
  remove: (id: string) => Promise<boolean>;
  clearError: () => void;
}

type ThreadFromList = { _id: string; _creationTime?: number; title?: string };

function threadToConversation(thread: ThreadFromList): Conversation {
  const updatedAt = thread._creationTime
    ? new Date(thread._creationTime).toISOString()
    : new Date().toISOString();
  return {
    id: thread._id,
    title: (thread.title?.trim() && thread.title) || "محادثة جديدة",
    lastMessage: undefined,
    updatedAt,
    createdAt: updatedAt,
  };
}

export function useConversations(
  options: UseConversationsOptions = {},
): UseConversationsReturn {
  const { userId, autoFetch = true, searchQuery } = options;

  const queryUserId = userId ?? null;
  const shouldFetch = autoFetch && !!queryUserId;
  const hasSearch = !!searchQuery?.trim();
  const [error, setError] = useState<string | null>(null);

  const { results, status } = usePaginatedQuery(
    api.features.agent.actions.listThreads,
    shouldFetch && !hasSearch ? { userId: queryUserId } : "skip",
    { initialNumItems: 50 },
  );

  const searchResults = useQuery(
    api.features.agent.actions.searchThreads,
    shouldFetch && hasSearch
      ? {
          userId: queryUserId ?? undefined,
          query: searchQuery!.trim(),
          limit: 50,
        }
      : "skip",
  );

  const isAuthenticated = userId && !userId.startsWith("anon");

  const createThread = useMutation(
    api.features.agent.actions.createThreadAction,
  );
  const deleteThreadMutation = useMutation(api.features.agent.actions.deleteThread);

  const conversations: Conversation[] = useMemo(() => {
    const list = hasSearch ? (searchResults ?? []) : (results ?? []);
    return list.map((t) => threadToConversation(t as ThreadFromList));
  }, [hasSearch, results, searchResults]);

  const groupedConversations = useMemo(
    () => groupConversationsByDate(conversations),
    [conversations],
  );

  const refresh = useCallback(() => {
    // Convex auto-refreshes; no-op for API compatibility
  }, []);

  const createNew = useCallback(
    async (title: string): Promise<Conversation | null> => {
      try {
        // For authenticated users, don't pass userId - backend gets it from auth context
        // For anonymous users, pass userId or let backend generate unique ID
        const { threadId } = await createThread({
          userId: isAuthenticated ? undefined : (queryUserId ?? undefined),
          title,
        });
        return {
          id: threadId,
          title: title.slice(0, 50) || "محادثة جديدة",
          lastMessage: undefined,
          updatedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        };
      } catch (err) {
        log.error("Error creating thread:", err);
        setError(
          err instanceof Error ? err.message : "حدث خطأ أثناء إنشاء المحادثة",
        );
        return null;
      }
    },
    [isAuthenticated, queryUserId, createThread],
  );

  const remove = useCallback(
    async (threadId: string): Promise<boolean> => {
      try {
        await deleteThreadMutation({
          threadId,
          userId: isAuthenticated ? undefined : (queryUserId ?? undefined),
        });
        return true;
      } catch (err) {
        log.error("Error deleting thread:", err);
        setError(
          err instanceof Error ? err.message : "حدث خطأ أثناء حذف المحادثة",
        );
        return false;
      }
    },
    [deleteThreadMutation, isAuthenticated, queryUserId],
  );

  const isLoading = hasSearch
    ? searchResults === undefined
    : status === "LoadingFirstPage";

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    conversations,
    groupedConversations,
    isLoading,
    error,
    refresh,
    createNew,
    remove,
    clearError,
  };
}

export { formatRelativeTime };
