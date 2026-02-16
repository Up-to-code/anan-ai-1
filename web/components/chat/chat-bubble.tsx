"use client";

import { memo, useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { Message } from "./types";
import { CouponCard } from "./chat-data-views";
import { ComponentMapper } from "./component-mapper";
import { MarkdownContent } from "./markdown-content";

interface ChatBubbleProps {
  message: Message;
  index?: number;
}

function DetailsRow({
  timestamp,
  onCopy,
  canCopy,
  alignEnd,
  showCopyOnHover,
}: {
  timestamp: string;
  onCopy: () => void;
  canCopy: boolean;
  alignEnd?: boolean;
  showCopyOnHover?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(() => {
    onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [onCopy]);

  return (
    <div
      className={cn(
        "flex items-center gap-2 mt-1.5 px-1 text-[10px] text-muted-foreground/80",
        alignEnd && "justify-end",
        showCopyOnHover &&
        "opacity-0 group-hover:opacity-100 transition-opacity",
      )}
    >
      <span>{timestamp}</span>
      {canCopy && (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
          onClick={handleCopy}
          aria-label={copied ? "تم النسخ" : "نسخ"}
        >
          <Copy className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}

export const ChatBubble = memo(
  function ChatBubble({ message }: ChatBubbleProps) {
    const { content, isAi, timestamp, type, data } = message;
    const contentStr =
      typeof content === "string" ? content : String(content ?? "");

    const handleCopy = useCallback(() => {
      if (contentStr) {
        void navigator.clipboard.writeText(contentStr);
      }
    }, [contentStr]);

    if (isAi) {
      return (
        <article
          dir="rtl"
          className="w-full group py-3"
          style={{ scrollMarginBottom: "16px" }}
          role="article"
        >
          <div className="w-full flex flex-col gap-3">
            {contentStr ? (
              <div className="w-full max-w-prose prose prose-sm sm:prose-base !max-w-none dark:prose-invert prose-p:leading-relaxed prose-headings:font-bold text-foreground/90">
                <MarkdownContent content={contentStr} />
              </div>
            ) : null}

            {type && type !== "text" && data != null ? (
              <div className="w-full mt-2">
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

          <DetailsRow
            timestamp={timestamp}
            onCopy={handleCopy}
            canCopy={!!contentStr}
            showCopyOnHover
          />
        </article>
      );
    }

    return (
      <div
        dir="rtl"
        className="w-full group py-2 flex justify-end"
        style={{ scrollMarginBottom: "16px" }}
        role="group"
      >
        <div className="flex flex-col items-end min-w-0 max-w-[85%] sm:max-w-[75%]">
          <div className="px-4 py-2.5 text-[15px] sm:text-[16px] bg-primary/95 text-primary-foreground rounded-[1.25rem] rounded-tr-none leading-relaxed break-words shadow-sm">
            {contentStr ? (
              <p className="whitespace-pre-wrap text-right leading-relaxed break-words overflow-wrap-anywhere">
                {contentStr}
              </p>
            ) : null}
          </div>

          <DetailsRow
            timestamp={timestamp}
            onCopy={handleCopy}
            canCopy={!!contentStr}
            alignEnd
          />
        </div>
      </div>
    );
  },
  (prevProps: ChatBubbleProps, nextProps: ChatBubbleProps) => {
    return (
      prevProps.message.id === nextProps.message.id &&
      prevProps.message.content === nextProps.message.content
    );
  },
);
