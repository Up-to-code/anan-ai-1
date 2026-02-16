"use client";

import { useState, useMemo, useEffect, memo, useCallback } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Plus,
  Search,
  Settings,
  MessageSquare,
  Trash2,
  Sparkles,
  Zap,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useConversations } from "@/hooks/use-conversations";
import { emitEvent, EVENTS } from "@/lib/events";
import { useAuth } from "@/hooks/use-auth";
import { useAnonymousUserId } from "@/contexts/anonymous-user-id";
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

const MAX_TITLE_LENGTH = 60;

function truncateTitle(title: string): string {
  if (title.length <= MAX_TITLE_LENGTH) return title;
  return title.slice(0, MAX_TITLE_LENGTH) + "...";
}

const RowItem = memo(function RowItem({
  conv,
  isActive,
  onClick,
  onDelete,
}: RowItemProps) {
  const displayTitle = truncateTitle(conv.title);

  const onDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete(e);
  };

  return (
    <div
      role="group"
      className={cn(
        "group relative w-full rounded-lg py-2.5 px-3 text-right text-sm transition-all duration-200 cursor-pointer",
        "hover:bg-gradient-to-l hover:from-primary/5 hover:to-transparent",
        isActive &&
          "bg-gradient-to-l from-primary/10 to-transparent border-r-2 border-primary",
      )}
      onClick={onClick}
    >
      <button
        type="button"
        onClick={onDeleteClick}
        className="absolute left-2 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity z-10"
        aria-label="حذف المحادثة"
      >
        <Trash2 className="h-3 w-3" />
      </button>
      <span className="block truncate pr-2" dir="rtl">
        {displayTitle}
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
  const [conversationToDelete, setConversationToDelete] = useState<
    string | null
  >(null);
  const [selectedModel, setSelectedModel] = useState<"standard" | "pro">(
    "standard",
  );

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

  const isLoading = authLoading || conversationsLoading;

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const timeGroups: { title: string; conversations: Conversation[] }[] =
    useMemo(
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

  const handleNewChat = useCallback(() => {
    router.push("/chat/new");
    onNavigate?.();
  }, [router, onNavigate]);

  const handleConversationClick = useCallback(
    (id: string) => {
      router.push(`/chat/${id}`);
      onNavigate?.();
    },
    [router, onNavigate],
  );

  const handleDeleteClick = useCallback((e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setConversationToDelete(id);
    setDeleteDialogOpen(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (conversationToDelete) {
      const success = await remove(conversationToDelete);
      if (success) {
        emitEvent(EVENTS.CONVERSATION_DELETED, { id: conversationToDelete });
        router.push("/chat/new");
      }
    }
    setDeleteDialogOpen(false);
    setConversationToDelete(null);
  }, [conversationToDelete, remove, router]);

  const currentConversationId = useMemo(() => {
    if (!pathname?.startsWith("/chat/")) return null;
    const segment = pathname.split("/chat/")[1];
    return segment === "new" ? null : segment;
  }, [pathname]);

  const isActive = useCallback(
    (id: string) => currentConversationId === id,
    [currentConversationId],
  );

  return (
    <aside
      className={cn(
        "hidden lg:flex w-[280px] flex-col bg-background/95 backdrop-blur-sm h-full border-l border-border/30",
        "relative overflow-hidden",
        className,
      )}
      lang="ar"
      dir="rtl"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-primary/3 via-transparent to-transparent pointer-events-none" />

      <header className="relative flex shrink-0 items-center justify-between h-14 px-5 border-b border-border/30">
        <Link
          href="/chat/new"
          className="flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg group"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <span className="relative text-xl font-bold bg-gradient-to-l from-foreground to-foreground/70 bg-clip-text text-transparent">
              عنان
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-1 bg-muted/30 rounded-lg p-0.5">
          <button
            onClick={() => setSelectedModel("standard")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200",
              selectedModel === "standard"
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Zap className="h-3 w-3" />
            عنان
          </button>
          <button
            onClick={() => setSelectedModel("pro")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200",
              selectedModel === "pro"
                ? "bg-gradient-to-l from-primary/20 to-primary/5 shadow-sm text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Sparkles className="h-3 w-3" />
            بلس
          </button>
        </div>
      </header>

      <div className="relative flex flex-1 flex-col overflow-hidden p-4 gap-3 min-h-0">
        <Button
          onClick={handleNewChat}
          className={cn(
            "w-full h-11 gap-2 rounded-xl justify-center font-medium transition-all duration-300",
            "bg-gradient-to-l from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70",
            "shadow-lg shadow-primary/20 hover:shadow-primary/30",
            "text-primary-foreground",
          )}
          aria-label="محادثة جديدة"
        >
          <Plus className="h-4 w-4" />
          <span>محادثة جديدة</span>
        </Button>

        <div className="relative shrink-0">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث..."
            dir="rtl"
            aria-label="بحث في المحادثات"
            className="h-10 w-full rounded-xl bg-muted/20 border-border/30 focus:bg-muted/30 focus-visible:ring-primary/20 pr-10 pl-4 text-sm text-right placeholder:text-muted-foreground/50"
          />
        </div>

        <ScrollArea className="flex-1 min-h-0 -mx-2 px-2">
          {isLoading ? (
            <SidebarSkeleton />
          ) : error ? (
            <div
              className="py-8 text-center text-sm text-muted-foreground"
              dir="rtl"
            >
              <p>حدث خطأ في تحميل المحادثات</p>
            </div>
          ) : !hasAnyConversations ? (
            <div className="py-8 text-center" dir="rtl">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-muted/30 flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-muted-foreground/50" />
              </div>
              <p className="text-sm text-muted-foreground">
                {debouncedSearchQuery.trim()
                  ? "لا توجد نتائج"
                  : "لا توجد محادثات"}
              </p>
              {!debouncedSearchQuery.trim() && (
                <p className="text-xs text-muted-foreground/50 mt-1">
                  ابدأ محادثة جديدة
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4 pb-2">
              {timeGroups.map(
                (group) =>
                  group.conversations.length > 0 && (
                    <div key={group.title} className="space-y-1">
                      <p className="px-3 py-1 text-xs font-medium text-muted-foreground/70">
                        {group.title}
                      </p>
                      {group.conversations.map((conv) => (
                        <RowItem
                          key={conv.id}
                          conv={conv}
                          isActive={isActive(conv.id)}
                          onClick={() => handleConversationClick(conv.id)}
                          onDelete={(e) => handleDeleteClick(e, conv.id)}
                        />
                      ))}
                    </div>
                  ),
              )}
            </div>
          )}
        </ScrollArea>

        <div className="relative shrink-0 pt-3 border-t border-border/30">
          {isAuthenticated && user ? (
            <Link href="/settings" className="block">
              <div className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/30 transition-colors group">
                <Avatar className="h-9 w-9 border border-border/50 ring-2 ring-background shadow-sm">
                  <AvatarImage src={user.image || undefined} />
                  <AvatarFallback className="text-xs font-medium">
                    {(user.name || user.phoneNumber || "U").slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0 text-right overflow-hidden">
                  <span
                    className="block text-sm font-medium truncate"
                    dir="rtl"
                  >
                    {user.name || user.phoneNumber}
                  </span>
                  <span
                    className="block text-xs text-muted-foreground truncate"
                    dir="rtl"
                  >
                    {user.email?.includes("@whatsapp.local")
                      ? user.phoneNumber
                      : user.email}
                  </span>
                </div>
                <Settings className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Link>
          ) : (
            <Button
              variant="outline"
              className="w-full h-10 rounded-xl border-border/30 hover:bg-muted/30"
              onClick={() => router.push("/auth/login")}
            >
              تسجيل الدخول
            </Button>
          )}
        </div>
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent
          className="sm:max-w-[400px] p-0 gap-0 overflow-hidden border border-border bg-card"
          dir="rtl"
        >
          <DialogHeader className="p-6 pb-2">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <Trash2 className="h-5 w-5 text-destructive" />
              </div>
              <DialogTitle className="text-lg font-bold">
                حذف المحادثة
              </DialogTitle>
            </div>
            <DialogDescription className="text-center text-muted-foreground mt-2">
              هل أنت متأكد من حذف هذه المحادثة؟
              <br />
              لا يمكن التراجع عن هذا الإجراء.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="p-6 pt-2 gap-2 flex-row">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setConversationToDelete(null);
              }}
              className="flex-1 h-10 rounded-xl"
            >
              إلغاء
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              className="flex-1 h-10 rounded-xl"
            >
              حذف
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </aside>
  );
}
