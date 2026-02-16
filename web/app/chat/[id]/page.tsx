"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { ChatInterface } from "@/components/chat/chat-interface";

/** Reserved route segments that are NOT valid Convex thread IDs. */
const RESERVED_ROUTES = ["new", "settings", "profile"] as const;

/** Convex IDs are 32 alphanumeric chars. Other strings (e.g. "settings") must not be passed to getThreadMessages. */
function isValidThreadId(id: string | null | undefined): id is string {
  if (!id || typeof id !== "string") return false;
  if (RESERVED_ROUTES.includes(id as (typeof RESERVED_ROUTES)[number])) return false;
  return /^[a-z0-9]{31,37}$/i.test(id);
}

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawId = params.id as string;

  const conversationId = isValidThreadId(rawId) ? rawId : null;
  const initialMessage = rawId === "new" ? searchParams.get("q") : null;

  useEffect(() => {
    if (rawId === "settings") {
      router.replace("/settings");
    } else if (rawId === "profile") {
      router.replace("/profile");
    }
  }, [rawId, router]);

  return (
    <ChatInterface
      key={conversationId ?? "new"}
      conversationId={conversationId}
      initialMessage={initialMessage ?? undefined}
    />
  );
}
