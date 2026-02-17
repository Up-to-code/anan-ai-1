"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

type ThinkingVariant = "agent" | "user";

interface ThinkingIndicatorProps {
  variant?: ThinkingVariant;
  label?: string;
}

export function ThinkingIndicator({
  variant = "agent",
  label,
}: ThinkingIndicatorProps) {
  const reduceMotion = useReducedMotion();
  const stages = useMemo(
    () =>
      variant === "agent"
        ? ["يفهم الطلب", "يجمع المعطيات", "يبني الرد"]
        : ["جاري الإرسال"],
    [variant],
  );
  const [stageIndex, setStageIndex] = useState(0);

  useEffect(() => {
    if (reduceMotion || label || stages.length < 2) return;
    const id = window.setInterval(() => {
      setStageIndex((prev) => (prev + 1) % stages.length);
    }, 1400);
    return () => window.clearInterval(id);
  }, [label, reduceMotion, stages.length]);

  const text = label ?? stages[stageIndex] ?? "جاري المعالجة";

  return (
    <div
      dir="rtl"
      className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-card/80 px-3 py-1.5 text-xs text-foreground/90"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-1">
        {[0, 1, 2].map((dot) => (
          <motion.span
            key={dot}
            className="h-1.5 w-1.5 rounded-full bg-primary/70"
            animate={reduceMotion ? {} : { opacity: [0.35, 1, 0.35] }}
            transition={{
              duration: 1,
              repeat: Number.POSITIVE_INFINITY,
              delay: dot * 0.18,
            }}
          />
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.span
          key={text}
          initial={reduceMotion ? undefined : { opacity: 0, y: 4 }}
          animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}
          transition={{ duration: 0.18 }}
        >
          {text}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}
