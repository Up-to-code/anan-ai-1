/**
 * Convex chat helpers for mapping threads to UI format.
 * Conversation titles are the first user message (or "محادثة جديدة" fallback).
 */

export interface Conversation {
  id: string;
  title: string;
  lastMessage?: string;
  updatedAt: string;
  createdAt: string;
}

/** Group conversations by date (today, yesterday, last week, older). */
export function groupConversationsByDate(conversations: Conversation[]) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

  const groups = {
    today: [] as Conversation[],
    yesterday: [] as Conversation[],
    lastWeek: [] as Conversation[],
    older: [] as Conversation[],
  };

  conversations.forEach((conv) => {
    const convDate = new Date(conv.updatedAt);
    if (convDate >= today) groups.today.push(conv);
    else if (convDate >= yesterday) groups.yesterday.push(conv);
    else if (convDate >= lastWeek) groups.lastWeek.push(conv);
    else groups.older.push(conv);
  });

  return groups;
}

/** Format a date string as relative time in Arabic (e.g. "منذ 5 دقيقة"). */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) return "الآن";
  if (minutes < 60) return `منذ ${minutes} دقيقة`;
  if (hours < 24) return `منذ ${hours} ساعة`;
  if (days < 7) return `منذ ${days} يوم`;
  return date.toLocaleDateString("ar-SA");
}
