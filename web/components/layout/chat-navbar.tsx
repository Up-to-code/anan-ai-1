"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, Moon, Sun } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Sidebar } from "@/components/layout/sidebar";
import { AppLogo } from "@/components/layout/app-logo";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useTheme } from "next-themes";

export function ChatNavbar() {
  const { theme, setTheme } = useTheme();
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <header
      dir="rtl"
      className="flex h-12 items-center justify-between gap-4 border-b border-border/50 px-4 lg:px-6 bg-background z-20 shrink-0"
    >
      {/* Mobile: Menu trigger + sheet with sidebar */}
      <div className="flex items-center gap-2 lg:hidden">
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-foreground" aria-label="فتح القائمة الجانبية">
              <Menu className="h-4 w-4" />
              <span className="sr-only">فتح القائمة الجانبية</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="p-0 w-[280px]">
            <VisuallyHidden>
              <SheetTitle>القائمة الجانبية</SheetTitle>
            </VisuallyHidden>
            <Sidebar className="w-full !flex border-0 h-full" onNavigate={() => setSheetOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop: logo (sidebar is visible) */}
      <div className="hidden lg:flex items-center">
        <AppLogo height={28} />
      </div>

      {/* Theme toggle */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          aria-label="تبديل السمة"
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">تبديل السمة</span>
        </Button>
      </div>
    </header>
  );
}

