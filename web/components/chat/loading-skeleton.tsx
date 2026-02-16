"use client";

import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bot, User } from "lucide-react";

export function MessageSkeleton({ isAi = true }: { isAi?: boolean }) {
    return (
        <div className={cn(
            "flex w-full gap-3 mb-6 group",
            isAi ? "flex-row" : "flex-row-reverse"
        )} dir="rtl">
            {/* Avatar */}
            <Avatar className={cn(
                "h-9 w-9 mt-1 shrink-0 border transition-all duration-300",
                isAi
                    ? "bg-primary/20 border-primary/30"
                    : "bg-secondary/50 border-transparent"
            )}>
                <AvatarFallback className="text-xs bg-transparent">
                    {isAi ? <Bot className="h-5 w-5 text-primary/30" /> : <User className="h-4 w-4 text-muted-foreground/30" />}
                </AvatarFallback>
            </Avatar>

            {/* Content Wrapper */}
            <div className={cn(
                "flex flex-col",
                isAi ? "items-start w-full max-w-full" : "items-end max-w-[85%] sm:max-w-[75%]"
            )}>
                {/* Name & Time Row */}
                <div className={cn(
                    "flex items-center gap-2 mb-1 px-1 w-full",
                    isAi ? "justify-start" : "justify-end"
                )}>
                    <div className="h-3 w-16 bg-muted animate-pulse rounded" />
                </div>

                {/* Message Content */}
                {isAi ? (
                    // AI Message - Full width, no bubble
                    <div className="w-full space-y-2">
                        <div className="h-4 w-full bg-muted/50 animate-pulse rounded" />
                        <div className="h-4 w-5/6 bg-muted/50 animate-pulse rounded" />
                        <div className="h-4 w-4/6 bg-muted/50 animate-pulse rounded" />
                    </div>
                ) : (
                    // User Message - Bubble style
                    <div className="px-4 py-2.5 bg-primary/20 rounded-2xl rounded-tl-sm space-y-2">
                        <div className="h-4 w-32 bg-primary/30 animate-pulse rounded" />
                        <div className="h-4 w-24 bg-primary/30 animate-pulse rounded" />
                    </div>
                )}
            </div>
        </div>
    );
}

export function ChatLoadingSkeleton() {
    return (
        <div className="space-y-4 sm:space-y-6 w-full">
            {/* User message skeleton */}
            <MessageSkeleton isAi={false} />
            {/* AI message skeleton */}
            <MessageSkeleton isAi={true} />
            {/* User message skeleton */}
            <MessageSkeleton isAi={false} />
            {/* AI message skeleton */}
            <MessageSkeleton isAi={true} />
        </div>
    );
}

export function ConversationSkeleton() {
    return (
        <div className="space-y-1">
            <div className="h-4 w-16 bg-muted animate-pulse rounded mx-2 mb-2" />
            {[1, 2].map((i) => (
                <div key={i} className="h-12 w-full bg-muted/50 animate-pulse rounded-lg mx-2" />
            ))}
        </div>
    );
}


