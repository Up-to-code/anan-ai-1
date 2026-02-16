"use client";

import { Button } from "@/components/ui/button";
import { Menu, Moon, Sun } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Sidebar } from "@/components/layout/sidebar";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useTheme } from "next-themes";

export function Navbar() {
    const { theme, setTheme } = useTheme();

    return (
        <header 
            dir="rtl"
            className="sticky top-0 z-50 flex h-14 items-center justify-between gap-4 border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 lg:hidden"
        >
            {/* Right: Mobile Menu Trigger */}
            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-foreground" aria-label="فتح القائمة الجانبية">
                        <Menu className="h-5 w-5" />
                        <span className="sr-only">فتح القائمة الجانبية</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="right" className="p-0 w-[280px]">
                    <VisuallyHidden>
                        <SheetTitle>القائمة الجانبية</SheetTitle>
                    </VisuallyHidden>
                    {/* 
                        !flex: Forces display:flex to override the 'hidden lg:flex' 
                        class from the Sidebar component, ensuring it shows in mobile view 
                    */}
                    <Sidebar className="w-full !flex border-0" />
                </SheetContent>
            </Sheet>

            {/* Center: App Title */}
            <div className="flex-1 text-center">
                <span className="font-bold text-lg tracking-tight text-foreground">
                    عنان 
                </span>
            </div>

            {/* Left: Theme Toggle */}
            <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="h-9 w-9 text-muted-foreground hover:text-foreground"
                aria-label="تبديل السمة"
            >
                <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">تبديل السمة</span>
            </Button>
        </header>
    );
}