"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileQuestion, Home, ArrowRight } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground p-4 text-center" dir="rtl">
      <div className="flex flex-col items-center gap-6 max-w-md animate-in fade-in zoom-in-95 duration-500">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl" />
          <div className="relative h-24 w-24 rounded-full bg-card border border-border flex items-center justify-center shadow-2xl">
            <FileQuestion className="h-10 w-10 text-primary" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">404</h1>
          <h2 className="text-xl font-semibold text-muted-foreground">
            الصفحة غير موجودة
          </h2>
          <p className="text-sm text-muted-foreground/80 leading-relaxed">
            عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها.
            تأكد من صحة الرابط أو عد إلى الصفحة الرئيسية.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Button asChild size="lg" className="gap-2 rounded-xl">
            <Link href="/">
              <Home className="h-4 w-4" />
              الرئيسية
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="gap-2 rounded-xl">
            <Link href="/chat/new">
              <ArrowRight className="h-4 w-4" />
              محادثة جديدة
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

