"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { useUIMessages } from "@convex-dev/agent/react";
import { api } from "convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { useAnonymousChat } from "@/hooks/use-anonymous-chat";
import { useAnonymousUserId } from "@/contexts/anonymous-user-id";
import { useConversations } from "@/hooks/use-conversations";
import { uiMessageToMessage } from "@/lib/ui-message-mapper";

type RawUIMessage = {
  role?: string;
  key: string;
  text: string;
  _creationTime?: number;
  creationTime?: number;
  parts?: unknown[];
};

type ToolActivity = {
  id: string;
  toolName: string;
  label: string;
};

function mapToolNameToLabel(toolName: string): string {
  if (!toolName) return "جاري تنفيذ أداة...";
  if (toolName.includes("smartPropertySearch")) {
    return "جاري البحث عن عقارات مناسبة...";
  }
  if (toolName.includes("getLastSearchFindings")) {
    return "جاري قراءة نتائج البحث السابقة...";
  }
  if (toolName.includes("getMoreDetailsForProperty")) {
    return "جاري جمع تفاصيل العقار...";
  }
  if (toolName.includes("searchRealEstateInfo") || toolName.includes("webSearch")) {
    return "جاري جمع معلومات السوق...";
  }
  if (toolName.includes("memory") || toolName.includes("getUserMemory")) {
    return "جاري استرجاع تفضيلاتك المحفوظة...";
  }
  if (toolName.includes("formatAsArticle") || toolName.includes("formatPropertyOffer")) {
    return "جاري تنسيق الرد النهائي...";
  }
  if (toolName.includes("judgeSearchCoverage")) {
    return "جاري تقييم جودة النتائج...";
  }
  return `جاري تنفيذ: ${toolName}`;
}

function extractToolActivity(parts: unknown[] | undefined): string | null {
  if (!Array.isArray(parts)) return null;
  for (const part of parts) {
    const typed = part as { type?: string; input?: Record<string, unknown> };
    if (typed.type !== "tool-call") continue;
    const toolName = String(typed.input?.toolName ?? "").trim();
    return mapToolNameToLabel(toolName);
  }
  return null;
}

export function useChatSession(params: { threadId?: string | null }) {
  const { threadId: initialThreadId = null } = params;
  const router = useRouter();
  const sendMessage = useMutation(api.features.agent.actions.sendMessage);
  const { isAuthenticated, user } = useAuth();
  const anonymousUserId = useAnonymousUserId();
  const { remainingMessages, hasReachedLimit, incrementCount } =
    useAnonymousChat();
  const userId = isAuthenticated && user?.id ? user.id : anonymousUserId;

  const { createNew, refresh } = useConversations({
    userId,
    autoFetch: true,
  });

  const [activeThreadId, setActiveThreadId] = useState<string | null>(
    initialThreadId,
  );
  const [sendError, setSendError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isAwaitingAssistant, setIsAwaitingAssistant] = useState(false);

  useEffect(() => {
    setActiveThreadId(initialThreadId);
  }, [initialThreadId]);

  const uiMessagesResult = useUIMessages(
    api.features.agent.actions.getThreadMessages,
    activeThreadId ? { threadId: activeThreadId } : "skip",
    { initialNumItems: 50, stream: true },
  );

  const rawMessages = useMemo(
    () => (uiMessagesResult?.results ?? []) as RawUIMessage[],
    [uiMessagesResult?.results],
  );
  const threadStatus = uiMessagesResult?.status;

  const messages = useMemo(
    () =>
      rawMessages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) =>
          uiMessageToMessage(
            m as {
              role?: string;
              key: string;
              text: string;
              _creationTime?: number;
              creationTime?: number;
              parts?: {
                type?: string;
                toolCallId?: string;
                input?: unknown;
                output?: unknown;
              }[];
            },
          ),
        ),
    [rawMessages],
  );

  const lastAssistantMessageRef = useRef<string | null>(null);
  useEffect(() => {
    const lastAssistant = [...messages].reverse().find((m) => m.isAi);
    const lastAssistantId = lastAssistant?.id ?? null;
    if (lastAssistantId && lastAssistantId !== lastAssistantMessageRef.current) {
      lastAssistantMessageRef.current = lastAssistantId;
      setIsAwaitingAssistant(false);
      setIsSending(false);
    }
  }, [messages]);

  const isLoadingThread = Boolean(
    activeThreadId && threadStatus === "LoadingFirstPage",
  );
  const isStreaming = isAwaitingAssistant || isSending;
  const toolActivityLabel = useMemo(() => {
    for (let i = rawMessages.length - 1; i >= 0; i -= 1) {
      const candidate = rawMessages[i];
      if (candidate.role !== "assistant") continue;
      const label = extractToolActivity(candidate.parts);
      if (label) return label;
      if ((candidate.text ?? "").trim().length > 0) break;
    }
    return null;
  }, [rawMessages]);

  const toolActivities = useMemo(() => {
    const collected: ToolActivity[] = [];
    const seen = new Set<string>();
    for (const message of rawMessages) {
      if (message.role !== "assistant" || !Array.isArray(message.parts)) continue;
      for (let i = 0; i < message.parts.length; i += 1) {
        const part = message.parts[i] as {
          type?: string;
          input?: Record<string, unknown>;
        };
        if (part.type !== "tool-call") continue;
        const toolName = String(part.input?.toolName ?? "").trim();
        const id = `${message.key}-${i}-${toolName || "unknown"}`;
        if (seen.has(id)) continue;
        seen.add(id);
        collected.push({
          id,
          toolName,
          label: mapToolNameToLabel(toolName),
        });
      }
    }
    return collected.slice(-5);
  }, [rawMessages]);

  const chatPhase = useMemo<
    "idle" | "sending" | "reasoning" | "responding" | "error"
  >(() => {
    if (sendError) return "error";
    if (isSending) return "sending";
    if (isAwaitingAssistant && toolActivities.length > 0) return "reasoning";
    if (isAwaitingAssistant) return "responding";
    return "idle";
  }, [isAwaitingAssistant, isSending, sendError, toolActivities.length]);

  const send = useCallback(
    async (message: string) => {
      const trimmed = message.trim();
      if (!trimmed) return;
      setSendError(null);

      let targetThreadId = activeThreadId;
      setIsSending(true);
      setIsAwaitingAssistant(true);

      try {
        if (!targetThreadId) {
          const created = await createNew(trimmed.slice(0, 50));
          if (!created?.id) {
            throw new Error("Failed to create a new conversation");
          }
          targetThreadId = created.id;
          setActiveThreadId(created.id);
          router.replace(`/chat/${created.id}`);
        }

        await sendMessage({ threadId: targetThreadId, body: trimmed });
        if (!isAuthenticated) incrementCount();
        refresh();
      } catch (error) {
        setIsSending(false);
        setIsAwaitingAssistant(false);
        setSendError(
          error instanceof Error ? error.message : "فشل إرسال الرسالة. حاول مرة أخرى.",
        );
      }
    },
    [
      activeThreadId,
      createNew,
      incrementCount,
      isAuthenticated,
      refresh,
      router,
      sendMessage,
    ],
  );

  return {
    user,
    isAuthenticated,
    userId,
    activeThreadId,
    messages,
    rawMessages,
    remainingMessages,
    hasReachedLimit,
    isLoadingThread,
    isSending,
    isAwaitingAssistant,
    isStreaming,
    chatPhase,
    toolActivityLabel,
    toolActivities,
    sendError,
    setSendError,
    send,
  };
}
