"use client";

import { useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { MessageSquare, Sparkles, CheckCircle2 } from "lucide-react";
import { WhatsAppAuthForm } from "./whatsapp-auth";

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const BENEFITS = [
  "محادثات غير محدودة مع الذكاء الاصطناعي",
  "حفظ سجل المحادثات والعودة إليها",
  "إمكانية حجز المواعيد العقارية",
  "تخصيص تجربة البحث عن العقارات",
] as const;

export function AuthDialog({ open, onOpenChange, onSuccess }: AuthDialogProps) {
  const handleVerified = useCallback(() => {
    onSuccess?.();
    onOpenChange(false);
  }, [onOpenChange, onSuccess]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="md:max-w-4xl max-w-full p-0 gap-0 overflow-hidden md:rounded-xl rounded-t-3xl border border-border/50 bg-card shadow-2xl fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] max-h-[90vh] flex flex-col"
        dir="rtl"
      >
        <div className="md:hidden flex justify-center pt-3 pb-2">
          <div className="w-12 h-1.5 rounded-full bg-muted-foreground/30" />
        </div>

        <div className="overflow-y-auto flex-1 custom-scrollbar">
          <div className="flex flex-col items-center justify-center pt-8 pb-6 px-6 bg-gradient-to-b from-primary/10 to-transparent border-b border-border/30">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-primary/20">
              <MessageSquare className="w-8 h-8 text-primary-foreground" />
            </div>
            <DialogTitle className="text-2xl font-bold text-foreground mb-2 text-center">
              استمر في المحادثة
            </DialogTitle>
            <DialogDescription className="text-muted-foreground flex items-center justify-center gap-2 text-center">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>سجل دخولك للحصول على محادثات غير محدودة</span>
            </DialogDescription>
          </div>

          <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border/30 md:divide-x-reverse min-h-[400px]">
            <div className="p-6 md:p-8 flex flex-col">
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  للتحقق، سنرسل رمزاً إلى رقم واتساب الخاص بك.
                </div>
                <WhatsAppAuthForm
                  onVerified={handleVerified}
                  ctaText="متابعة المحادثة"
                />
              </div>
            </div>

            <div className="p-6 md:p-8 bg-muted/20 flex flex-col justify-center">
              <div className="space-y-6 text-center">
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    مميزات الحساب المجاني
                  </h3>
                  <div className="grid gap-3">
                    {BENEFITS.map((benefit, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/30 hover:border-border/50 transition-colors"
                      >
                        <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                        <span className="text-sm text-foreground text-right w-full">
                          {benefit}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default AuthDialog;
