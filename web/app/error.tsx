"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Application Error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground p-4 text-center" dir="rtl">
      <div className="flex flex-col items-center gap-6 max-w-md animate-in fade-in zoom-in-95 duration-500">
        <div className="relative">
          <div className="absolute inset-0 bg-destructive/20 rounded-full blur-2xl" />
          <div className="relative h-24 w-24 rounded-full bg-card border border-border flex items-center justify-center shadow-2xl">
            <AlertTriangle className="h-10 w-10 text-destructive" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">حدث خطأ ما</h1>
          <p className="text-muted-foreground leading-relaxed">
            نعتذر، واجهنا مشكلة غير متوقعة أثناء معالجة طلبك.
            حاول تحديث الصفحة أو العودة لاحقاً.
          </p>
          {process.env.NODE_ENV === "development" && (
            <div className="mt-4 p-4 bg-muted/50 rounded-lg text-xs text-left text-muted-foreground font-mono overflow-auto max-w-full max-h-32 border border-border" dir="ltr">
              {error.message}
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto mt-2">
          <Button 
            onClick={reset} 
            size="lg" 
            className="gap-2 rounded-xl shadow-lg shadow-primary/20"
          >
            <RefreshCw className="h-4 w-4" />
            إعادة المحاولة
          </Button>
          <Button asChild variant="outline" size="lg" className="gap-2 rounded-xl">
            <Link href="/">
              <Home className="h-4 w-4" />
              الرئيسية
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

