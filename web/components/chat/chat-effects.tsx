"use client";

import { ThinkingIndicator } from "./thinking-indicator";

export function InitialLoadingEffect() {
    return (
        <div
            dir="rtl"
            className="flex items-center gap-2 py-2"
            role="status"
            aria-live="polite"
            aria-label="جاري الكتابة"
        >
            <div className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
            <span className="text-sm text-muted-foreground">جاري الكتابة...</span>
        </div>
    );
}

export function WritingEffect() {
    return (
        <div
            dir="rtl"
            className="flex items-center gap-2 py-2"
            role="status"
            aria-live="polite"
            aria-label="يكتب"
        >
            <div className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
            <span className="text-sm text-muted-foreground">يكتب...</span>
        </div>
    );
}

export { ThinkingIndicator };

export function SearchingEffect() {
    return (
        <div
            dir="rtl"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/30 border border-border/40"
            role="status"
            aria-live="polite"
            aria-label="جاري البحث في المصادر"
        >
            <div className="h-3 w-3 rounded-full border-2 border-border border-t-muted-foreground animate-spin" />
            <span className="text-xs text-muted-foreground">
                جاري البحث في المصادر...
            </span>
        </div>
    );
}
