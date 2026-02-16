"use client";

/**
 * useAnonymousChat Hook
 * Tracks anonymous user message count and limits
 */

import { useState, useCallback } from "react";
import { ANONYMOUS_CHAT } from "@/lib/config";

export interface UseAnonymousChatReturn {
  messageCount: number;
  remainingMessages: number;
  hasReachedLimit: boolean;
  canSendMessage: boolean;
  incrementCount: () => void;
  resetCount: () => void;
}

function getStoredCount(): number {
  if (typeof window === "undefined") return 0;
  const stored = localStorage.getItem(ANONYMOUS_CHAT.STORAGE_KEY);
  if (!stored) return 0;
  try {
    const data = JSON.parse(stored);
    const today = new Date().toDateString();
    if (data.date === today) {
      return data.count;
    }
    localStorage.removeItem(ANONYMOUS_CHAT.STORAGE_KEY);
    return 0;
  } catch {
    return 0;
  }
}

export function useAnonymousChat(): UseAnonymousChatReturn {
  const [messageCount, setMessageCount] = useState<number>(getStoredCount);

  const incrementCount = useCallback(() => {
    setMessageCount((prev) => {
      const newCount = prev + 1;

      if (typeof window !== "undefined") {
        localStorage.setItem(
          ANONYMOUS_CHAT.STORAGE_KEY,
          JSON.stringify({
            count: newCount,
            date: new Date().toDateString(),
          }),
        );
      }

      return newCount;
    });
  }, []);

  const resetCount = useCallback(() => {
    setMessageCount(0);
    if (typeof window !== "undefined") {
      localStorage.removeItem(ANONYMOUS_CHAT.STORAGE_KEY);
    }
  }, []);

  const remainingMessages = Math.max(
    0,
    ANONYMOUS_CHAT.MAX_MESSAGES - messageCount,
  );
  const hasReachedLimit = messageCount >= ANONYMOUS_CHAT.MAX_MESSAGES;
  const canSendMessage = !hasReachedLimit;

  return {
    messageCount,
    remainingMessages,
    hasReachedLimit,
    canSendMessage,
    incrementCount,
    resetCount,
  };
}

export default useAnonymousChat;
