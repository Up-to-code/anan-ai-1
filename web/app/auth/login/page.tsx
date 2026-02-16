"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare } from "lucide-react";
import {
  AuthContainer,
  WhatsAppAuthForm,
} from "@/components/auth";

// ============================================
// Login Page Component
// ============================================

export default function LoginPage() {
  const router = useRouter();
  const handleVerified = useCallback(() => {
    router.push("/chat/new");
  }, [router]);

  return (
    <AuthContainer
      icon={MessageSquare}
      title="الدخول عبر واتساب"
      description="أدخل رقم واتساب لإرسال رمز التحقق"
    >
      <WhatsAppAuthForm onVerified={handleVerified} ctaText="ابدأ المحادثة" />
    </AuthContainer>
  );
}
