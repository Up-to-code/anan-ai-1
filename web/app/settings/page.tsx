"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { authClient } from "@/lib/auth-client";
import { Loader2, ArrowRight, User, Phone, Shield, KeyRound } from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const nameInputRef = useRef<HTMLInputElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  if (!authLoading && !isAuthenticated) {
    router.replace("/auth/login");
    return (
      <div className="flex min-h-[50vh] items-center justify-center" dir="rtl">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || isSaving) return;
    const trimmed = nameInputRef.current?.value?.trim() ?? "";
    if (!trimmed) {
      setMessage({ type: "error", text: "الرجاء إدخال الاسم" });
      return;
    }
    setIsSaving(true);
    setMessage(null);
    try {
      const result = await authClient.updateUser({ name: trimmed });
      const err = result && typeof result === "object" && "error" in result ? (result as { error?: { message?: string } }).error : null;
      if (err) {
        setMessage({ type: "error", text: err.message ?? "فشل التحديث" });
        return;
      }
      setMessage({ type: "success", text: "تم حفظ التغييرات" });
    } catch (err) {
      console.error("Settings update error:", err);
      setMessage({ type: "error", text: "حدث خطأ أثناء حفظ التغييرات" });
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || (!isAuthenticated && !user)) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center" dir="rtl">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex min-h-[100dvh] flex-col" dir="rtl">
      <div className="mx-auto w-full max-w-lg space-y-6 p-6">
        <Link
          href="/chat/new"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowRight className="h-4 w-4" />
          العودة للمحادثة
        </Link>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-xl font-semibold">الإعدادات</h2>
            <p className="text-sm text-muted-foreground mt-1">تعديل بيانات حسابك</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                الاسم المعروض
              </Label>
              <Input
                ref={nameInputRef}
                id="name"
                name="name"
                defaultValue={user?.name ?? ""}
                placeholder="أدخل اسمك"
                disabled={isSaving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                رقم الهاتف
              </Label>
              <Input
                id="phone"
                value={user?.phoneNumber ?? ""}
                readOnly
                disabled
                className="bg-muted cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground">
                رقم الهاتف مرتبط بحساب واتساب ولا يمكن تغييره
              </p>
            </div>
            {message && (
              <p
                className={
                  message.type === "success"
                    ? "text-sm text-green-600 dark:text-green-400"
                    : "text-sm text-destructive"
                }
              >
                {message.text}
              </p>
            )}
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="me-2 h-4 w-4 animate-spin" />
                  جاري الحفظ...
                </>
              ) : (
                "حفظ"
              )}
            </Button>
          </form>
        </div>

        {/* Security: 2FA and backup codes */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Shield className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-xl font-semibold">الأمان</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            المصادقة الثنائية (2FA) ورموز النسخ الاحتياطي تحمي حسابك. عند تفعيل 2FA تحصل على رموز نسخ احتياطي يمكنك استخدامها مرة واحدة إذا فقدت الوصول لتطبيق المصادقة.
          </p>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <KeyRound className="h-4 w-4 shrink-0" />
              <span>رموز النسخ الاحتياطي تُعرض مرة واحدة عند التفعيل. احفظها في مكان آمن.</span>
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              disabled
              title="يتطلب تفعيل المصادقة الثنائية أولاً"
            >
              عرض رموز النسخ الاحتياطي (قريباً)
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
