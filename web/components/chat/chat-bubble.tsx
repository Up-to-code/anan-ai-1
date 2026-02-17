"use client";

import { memo, useCallback, useState } from "react";
import { Bot, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Message } from "./types";
import { CouponCard } from "./chat-data-views";
import { ComponentMapper } from "./component-mapper";
import { MarkdownContent } from "./markdown-content";

interface ChatBubbleProps {
  message: Message;
}

function MessageMeta({
  timestamp,
  canCopy,
  onCopy,
  align,
}: {
  timestamp: string;
  canCopy: boolean;
  onCopy: () => void;
  align: "start" | "end";
}) {
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(() => {
    onCopy();
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }, [onCopy]);

  return (
    <div
      className={`mt-1 flex items-center gap-2 px-1 text-[10px] text-muted-foreground/75 ${
        align === "end" ? "justify-end" : ""
      }`}
    >
      <span>{timestamp}</span>
      {canCopy ? (
        <Button
          variant="ghost"
          size="sm"
          className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground"
          onClick={handleCopy}
          aria-label={copied ? "تم النسخ" : "نسخ"}
        >
          <Copy className="h-3 w-3" />
        </Button>
      ) : null}
    </div>
  );
}

export const ChatBubble = memo(function ChatBubble({ message }: ChatBubbleProps) {
  const { content, isAi, timestamp, type, data } = message;
  const contentStr = typeof content === "string" ? content : String(content ?? "");
  const shouldRenderInlineText =
    Boolean(contentStr) && !(type && type !== "text" && type === "streaming");

  const handleCopy = useCallback(() => {
    if (!contentStr) return;
    void navigator.clipboard.writeText(contentStr);
  }, [contentStr]);

  if (!isAi) {
    return (
      <div className="py-2" dir="rtl">
        <div className="flex justify-end">
          <div className="max-w-[88%] sm:max-w-[74%]">
            <div className="rounded-2xl rounded-tr-sm bg-primary px-4 py-2.5 text-sm leading-relaxed text-primary-foreground sm:text-[15px]">
              <p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{contentStr}</p>
            </div>
            <MessageMeta
              timestamp={timestamp}
              canCopy={Boolean(contentStr)}
              onCopy={handleCopy}
              align="end"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <article className="py-2.5" dir="rtl" role="article">
      <div className="flex items-start gap-2">
        <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
          <Bot className="h-3.5 w-3.5" />
        </div>
        <div className="w-full min-w-0">
          <div className="rounded-2xl rounded-tl-sm border border-border/35 bg-background/85 px-4 py-3">
            {shouldRenderInlineText ? (
              <div className="prose prose-sm !max-w-none text-foreground dark:prose-invert prose-p:leading-relaxed prose-headings:font-bold">
                <MarkdownContent content={contentStr} />
              </div>
            ) : null}
            {type && type !== "text" && data != null ? (
              <div className="mt-3">
                {type === "coupon" ? (
                  <CouponCard
                    coupon={
                      data as { code: string; discount: string; expiry: string }
                    }
                  />
                ) : (
                  <ComponentMapper type={type} data={data} />
                )}
              </div>
            ) : null}
          </div>
          <MessageMeta
            timestamp={timestamp}
            canCopy={Boolean(contentStr)}
            onCopy={handleCopy}
            align="start"
          />
        </div>
      </div>
    </article>
  );
});
