"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { MarkdownContent } from "./markdown-content";

interface StreamingTextProps {
    text: string;
    speed?: number;
    className?: string;
}

export function StreamingText({ text, speed = 30, className }: StreamingTextProps) {
    const [displayedText, setDisplayedText] = useState("");
    const [isComplete, setIsComplete] = useState(false);

    useEffect(() => {
        setDisplayedText("");
        setIsComplete(false);
        let currentIndex = 0;

        const interval = setInterval(() => {
            if (currentIndex < text.length) {
                setDisplayedText(text.slice(0, currentIndex + 1));
                currentIndex++;
            } else {
                setIsComplete(true);
                clearInterval(interval);
            }
        }, speed);

        return () => clearInterval(interval);
    }, [text, speed]);

    return (
        <div className={cn("relative w-full", className)}>
            <MarkdownContent content={displayedText} />
            {!isComplete && (
                <span className="inline-block w-0.5 h-4 bg-primary ml-1 animate-pulse mt-1" />
            )}
        </div>
    );
}

