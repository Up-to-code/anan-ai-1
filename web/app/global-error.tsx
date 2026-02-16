"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertOctagon, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global Error:", error);
  }, [error]);

  return (
    <html lang="ar" dir="rtl">
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0a] text-white p-4 text-center">
          <div className="flex flex-col items-center gap-6 max-w-md">
            <div className="h-24 w-24 rounded-full bg-destructive/10 flex items-center justify-center mb-2">
              <AlertOctagon className="h-10 w-10 text-destructive" />
            </div>
            
            <h1 className="text-3xl font-bold">خطأ غير متوقع</h1>
            <p className="text-zinc-400">
              حدث خطأ جسيم في التطبيق. يرجى تحديث الصفحة.
            </p>

            <Button 
              onClick={() => reset()} 
              variant="default"
              size="lg"
              className="mt-4 gap-2 rounded-xl"
            >
              <RefreshCw className="h-4 w-4" />
              تحديث الصفحة
            </Button>
          </div>
        </div>
      </body>
    </html>
  );
}

