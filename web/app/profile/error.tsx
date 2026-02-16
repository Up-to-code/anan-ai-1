"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function ProfileError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Profile error:", error);
  }, [error]);

  return (
    <div className="flex min-h-dvh bg-[#0a0a0a] items-center justify-center" dir="rtl">
      <div className="text-center space-y-4 p-8">
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-red-500/20 rounded-full blur-2xl" />
            <div className="relative h-16 w-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center shadow-2xl">
              <AlertTriangle className="h-8 w-8 text-red-400" />
            </div>
          </div>
        </div>
        <h2 className="text-2xl font-bold text-white">حدث خطأ</h2>
        <p className="text-zinc-400 max-w-md">
          {error.message || "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى."}
        </p>
        <div className="flex gap-3 justify-center">
          <Button 
            onClick={reset} 
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20"
          >
            إعادة المحاولة
          </Button>
          <Button 
            onClick={() => window.location.href = "/chat/new"} 
            variant="outline"
            className="border-white/10 bg-white/5 hover:bg-white/10 text-white hover:text-white"
          >
            العودة للرئيسية
          </Button>
        </div>
      </div>
    </div>
  );
}


