"use client";

import { useReducedMotion } from "framer-motion";

type ThinkingVariant = "agent" | "user";

interface ThinkingIndicatorProps {
    variant?: ThinkingVariant;
}

export function ThinkingIndicator({ variant = "agent" }: ThinkingIndicatorProps) {
    const shouldReduceMotion = useReducedMotion();
    const isAgent = variant === "agent";
    const label = isAgent ? "جاري التفكير..." : "جاري الإرسال...";
    const ariaLabel = isAgent ? "عنان يفكر" : "جاري إرسال الرسالة";

    return (
        <div
            dir="rtl"
            className="flex items-center gap-2 py-2"
            role="status"
            aria-live="polite"
            aria-label={ariaLabel}
        >
            {!shouldReduceMotion && (
                <div className="flex items-center gap-1">
                    <span
                        className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce"
                        style={{ animationDelay: "0ms", animationDuration: "1s" }}
                    />
                    <span
                        className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce"
                        style={{ animationDelay: "150ms", animationDuration: "1s" }}
                    />
                    <span
                        className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce"
                        style={{ animationDelay: "300ms", animationDuration: "1s" }}
                    />
                </div>
            )}
            <span className="text-sm text-muted-foreground">{label}</span>
        </div>
    );
}
