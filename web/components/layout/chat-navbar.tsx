"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Menu, Moon, Sun, Settings, Plus, RefreshCw } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Sidebar } from "@/components/layout/sidebar";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useTheme } from "next-themes";
import { useAuth } from "@/hooks/use-auth";

export function ChatNavbar() {
  const { theme, setTheme } = useTheme();
  const { user, isAuthenticated } = useAuth();
  const [sheetOpen, setSheetOpen] = useState(false);
  const router = useRouter();

  const handleNewChat = () => {
    router.push("/chat/new");
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <header
      dir="rtl"
      className="flex h-12 items-center justify-between gap-2 border-b border-border/30 px-3 lg:px-4 bg-background/80 backdrop-blur-sm z-20 shrink-0"
    >
      {/* Right side: Menu + Logo */}
      <div className="flex items-center gap-2">
        {/* Mobile sidebar trigger */}
        <div className="lg:hidden">
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" aria-label="القائمة">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="p-0 w-[280px]">
              <VisuallyHidden>
                <SheetTitle>القائمة</SheetTitle>
              </VisuallyHidden>
              <Sidebar className="w-full !flex border-0 h-full" onNavigate={() => setSheetOpen(false)} />
            </SheetContent>
          </Sheet>
        </div>

        {/* Logo */}
        <span className="text-base font-bold text-foreground tracking-tight">عنان</span>
      </div>

      {/* Left side: Controls */}
      <div className="flex items-center gap-0.5">
        {/* New chat */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleNewChat}
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          aria-label="محادثة جديدة"
        >
          <Plus className="h-4 w-4" />
        </Button>

        {/* Refresh */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleRefresh}
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          aria-label="تحديث"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>

        {/* Settings */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/settings")}
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          aria-label="الإعدادات"
        >
          <Settings className="h-3.5 w-3.5" />
        </Button>

        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          aria-label="تبديل السمة"
        >
          <Sun className="h-3.5 w-3.5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-3.5 w-3.5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>

        {/* User avatar / login */}
        {isAuthenticated && user ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/profile")}
            className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
            aria-label="الملف الشخصي"
          >
            {user.image ? (
              <img src={user.image} alt="" className="h-6 w-6 rounded-full object-cover" />
            ) : (
              <div className="h-6 w-6 rounded-full bg-primary/15 flex items-center justify-center text-[10px] font-bold text-primary">
                {(user.name || user.phoneNumber || "U").charAt(0)}
              </div>
            )}
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/auth/login")}
            className="h-8 px-3 text-xs text-muted-foreground hover:text-foreground"
          >
            دخول
          </Button>
        )}
      </div>
    </header>
  );
}
