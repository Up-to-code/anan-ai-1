"use client";

import { memo, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Lock, LockOpen, MessageSquare, Plus, Search, Settings, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useConversations } from "@/hooks/use-conversations";
import { useAuth } from "@/hooks/use-auth";
import { useAnonymousUserId } from "@/contexts/anonymous-user-id";
import { emitEvent, EVENTS } from "@/lib/events";
import type { Conversation } from "@/lib/convex-chat";
import { SidebarSkeleton } from "./sidebar-skeleton";

export interface SidebarProps {
  className?: string;
  onNavigate?: () => void;
}

interface RowItemProps {
  conv: Conversation;
  isActive: boolean;
  onClick: () => void;
  onDelete: (e: React.MouseEvent) => void;
}

const MAX_TITLE_LENGTH = 56;

function truncateTitle(title: string): string {
  if (title.length <= MAX_TITLE_LENGTH) return title;
  return `${title.slice(0, MAX_TITLE_LENGTH)}...`;
}

const RowItem = memo(function RowItem({
  conv,
  isActive,
  onClick,
  onDelete,
}: RowItemProps) {
  return (
    <div
      role="group"
      className={cn(
        "relative w-full cursor-pointer rounded-lg px-3 py-2.5 text-right text-sm transition-colors",
        "hover:bg-muted/45",
        isActive && "bg-primary/10 text-foreground",
      )}
      onClick={onClick}
    >
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onDelete(e);
        }}
        className="absolute left-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
        aria-label="حذف المحادثة"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
      <span className="block truncate pl-6" dir="rtl">
        {truncateTitle(conv.title)}
      </span>
    </div>
  );
});

