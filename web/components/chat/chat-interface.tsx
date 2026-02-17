"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatBubble } from "./chat-bubble";
import { ChatInput } from "./chat-input";
import { WelcomeScreen } from "./welcome-screen";
import { ThinkingIndicator } from "./thinking-indicator";
import { ToolActivityTimeline } from "./tool-activity-timeline";
import { AuthDialog } from "@/components/auth/auth-dialog";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { onEvent, EVENTS } from "@/lib/events";
import { useChatSession } from "@/hooks/use-chat-session";

interface ChatInterfaceProps {
  conversationId?: string | null;
  initialMessage?: string;
}

export function ChatInterface({
  conversationId = null,
  initialMessage,
}: ChatInterfaceProps) {
  const router = useRouter();
  const {
    user,
    isAuthenticated,
    messages,
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
  } = useChatSession({ threadId: conversationId });

  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [inputHeight, setInputHeight] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const initialSentRef = useRef(false);

  const hasMessages = messages.length > 0;
  const isBusy = isSending || isLoadingThread;
  const showWelcome = !isLoadingThread && !hasMessages;
  const thinkingVisible = isAwaitingAssistant && hasMessages;
  const footerPadding = useMemo(
    () => `${Math.max(148, inputHeight + 24)}px`,
    [inputHeight],
  );

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    bottomRef.current?.scrollIntoView({ behavior, block: "end" });
  }, []);

  useEffect(() => {
    if (!initialMessage || initialSentRef.current) return;
    initialSentRef.current = true;
    void send(initialMessage);
  }, [initialMessage, send]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const onScroll = () => {
      const gap =
        container.scrollHeight - container.scrollTop - container.clientHeight;
      setShowScrollButton(gap > 240);
    };
    container.addEventListener("scroll", onScroll, { passive: true });
    return () => container.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!hasMessages) return;
    scrollToBottom(isStreaming ? "auto" : "smooth");
  }, [hasMessages, isStreaming, messages.length, scrollToBottom]);

  useEffect(() => {
    const cleanup = onEvent(EVENTS.CONVERSATION_DELETED, (detail?: unknown) => {
      const deletedId = (detail as { id?: string } | undefined)?.id;
      if (deletedId && conversationId === deletedId) {
        router.push("/chat/new");
      }
    });
    return cleanup;
  }, [conversationId, router]);

  const handleSend = useCallback(
    async (text: string) => {
      if (!isAuthenticated && hasReachedLimit) {
        setShowAuthDialog(true);
        return;
      }
      await send(text);
    },
    [hasReachedLimit, isAuthenticated, send],
  );

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-background" dir="rtl">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 right-1/2 h-72 w-72 translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute left-[-120px] top-[35%] h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" />
      </div>

      <div
        ref={scrollContainerRef}
        className="relative z-10 flex-1 overflow-y-auto px-4 sm:px-6"
        style={{ paddingBottom: footerPadding }}
      >
        <div className="mx-auto min-h-full w-full max-w-4xl py-3">
          <section className="rounded-2xl border border-border/35 bg-card/45 p-2.5 backdrop-blur-sm sm:p-3">
            {isLoadingThread ? (
              <div className="flex min-h-[320px] flex-col items-center justify-center gap-3">
                <LoadingSpinner size="lg" />
                <p className="text-sm text-muted-foreground">جاري تحميل المحادثة...</p>
              </div>
            ) : showWelcome ? (
              <WelcomeScreen
                onSuggestionClick={(suggestion) => void handleSend(suggestion)}
                userName={user?.name || user?.phoneNumber || undefined}
              />
            ) : (
              <>
                <AnimatePresence initial={false}>
                  {messages.map((message, index) => (
                    <motion.div
                      key={message.id ?? `m-${index}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                    >
                      <ChatBubble message={message} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </>
            )}
            <div ref={bottomRef} />
          </section>
        </div>
      </div>

      {showScrollButton ? (
        <div className="pointer-events-none absolute bottom-24 left-0 right-0 z-20 flex justify-center">
          <Button
            size="icon"
            variant="secondary"
            className="pointer-events-auto h-9 w-9 rounded-full border border-border"
            onClick={() => scrollToBottom("smooth")}
            aria-label="الانتقال إلى آخر الرسائل"
          >
            <ArrowDown className="h-4 w-4" />
          </Button>
        </div>
      ) : null}

      <AnimatePresence>
        {thinkingVisible ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="pointer-events-none absolute bottom-[90px] left-0 right-0 z-20 flex justify-center px-4"
          >
            <div className="pointer-events-auto">
              <ThinkingIndicator
                label={
                  chatPhase === "sending"
                    ? "جاري إرسال الرسالة..."
                    : toolActivityLabel ?? undefined
                }
              />
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div
        className="absolute bottom-0 left-0 right-0 z-30 bg-gradient-to-t from-background via-background/95 to-transparent px-4 pt-2 sm:px-6"
        style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom, 12px))" }}
      >
        <div className="mx-auto w-full max-w-6xl space-y-2">
          <AnimatePresence>
            {thinkingVisible && toolActivities.length > 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
              >
                <ToolActivityTimeline activities={toolActivities} />
              </motion.div>
            ) : null}
          </AnimatePresence>

          {sendError ? (
            <div
              className="flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              role="alert"
            >
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span className="flex-1">{sendError}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-destructive hover:bg-destructive/20"
                onClick={() => setSendError(null)}
              >
                إغلاق
              </Button>
            </div>
          ) : null}

          <ChatInput
            onSend={(text) => void handleSend(text)}
            isLoading={isBusy}
            onHeightChange={setInputHeight}
            disabled={!isAuthenticated && hasReachedLimit}
            placeholder={
              !isAuthenticated && hasReachedLimit
                ? "سجل دخولك لمتابعة المحادثة..."
                : "اكتب سؤالك أو طلبك العقاري..."
            }
          />
        </div>
      </div>

      <AuthDialog
        open={showAuthDialog}
        onOpenChange={setShowAuthDialog}
        onSuccess={() => setShowAuthDialog(false)}
      />
    </div>
  );
}
