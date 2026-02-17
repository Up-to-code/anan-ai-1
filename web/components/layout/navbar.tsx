"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function Navbar() {
  const { theme, setTheme } = useTheme();

  return (
    <header
      dir="rtl"
      className="sticky top-0 z-50 border-b border-border/40 bg-background/75 backdrop-blur-2xl"
    >
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="text-base font-black tracking-tight text-foreground">
          عنان
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
          <a href="#why" className="transition-colors hover:text-foreground">
            لماذا
          </a>
          <a href="#about" className="transition-colors hover:text-foreground">
            عن الفكرة
          </a>
          <a href="#why-us" className="transition-colors hover:text-foreground">
            لماذا نحن
          </a>
          <a href="#idea" className="transition-colors hover:text-foreground">
            الفكرة
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <a href="#ask">
            <Button size="sm" className="h-9 rounded-xl px-4 text-xs sm:text-sm">
              ابدأ الآن
            </Button>
          </a>
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
      </div>
    </header>
  );
}
