"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ChatPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/chat/new");
  }, [router]);

  return (
    <div className="flex flex-col h-full items-center justify-center">
      <span className="text-muted-foreground">جاري التوجيه...</span>
    </div>
  );
}
