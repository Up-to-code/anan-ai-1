"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp, Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function HeroChat() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const placeholders = [
    "ابحث عن شقة في الرياض...",
    "احسب قرضك العقاري...",
    "عقارات للإيجار بجدة...",
    "أبغى فيلا بميزانية مليون...",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [placeholders.length]);

  const handleSubmit = async () => {
    const trimmed = input.trim();
    if (!trimmed || isSending) return;

    setIsSending(true);
    // Navigate to chat with the initial message
    router.push(`/chat/new?q=${encodeURIComponent(trimmed)}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 0.7, ease: "easeOut" }}
      className="w-full max-w-2xl mx-auto"
    >
      <div className="relative group">
        {/* Glow effect behind input */}
        <div className="absolute -inset-1 bg-gradient-to-l from-primary/30 via-primary/10 to-primary/30 rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />

        <div className="relative flex flex-col rounded-2xl bg-card/60 backdrop-blur-xl border border-border/30 shadow-2xl shadow-primary/5 overflow-hidden transition-all duration-300 group-focus-within:border-primary/30 group-focus-within:shadow-primary/10">
          {/* Agent badge */}
          <div className="flex items-center gap-2 px-4 pt-3 pb-1">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20">
              <Sparkles className="h-3 w-3 text-primary" />
              <span className="text-[11px] font-medium text-primary">عنان AI</span>
            </div>
            <div className="flex items-center gap-1 mr-auto">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] text-muted-foreground">متصل الآن</span>
            </div>
          </div>

          {/* Input area */}
          <div className="px-4 pt-2 pb-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder={placeholders[placeholderIndex]}
              disabled={isSending}
              className="w-full min-h-[52px] max-h-[120px] resize-none bg-transparent text-right text-base placeholder:text-muted-foreground/40 focus:outline-none leading-relaxed"
              dir="rtl"
              rows={1}
            />
          </div>

          {/* Bottom bar */}
          <div className="flex items-center justify-between px-4 py-2.5 border-t border-border/20">
            <span className="text-[11px] text-muted-foreground/50">
              اضغط Enter للإرسال
            </span>

            <button
              onClick={handleSubmit}
              disabled={!input.trim() || isSending}
              className={cn(
                "rounded-xl h-9 w-9 flex items-center justify-center transition-all duration-200",
                input.trim() && !isSending
                  ? "bg-gradient-to-l from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/25 text-primary-foreground scale-100 hover:scale-105"
                  : "bg-muted/50 text-muted-foreground/30 cursor-not-allowed"
              )}
            >
              <AnimatePresence mode="wait">
                {isSending ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0, rotate: -90 }}
                    animate={{ opacity: 1, rotate: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="arrow"
                    initial={{ opacity: 0, y: 3 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -3 }}
                    transition={{ duration: 0.15 }}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>
      </div>

      {/* Quick suggestions below chat */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.5 }}
        className="flex flex-wrap justify-center gap-2 mt-4"
      >
        {["شقق في الرياض", "فلل بجدة", "أراضي للبيع", "حاسبة التمويل"].map(
          (tag) => (
            <button
              key={tag}
              onClick={() => {
                setInput(tag);
                inputRef.current?.focus();
              }}
              className="px-3 py-1.5 rounded-full text-xs font-medium bg-card/40 backdrop-blur-sm border border-border/30 text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-card/60 transition-all duration-200"
            >
              {tag}
            </button>
          )
        )}
      </motion.div>
    </motion.div>
  );
}
