"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowUpRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const QUICK_START = [
  "أبغى شقة 3 غرف بالرياض أقل من مليون",
  "عقار استثماري بعائد جيد في جدة",
  "قارن لي خيارات التمويل للبيت الأول",
];

export function HeroChat() {
  const router = useRouter();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % QUICK_START.length);
    }, 3200);
    return () => window.clearInterval(interval);
  }, []);

  const handleSend = () => {
    const message = input.trim();
    if (!message || isSending) return;
    setIsSending(true);
    router.push(`/chat/new?q=${encodeURIComponent(message)}`);
  };

  return (
    <div id="ask" className="w-full">
      <div className="rounded-2xl border border-border/40 bg-background/70 p-3">
        <label htmlFor="landing-prompt" className="mb-2 block px-1 text-sm font-semibold text-foreground">
          اكتب طلبك وابدأ المحادثة
        </label>

        <div className="rounded-xl border border-border/40 bg-card/60 p-2 focus-within:border-primary/40">
          <textarea
            id="landing-prompt"
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={QUICK_START[placeholderIndex]}
            name="landing_query"
            autoComplete="off"
            dir="rtl"
            rows={3}
            disabled={isSending}
            aria-label="اكتب طلبك لبدء المحادثة"
            className="max-h-40 min-h-[80px] w-full resize-none bg-transparent px-2 py-1 text-right text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/45 focus:outline-none sm:text-base"
          />

          <div className="mt-2 flex items-center justify-between border-t border-border/30 px-1 pt-2">
            <p className="text-xs text-muted-foreground">اضغط Enter أو زر البدء</p>
            <button
              onClick={handleSend}
              disabled={!input.trim() || isSending}
              aria-label={isSending ? "جاري بدء المحادثة" : "ابدأ الآن"}
              className={cn(
                "inline-flex h-9 items-center gap-1 rounded-lg px-3 text-xs font-semibold transition-colors sm:text-sm",
                input.trim() && !isSending
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "cursor-not-allowed bg-muted text-muted-foreground/40",
              )}
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  ابدأ الآن
                  <ArrowUpRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {QUICK_START.map((prompt, index) => (
          <motion.button
            key={prompt}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => {
              setInput(prompt);
              inputRef.current?.focus();
            }}
            className="rounded-full border border-border/40 bg-card/50 px-3 py-1.5 text-xs text-foreground/85 hover:border-primary/35 hover:text-foreground"
          >
            {prompt}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