export function Sidebar({ className, onNavigate }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("sidebar_locked") === "1";
  });

  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const anonymousUserId = useAnonymousUserId();
  const userId = isAuthenticated && user?.id ? user.id : anonymousUserId;

  const {
    groupedConversations,
    isLoading: conversationsLoading,
    error,
    remove,
  } = useConversations({
    userId,
    autoFetch: !authLoading,
    searchQuery: debouncedSearchQuery.trim() || undefined,
  });

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearchQuery(searchQuery), 250);
    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  const navigateIfNeeded = useCallback(() => {
    if (!isLocked) onNavigate?.();
  }, [isLocked, onNavigate]);

  const currentConversationId = useMemo(() => {
    if (!pathname?.startsWith("/chat/")) return null;
    const segment = pathname.split("/chat/")[1];
    return segment === "new" ? null : segment;
  }, [pathname]);

  const timeGroups: { title: string; conversations: Conversation[] }[] = useMemo(
    () => [
      { title: "اليوم", conversations: groupedConversations.today },
      { title: "أمس", conversations: groupedConversations.yesterday },
      { title: "هذا الأسبوع", conversations: groupedConversations.lastWeek },
      { title: "أقدم", conversations: groupedConversations.older },
    ],
    [groupedConversations],
  );

  const hasAnyConversations = useMemo(
    () =>
      groupedConversations.today.length > 0 ||
      groupedConversations.yesterday.length > 0 ||
      groupedConversations.lastWeek.length > 0 ||
      groupedConversations.older.length > 0,
    [groupedConversations],
  );

  const isLoading = authLoading || conversationsLoading;

  const handleToggleLock = useCallback(() => {
    setIsLocked((prev) => {
      const next = !prev;
      window.localStorage.setItem("sidebar_locked", next ? "1" : "0");
      return next;
    });
  }, []);

  const handleNewChat = useCallback(() => {
    router.push("/chat/new");
    navigateIfNeeded();
  }, [navigateIfNeeded, router]);

  const handleConversationClick = useCallback(
    (id: string) => {
      router.push(`/chat/${id}`);
      navigateIfNeeded();
    },
    [navigateIfNeeded, router],
  );

  const confirmDelete = useCallback(async () => {
    if (!conversationToDelete) return;
    const success = await remove(conversationToDelete);
    if (success) {
      emitEvent(EVENTS.CONVERSATION_DELETED, { id: conversationToDelete });
      router.push("/chat/new");
    }
    setDeleteDialogOpen(false);
    setConversationToDelete(null);
  }, [conversationToDelete, remove, router]);

  return (
    <aside
      className={cn(
        "hidden h-full w-[290px] flex-col border-l border-border/40 bg-background lg:flex",
        className,
      )}
      lang="ar"
      dir="rtl"
    >
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border/40 px-4">
        <Link href="/chat/new" className="text-sm font-black text-foreground">
          عنان
        </Link>
        <button
          onClick={handleToggleLock}
          className="inline-flex h-8 items-center gap-1 rounded-lg border border-border/50 px-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
          aria-label={isLocked ? "فتح القفل" : "قفل الشريط"}
          type="button"
        >
          {isLocked ? <Lock className="h-3.5 w-3.5" /> : <LockOpen className="h-3.5 w-3.5" />}
          {isLocked ? "مقفول" : "مفتوح"}
        </button>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-3 p-3">
        <Button
          onClick={handleNewChat}
          className="h-10 w-full justify-center gap-2 rounded-lg"
          aria-label="محادثة جديدة"
        >
          <Plus className="h-4 w-4" />
          <span>محادثة جديدة</span>
        </Button>

        <div className="relative">
          <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث في المحادثات"
            aria-label="بحث في المحادثات"
            dir="rtl"
            className="h-10 rounded-lg border-border/40 bg-background pr-10 text-right text-sm placeholder:text-muted-foreground/55"
          />
        </div>

        <ScrollArea className="-mx-1 flex-1 px-1">
          {isLoading ? (
            <SidebarSkeleton />
          ) : error ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              حدث خطأ في تحميل المحادثات
            </p>
          ) : !hasAnyConversations ? (
            <div className="py-8 text-center">
              <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-muted/35">
                <MessageSquare className="h-4.5 w-4.5 text-muted-foreground/60" />
              </div>
              <p className="text-sm text-muted-foreground">
                {debouncedSearchQuery.trim() ? "لا توجد نتائج" : "لا توجد محادثات"}
              </p>
            </div>
          ) : (
            <div className="space-y-4 pb-2">
              {timeGroups.map((group) =>
                group.conversations.length > 0 ? (
                  <section key={group.title} className="space-y-1">
                    <p className="px-2 text-xs font-semibold text-muted-foreground/75">
                      {group.title}
                    </p>
                    {group.conversations.map((conv) => (
                      <RowItem
                        key={conv.id}
                        conv={conv}
                        isActive={currentConversationId === conv.id}
                        onClick={() => handleConversationClick(conv.id)}
                        onDelete={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setConversationToDelete(conv.id);
                          setDeleteDialogOpen(true);
                        }}
                      />
                    ))}
                  </section>
                ) : null,
              )}
            </div>
          )}
        </ScrollArea>

        <div className="border-t border-border/40 pt-3">
          {isAuthenticated && user ? (
            <Link href="/settings" className="block rounded-lg p-2 transition-colors hover:bg-muted/45">
              <div className="flex items-center gap-2.5">
                <Avatar className="h-8 w-8 border border-border/50">
                  <AvatarImage src={user.image || undefined} />
                  <AvatarFallback className="text-xs">
                    {(user.name || user.phoneNumber || "U").slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1 text-right">
                  <p className="truncate text-sm font-medium text-foreground">
                    {user.name || user.phoneNumber}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {user.email?.includes("@whatsapp.local")
                      ? user.phoneNumber
                      : user.email}
                  </p>
                </div>
                <Settings className="h-4 w-4 text-muted-foreground" />
              </div>
            </Link>
          ) : (
            <Button
              variant="outline"
              className="h-10 w-full rounded-lg border-border/40"
              onClick={() => router.push("/auth/login")}
            >
              تسجيل الدخول
            </Button>
          )}
        </div>
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[380px]" dir="rtl">
          <DialogHeader>
            <DialogTitle>حذف المحادثة</DialogTitle>
            <DialogDescription>
              هذا الإجراء لا يمكن التراجع عنه.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setConversationToDelete(null);
              }}
              className="flex-1"
            >
              إلغاء
            </Button>
            <Button variant="destructive" onClick={confirmDelete} className="flex-1">
              حذف
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </aside>
  );
}
