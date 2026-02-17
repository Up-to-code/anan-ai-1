"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading?: boolean;
  onHeightChange?: (height: number) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSend,
  isLoading,
  onHeightChange,
  disabled,
  placeholder,
}: ChatInputProps) {
  const [input, setInput] = useState("");
  const [focused, setFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !onHeightChange) return;
    const observer = new ResizeObserver(() => onHeightChange(el.clientHeight));
    observer.observe(el);
    onHeightChange(el.clientHeight);
    return () => observer.disconnect();
  }, [onHeightChange]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 170)}px`;
  }, [input]);

  const handleSubmit = () => {
    const text = input.trim();
    if (!text || isLoading || disabled) return;
    onSend(text);
    setInput("");
  };

  return (
    <div className="w-full">
      <div
        ref={containerRef}
        className={cn(
          "rounded-2xl border bg-card/65 p-2.5 backdrop-blur-sm transition-colors",
          focused ? "border-primary/35" : "border-border/40",
        )}
      >
        <Textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          name="message"
          autoComplete="off"
          disabled={disabled}
          dir="rtl"
          rows={1}
          placeholder={placeholder || "اكتب سؤالك..."}
          aria-label="رسالتك"
          className="min-h-[46px] max-h-[170px] resize-none border-0 bg-transparent px-2 py-1 text-right text-[15px] leading-relaxed shadow-none focus-visible:ring-0 placeholder:text-muted-foreground/45"
        />

        <div className="mt-2 flex items-center justify-between border-t border-border/30 px-1 pt-2">
          <p className="text-[11px] text-muted-foreground">Enter للإرسال | Shift+Enter لسطر جديد</p>
          <button
            onClick={handleSubmit}
            disabled={!input.trim() || isLoading || disabled}
            aria-label={isLoading ? "جاري الإرسال" : "إرسال"}
            className={cn(
              "inline-flex h-9 items-center gap-1 rounded-lg px-3 text-xs font-semibold transition-colors sm:text-sm",
              input.trim() && !isLoading && !disabled
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "cursor-not-allowed bg-muted text-muted-foreground/45",
            )}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                إرسال
                <ArrowUpRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
