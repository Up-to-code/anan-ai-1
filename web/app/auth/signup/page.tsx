"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import {
  AuthContainer,
  WhatsAppAuthForm,
} from "@/components/auth";

// ============================================
// Signup Page Component
// ============================================

export default function SignupPage() {
  const router = useRouter();
  const handleVerified = useCallback(() => {
    router.push("/chat/new");
  }, [router]);

  return (
    <AuthContainer
      icon={UserPlus}
      title="تفعيل الحساب عبر واتساب"
      description="سجّل برقم واتساب لإتمام التحقق"
    >
      <WhatsAppAuthForm onVerified={handleVerified} ctaText="ابدأ المحادثة" />
    </AuthContainer>
  );
}
