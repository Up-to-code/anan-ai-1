"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { useUIMessages } from "@convex-dev/agent/react";
import { ChatInput } from "./chat-input";
import { ChatBubble } from "./chat-bubble";
import { WelcomeScreen } from "./welcome-screen";
import {
  WritingEffect,
  ThinkingIndicator,
  InitialLoadingEffect,
} from "./chat-effects";
import { Button } from "@/components/ui/button";
import { ArrowDown, AlertCircle, MessageSquare, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useAnonymousChat } from "@/hooks/use-anonymous-chat";
import { useAnonymousUserId } from "@/contexts/anonymous-user-id";
import { useConversations } from "@/hooks/use-conversations";
import { AuthDialog } from "@/components/auth/auth-dialog";
import { api } from "convex/_generated/api";
import { uiMessageToMessage } from "@/lib/ui-message-mapper";
import { onEvent, EVENTS } from "@/lib/events";
import { createLogger } from "@/lib/logger";
import { LoadingSpinner } from "@/components/common/loading-spinner";

const log = createLogger("ChatInterface");

interface ChatInterfaceProps {
  conversationId?: string | null;
  initialMessage?: string;
}

export function ChatInterface({
  conversationId: propConversationId = null,
  initialMessage,
}: ChatInterfaceProps) {
  const router = useRouter();
  const threadId = propConversationId;
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [inputHeight, setInputHeight] = useState(0);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [isSwitchingThread, setIsSwitchingThread] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [scrollReady, setScrollReady] = useState(false);
  const prevThreadIdRef = useRef<string | null>(null);

  const { isAuthenticated, user } = useAuth();
  const anonymousUserId = useAnonymousUserId();
  const { remainingMessages, hasReachedLimit, incrementCount, resetCount } =
    useAnonymousChat();

  const userId = isAuthenticated && user?.id ? user.id : anonymousUserId;

  const { createNew, refresh: refreshConversations } = useConversations({
    userId,
    autoFetch: true,
  });

  const sendMessage = useMutation(api.features.agent.actions.sendMessage);
  const messagesResult = useUIMessages(
    api.features.agent.actions.getThreadMessages,
    threadId ? { threadId } : "skip",
    { initialNumItems: 50, stream: true },
  );

  const rawMessages = useMemo(
    () =>
      (messagesResult?.results ?? []) as Array<{
        role?: string;
        key: string;
        text: string;
        parts?: unknown[];
      }>,
    [messagesResult?.results],
  );

  const chatMessages = useMemo(() => {
    return rawMessages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) =>
        uiMessageToMessage(
          m as {
            role?: string;
            key: string;
            text: string;
            parts?: {
              type?: string;
              toolCallId?: string;
              input?: unknown;
              output?: unknown;
            }[];
          },
        ),
      );
  }, [rawMessages]);

  const isLoading = threadId && rawMessages.length === 0;
  const [isSending, setIsSending] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const lastMessageRef = useRef<{
    content: string;
    length: number;
    id: string;
  } | null>(null);

  useEffect(() => {
    if (
      prevThreadIdRef.current !== threadId &&
      prevThreadIdRef.current !== null
    ) {
      setIsSwitchingThread(true);
      const timer = setTimeout(() => setIsSwitchingThread(false), 500);
      return () => clearTimeout(timer);
    }
    prevThreadIdRef.current = threadId;
  }, [threadId]);

  useEffect(() => {
    const cleanup = onEvent(EVENTS.CONVERSATION_DELETED, (detail?: unknown) => {
      const id = (detail as { id?: string } | undefined)?.id;
      if (id === threadId) {
        router.push("/chat/new");
      }
    });
    return cleanup;
  }, [router, threadId]);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      if (behavior === "auto") {
        container.scrollTop = container.scrollHeight - container.clientHeight;
      } else if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({
          behavior,
          block: "end",
          inline: "nearest",
        });
      }
    }
  }, []);

  // Debounced scroll handler to prevent lag
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const handleScroll = useCallback(() => {
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = setTimeout(() => {
      const container = scrollContainerRef.current;
      if (container) {
        const { scrollTop, scrollHeight, clientHeight } = container;
        setShowScrollButton(scrollHeight - scrollTop - clientHeight > 150);
      }
    }, 100);
  }, []);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || !scrollReady) return;
    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      container.removeEventListener("scroll", handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [handleScroll, scrollReady]);

  const lastMessageContentLength =
    chatMessages.length > 0
      ? (chatMessages[chatMessages.length - 1].content?.length ?? 0)
      : 0;
  useEffect(() => {
    if (chatMessages.length > 0) {
      const t = setTimeout(
        () => scrollToBottom(chatMessages.length <= 2 ? "auto" : "smooth"),
        150,
      );
      return () => clearTimeout(t);
    }
  }, [chatMessages.length, lastMessageContentLength, scrollToBottom]);

  const handleAuthSuccess = () => {
    resetCount();
    setShowAuthDialog(false);
    refreshConversations();
  };

  const handleSend = async (userMessage: string) => {
    if (!isAuthenticated && hasReachedLimit) {
      setShowAuthDialog(true);
      return;
    }

    setSendError(null);
    setIsSending(true);
    setIsThinking(true);
    let currentThreadId = threadId;

    try {
      if (!currentThreadId) {
        const newConv = await createNew(userMessage.substring(0, 50));
        if (newConv?.id) {
          currentThreadId = newConv.id;
          // Update URL immediately so refresh during sendMessage keeps correct route
          if (typeof window !== "undefined") {
            window.history.replaceState(null, "", `/chat/${currentThreadId}`);
          }
          router.replace(`/chat/${currentThreadId}`);
        } else {
          throw new Error("Failed to create thread");
        }
      }

      if (currentThreadId) {
        await sendMessage({ threadId: currentThreadId, body: userMessage });
        if (!isAuthenticated) incrementCount();
      }
      refreshConversations();
    } catch (error) {
      log.error("Send error:", error);
      setIsThinking(false);
      setSendError(
        error instanceof Error
          ? error.message
          : "حدث خطأ أثناء الإرسال. حاول مرة أخرى.",
      );
    } finally {
      setIsSending(false);
    }
  };

  // Auto-send initial message from hero chat
  const initialMessageSentRef = useRef(false);
  useEffect(() => {
    if (initialMessage && !initialMessageSentRef.current) {
      initialMessageSentRef.current = true;
      // Small delay to ensure component is mounted
      const timer = setTimeout(() => {
        handleSend(initialMessage);
      }, 300);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMessage]);

  // Track when streaming starts to transition from thinking to writing
  useEffect(() => {
    if (chatMessages.length > 0 && isThinking) {
      // Check if there's a new AI message
      const lastMessage = chatMessages[chatMessages.length - 1];
      if (lastMessage.isAi && lastMessage.content) {
        setIsThinking(false);
      }
    }
  }, [chatMessages, isThinking]);

  // Detect active streaming by tracking message content growth
  useEffect(() => {
    if (chatMessages.length === 0) {
      setIsStreaming(false);
      lastMessageRef.current = null;
      return;
    }

    const lastMessage = chatMessages[chatMessages.length - 1];
    if (!lastMessage.isAi || !lastMessage.content) {
      setIsStreaming(false);
      lastMessageRef.current = null;
      return;
    }

    const currentContent = String(lastMessage.content);
    const currentLength = currentContent.length;
    const currentId = lastMessage.id ?? "";
    const previous = lastMessageRef.current;

    // If message ID changed, it's a new message
    if (previous && previous.id !== currentId) {
      setIsStreaming(currentLength > 0);
      lastMessageRef.current = {
        content: currentContent,
        length: currentLength,
        id: currentId,
      };
      return;
    }

    // If same message, check if content is growing
    if (previous && previous.id === currentId) {
      if (previous.content === currentContent) {
        // Content hasn't changed - not streaming
        setIsStreaming(false);
      } else if (currentLength > previous.length) {
        // Content is growing - actively streaming
        setIsStreaming(true);
      } else {
        // Content changed but not growing (might be complete)
        setIsStreaming(false);
      }
    } else if (!previous && currentLength > 0) {
      // New message started
      setIsStreaming(true);
    }

    lastMessageRef.current = {
      content: currentContent,
      length: currentLength,
      id: currentId,
    };
  }, [chatMessages]);

  // Throttled auto-scroll during streaming (every 150ms to avoid excessive scrolls)
  const scrollThrottleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastScrollRef = useRef<number>(0);
  useEffect(() => {
    if (!isStreaming || !messagesEndRef.current) return;
    const now = Date.now();
    const elapsed = now - lastScrollRef.current;
    const throttleMs = 150;
    if (elapsed >= throttleMs || lastScrollRef.current === 0) {
      lastScrollRef.current = now;
      scrollToBottom("smooth");
    } else {
      if (scrollThrottleRef.current) clearTimeout(scrollThrottleRef.current);
      scrollThrottleRef.current = setTimeout(() => {
        lastScrollRef.current = Date.now();
        scrollToBottom("smooth");
      }, throttleMs - elapsed);
    }
    return () => {
      if (scrollThrottleRef.current) {
        clearTimeout(scrollThrottleRef.current);
        scrollThrottleRef.current = null;
      }
    };
  }, [isStreaming, chatMessages, scrollToBottom]);

  return (
    <div
      className="flex flex-col h-full bg-background relative overflow-hidden"
      dir="rtl"
    >
      {/* Unified System Header Spacer */}
      <div className="h-12 w-full shrink-0" />

      <div
        ref={(el) => {
          scrollContainerRef.current = el;
          queueMicrotask(() => setScrollReady(!!el));
        }}
        className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth overscroll-contain overscroll-y-contain flex justify-center"
        style={{
          paddingTop: "56px",
          paddingBottom: inputHeight > 0 ? `${inputHeight + 20}px` : "200px",
          scrollPaddingBottom:
            inputHeight > 0 ? `${inputHeight + 20}px` : "200px",
        }}
      >
        <div className="min-h-full flex flex-col w-full max-w-3xl px-4 sm:px-6">
          <div
            className={`w-full pt-3 sm:pt-4 pb-3 sm:pb-4 flex-1 ${chatMessages.length === 0 && !isSwitchingThread && !isLoading
              ? "flex flex-col justify-center items-center min-h-full"
              : ""
              }`}
          >
            {/* Thread switching loading state */}
            {isSwitchingThread ? (
              <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full animate-pulse" />
                  <Loader2 className="relative h-10 w-10 text-primary animate-spin" />
                </div>
                <p className="text-muted-foreground text-sm">
                  جاري تحميل المحادثة...
                </p>
              </div>
            ) : chatMessages.length === 0 && !isLoading ? (
              <WelcomeScreen
                onSuggestionClick={handleSend}
                userName={user?.name || user?.phoneNumber || undefined}
              />
            ) : isLoading ? (
              <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <LoadingSpinner size="lg" />
                <p className="text-muted-foreground text-sm">
                  جاري تحميل الرسائل...
                </p>
              </div>
            ) : (
              <div className="space-y-2 w-full">
                {chatMessages.map((msg, index) => (
                  <ChatBubble key={msg.id ?? `msg-${index}`} message={msg} />
                ))}
                {isThinking && (
                  <div className="w-full">
                    <ThinkingIndicator />
                  </div>
                )}
                <div
                  ref={messagesEndRef}
                  className="h-px w-full"
                  style={{
                    marginBottom:
                      inputHeight > 0 ? `${inputHeight + 20}px` : "200px",
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {showScrollButton && chatMessages.length > 0 && (
        <div className="absolute bottom-20 left-0 right-0 flex justify-center z-30 pointer-events-none">
          <Button
            onClick={() => scrollToBottom("smooth")}
            size="icon"
            variant="secondary"
            className="rounded-full h-8 w-8 border border-border bg-background/90 hover:bg-muted/50 transition-colors pointer-events-auto"
            dir="ltr"
            aria-label="Scroll to bottom"
          >
            <ArrowDown className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {/* Writing effect above chat input */}
      {isStreaming && chatMessages.length > 0 && (
        <div
          className="absolute left-0 right-0 z-[25] pointer-events-none"
          style={{
            bottom: inputHeight > 0 ? `${inputHeight + 24}px` : "100px",
          }}
          role="status"
          aria-live="polite"
          aria-label="AI is writing"
        >
          <div className="flex justify-center">
            <div className="w-full max-w-3xl px-4 sm:px-6">
              {(() => {
                const lastMessage = chatMessages[chatMessages.length - 1];
                const contentLength = String(lastMessage?.content || "").length;
                return contentLength < 10 ? (
                  <InitialLoadingEffect />
                ) : (
                  <WritingEffect />
                );
              })()}
            </div>
          </div>
        </div>
      )}

      <div
        className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-background via-background to-transparent pt-2 pointer-events-none"
        style={{
          paddingBottom: `max(12px, env(safe-area-inset-bottom, 12px))`,
          paddingTop: "12px",
        }}
      >
        <div className="flex justify-center">
          <div className="w-full max-w-3xl px-4 pointer-events-auto space-y-2">
            {sendError && (
              <div
                className="flex items-center gap-2 px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm"
                role="alert"
              >
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{sendError}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="ms-auto h-8 px-2 text-destructive hover:bg-destructive/20"
                  onClick={() => setSendError(null)}
                >
                  إغلاق
                </Button>
              </div>
            )}
            <ChatInput
              onSend={handleSend}
              isLoading={isSending || isLoading || isThinking}
              onHeightChange={setInputHeight}
              disabled={!isAuthenticated && hasReachedLimit}
              placeholder={
                !isAuthenticated && hasReachedLimit
                  ? "سجل دخولك لمتابعة المحادثة..."
                  : "اسأل عنان أي سؤال…"
              }
            />

          </div>
        </div>
      </div>

      <AuthDialog
        open={showAuthDialog}
        onOpenChange={setShowAuthDialog}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}
