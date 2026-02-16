"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  text?: string;
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
};

export function LoadingSpinner({
  size = "md",
  className,
  text,
}: LoadingSpinnerProps) {
  return (
    <div className={cn("flex items-center justify-center gap-2", className)}>
      <Loader2 className={cn("animate-spin text-primary", sizeClasses[size])} />
      {text && <span className="text-muted-foreground text-sm">{text}</span>}
    </div>
  );
}

interface LoadingPageProps {
  text?: string;
}

export function LoadingPage({ text = "جاري التحميل..." }: LoadingPageProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <LoadingSpinner size="lg" />
      <p className="text-muted-foreground">{text}</p>
    </div>
  );
}

interface LoadingOverlayProps {
  visible: boolean;
  text?: string;
}

export function LoadingOverlay({
  visible,
  text = "جاري التحميل...",
}: LoadingOverlayProps) {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-card p-6 rounded-lg shadow-lg flex flex-col items-center gap-3">
        <LoadingSpinner size="lg" />
        <p className="text-muted-foreground">{text}</p>
      </div>
    </div>
  );
}
