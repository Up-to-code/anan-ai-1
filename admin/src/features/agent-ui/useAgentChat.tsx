"use client";

import { useRef } from "react";
import type { AgentThread, AgentMessage, PendingAction, AdminTaskRequest } from "./types";
import type { Id } from "convex/_generated/dataModel";

export function useAgentChat() {
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  return {
    threads: [] as AgentThread[],
    threadId: null as string | null,
    chatMessages: [] as AgentMessage[],
    pendingActions: [] as PendingAction[],
    isThreadsLoading: false,
    isSending: false,
    isThinking: false,
    deletingThreadId: null as string | null,
    messagesEndRef,
    handleSend: (_value: string) => {},
    handleSendTask: (_task: AdminTaskRequest) => {},
    handleNewChat: async () => {},
    handleSelectThread: (_threadId: string) => {},
    handleDeleteThread: async (_threadId: string) => {},
    handleRenameThread: async (_threadId: string, _title: string) => {},
    handleSlashCommand: async (_command: "rewrite" | "formal" | "summarize", _text: string) => "",
    updatePendingPayload: async (_args: { actionId: Id<"adminPendingActions">; payload: unknown }) => {},
    confirmPendingAction: async (_args: { actionId: Id<"adminPendingActions">; editedPayload?: unknown }) => {},
    cancelPendingAction: async (_args: { actionId: Id<"adminPendingActions"> }) => {},
    generateUploadUrl: async (_args: { actionId: Id<"adminPendingActions"> }) => "",
    attachPendingMedia: async (_args: { actionId: Id<"adminPendingActions">; storageId: Id<"_storage">; kind: "image" | "logo" }) => {},
    removePendingMedia: async (_args: { mediaId: Id<"entityMedia"> }) => {},
    reorderPendingMedia: async (_args: { actionId: Id<"adminPendingActions">; mediaIds: Id<"entityMedia">[] }) => {},
  };
}
