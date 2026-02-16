"use client";

import { useEffect, useMemo, useState } from "react";
import { useAction, useQuery } from "convex/react";
import {
  CheckCircle2,
  KeyRound,
  Loader2,
  Phone,
  ShieldCheck,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { api } from "convex/_generated/api";
import { AuthInput } from "./auth-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { useAuth } from "@/hooks/use-auth";
import {
  formatSeconds,
  normalizePhone,
  MAX_PHONE_DIGITS,
  MIN_PHONE_DIGITS,
} from "./whatsapp-auth.utils";
import { createLogger } from "@/lib/logger";

const log = createLogger("WhatsAppAuth");

type Step = "phone" | "sent" | "verified";

const ERROR_MESSAGES: Record<string, string> = {
  INVALID_PHONE: "رقم الهاتف غير صحيح. تأكد من إدخال رقم صحيح مع رمز الدولة.",
  LIMIT_EXCEEDED: "تم تجاوز الحد اليومي لطلبات الرمز. حاول لاحقاً.",
  WHATSAPP_NOT_CONFIGURED: "خدمة واتساب غير مفعلة حالياً. حاول لاحقاً.",
  SEND_FAILED: "فشل إرسال الرمز عبر واتساب. حاول مرة أخرى.",
  ALREADY_LOGGED_IN:
    "أنت مسجل الدخول بالفعل. إذا كنت تريد تسجيل الدخول من جهاز آخر، يرجى تسجيل الخروج أولاً.",
  INVALID_OTP: "الرمز غير صحيح.",
  EXPIRED: "انتهت صلاحية الرمز. اطلب رمزاً جديداً.",
  NOT_FOUND: "لم يتم العثور على طلب تحقق. اطلب رمزاً جديداً.",
};

const COOLDOWN_SECONDS = 30;

interface WhatsAppAuthFormProps {
  onVerified?: (sessionToken?: string) => void;
  ctaText?: string;
}

export function WhatsAppAuthForm({
  onVerified,
  ctaText = "متابعة",
}: WhatsAppAuthFormProps) {
  const [phone, setPhone] = useState("");
  const [step, setStep] = useState<Step>("phone");
  const [error, setError] = useState<string | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [verifiedToken, setVerifiedToken] = useState<string | null>(null);
  const [alreadyVerified, setAlreadyVerified] = useState(false);
  const [whatsappLink, setWhatsappLink] = useState<string | null>(null);
  const [otpInput, setOtpInput] = useState("");
  const [isSubmittingOTP, setIsSubmittingOTP] = useState(false);
  const [sessionCreationError, setSessionCreationError] = useState(false);
  const [retryTrigger, setRetryTrigger] = useState(0);

  const { isAuthenticated, user } = useAuth();
  const requestVerification = useAction(
    api.features.auth.actions.requestVerification,
  );
  const verifyOTP = useAction(api.features.auth.actions.verifyOTP);
  const status = useQuery(
    api.features.auth.actions.getVerificationStatus,
    step === "sent" || step === "verified" ? { phoneNumber: phone } : "skip",
  );

  // Check if user is already logged in and redirect if needed
  useEffect(() => {
    if (
      isAuthenticated &&
      user?.phoneNumber &&
      normalizePhone(user.phoneNumber) === normalizePhone(phone) &&
      step === "phone"
    ) {
      log.debug("user already logged in with this phone", {
        phone,
        userPhone: user.phoneNumber,
      });
      setError(ERROR_MESSAGES.ALREADY_LOGGED_IN);
    }
  }, [isAuthenticated, user, phone, step]);

  const normalizedPhone = useMemo(() => normalizePhone(phone), [phone]);
  const isPhoneValid =
    normalizedPhone.length >= MIN_PHONE_DIGITS &&
    normalizedPhone.length <= MAX_PHONE_DIGITS;

  useEffect(() => {
    if (!status?.verified || step === "verified") return;
    const sessionToken = status.sessionToken;
    log.debug("status verified", {
      phone,
      sessionTokenPresent: !!sessionToken,
      alreadyVerified: status.alreadyVerified,
      hasUserId: status.hasUserId,
    });

    // If phone is already verified but no session token, it expired
    if (!sessionToken) {
      setError("انتهت صلاحية التحقق. يرجى إعادة الإرسال.");
      setStep("sent");
      return;
    }

    // Don't auto-retry after session creation failure until user clicks retry
    if (sessionCreationError) return;

    if (verifiedToken === sessionToken || isVerifying) return;

    const runVerification = async () => {
      setIsVerifying(true);
      setError(null);
      setSessionCreationError(false);
      const e164Phone = normalizedPhone.startsWith("+")
        ? normalizedPhone
        : `+${normalizedPhone}`;
      log.debug("verifying session", { phone: e164Phone });
      try {
        const result = await authClient.phoneNumber.verify({
          phoneNumber: e164Phone,
          code: sessionToken,
        });
        // Better Auth verify returns { status: boolean } on success, or { data: null, error: {...} } on failure
        const res = result as
          | { status?: boolean; data?: unknown; error?: unknown }
          | null
          | undefined;
        const success =
          res &&
          typeof res === "object" &&
          (res.status === true || (res.data && !res.error));
        if (!success) {
          const err =
            result &&
            typeof result === "object" &&
            "error" in result &&
            result.error
              ? (result as { error: { code?: string; message?: string } }).error
              : null;
          log.error("session verify failed", {
            code: err?.code ?? "unknown",
            message: err?.message ?? "",
            phone: e164Phone,
            hasResult: !!result,
          });
          const message =
            err?.code === "INVALID_ORIGIN"
              ? "تعذر إنشاء الجلسة (خطأ في الاتصال). حاول تحديث الصفحة ثم إعادة المحاولة."
              : err?.message
                ? err.message
                : "تعذر إنشاء الجلسة. حاول مرة أخرى.";
          setError(message);
          setSessionCreationError(true);
          setStep("sent");
          return;
        }
        log.debug("session verified", { phone });
        setVerifiedToken(sessionToken);
        setStep("verified");
        onVerified?.(sessionToken);
      } catch (err) {
        log.error("session verify error", { phone, err });
        setError(
          err instanceof Error
            ? err.message
            : "تعذر إنشاء الجلسة. حاول مرة أخرى.",
        );
        setSessionCreationError(true);
        setStep("sent");
      } finally {
        setIsVerifying(false);
      }
    };

    runVerification();
  }, [
    status?.verified,
    status?.sessionToken,
    status?.alreadyVerified,
    status?.hasUserId,
    step,
    onVerified,
    phone,
    verifiedToken,
    isVerifying,
    sessionCreationError,
    retryTrigger,
    normalizedPhone,
  ]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  useEffect(() => {
    setError(null);
  }, [phone]);

  const handleRequest = async () => {
    if (!isPhoneValid) {
      setError(ERROR_MESSAGES.INVALID_PHONE);
      log.warn("invalid phone", { phone });
      return;
    }

    // Check if user is already logged in with this phone number
    if (
      isAuthenticated &&
      user?.phoneNumber &&
      normalizePhone(user.phoneNumber) === normalizePhone(phone)
    ) {
      setError(ERROR_MESSAGES.ALREADY_LOGGED_IN);
      return;
    }

    setError(null);
    setIsRequesting(true);
    setAlreadyVerified(false);
    log.debug("requestVerification start", { phone });
    try {
      const result = await requestVerification({ phoneNumber: phone });
      if (!result || result.success !== true) {
        log.warn("requestVerification failed", {
          phone,
          result: result ?? null,
        });
        if (result?.error === "LIMIT_EXCEEDED") {
          const retrySec = result?.retryAfterSeconds ?? 0;
          setCooldown(Math.max(COOLDOWN_SECONDS, retrySec));
          setError(
            retrySec <= 0
              ? "جاري إعادة تعيين الحد. حاول خلال ثوانٍ."
              : `تم تجاوز الحد مؤقتاً. يمكنك إعادة المحاولة بعد ${formatSeconds(retrySec)}.`,
          );
          return;
        }
        if (result?.error === "ALREADY_LOGGED_IN") {
          setError(ERROR_MESSAGES.ALREADY_LOGGED_IN);
          return;
        }
        const baseMessage =
          (result?.error && ERROR_MESSAGES[result.error]) ||
          "حدث خطأ أثناء الإرسال. حاول مرة أخرى.";
        const message = result?.details
          ? `${baseMessage} (${result.details})`
          : baseMessage;
        setError(message);
        return;
      }
      log.debug("requestVerification success", {
        phone,
        alreadyVerified: result.alreadyVerified,
        hasWhatsAppLink: !!result.whatsappLink,
      });
      setAlreadyVerified(result.alreadyVerified || false);
      setWhatsappLink(result.whatsappLink || null);
      setSessionCreationError(false);
      setStep("sent");
      setCooldown(COOLDOWN_SECONDS);
    } catch (err) {
      log.error("requestVerification error", { phone, err });
      setError(
        err instanceof Error
          ? err.message
          : "حدث خطأ أثناء الإرسال. حاول مرة أخرى.",
      );
    } finally {
      setIsRequesting(false);
    }
  };

  const handleReset = () => {
    setStep("phone");
    setError(null);
    setVerifiedToken(null);
    setAlreadyVerified(false);
    setWhatsappLink(null);
    setOtpInput("");
    setSessionCreationError(false);
  };

  const handleRetrySessionCreation = () => {
    setSessionCreationError(false);
    setError(null);
    setRetryTrigger((r) => r + 1);
  };

  const handleVerifyOTP = async () => {
    const otp = otpInput.trim();
    if (!otp || otp.length < 6) {
      setError("أدخل الرمز المكون من 6 أرقام.");
      return;
    }
    setError(null);
    setIsSubmittingOTP(true);
    try {
      const result = await verifyOTP({ phoneNumber: phone, otp });
      if (result?.success) {
        setOtpInput("");
        // getVerificationStatus will reactively update with sessionToken, triggering useEffect
      } else {
        setOtpInput("");
        const message =
          result?.error && ERROR_MESSAGES[result.error]
            ? ERROR_MESSAGES[result.error]
            : "الرمز غير صحيح أو انتهت صلاحيته. حاول مرة أخرى.";
        setError(message);
      }
    } catch (err) {
      log.error("verifyOTP error", { phone, err });
      setError("فشل التحقق. حاول مرة أخرى.");
    } finally {
      setIsSubmittingOTP(false);
    }
  };

  const statusText =
    step === "phone"
      ? "أدخل رقم واتساب ثم اضغط إرسال."
      : step === "sent"
        ? alreadyVerified
          ? "رقمك مُتحقق منه مسبقاً. أدخل الرمز لإنشاء جلسة جديدة."
          : "أدخل الرمز الذي وصلك عبر واتساب في الحقل أدناه."
        : "تم التحقق بنجاح.";

  const formattedCooldown =
    cooldown > 0
      ? `${Math.floor(cooldown / 60)}:${String(cooldown % 60).padStart(2, "0")}`
      : "";

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border/50 bg-card px-4 py-3 text-xs text-muted-foreground">
        {statusText}
      </div>

      <AuthInput
        id="phone"
        name="phone"
        label="رقم واتساب"
        type="tel"
        placeholder="+966 5X XXX XXXX"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        icon={Phone}
        required
        inputDir="ltr"
        disabled={isRequesting || isVerifying || step !== "phone"}
        autoComplete="tel"
        helperText={<span>سيصلك رمز التحقق عبر واتساب على هذا الرقم.</span>}
      />

      {error && (
        <div className="flex items-start gap-2 text-red-300 text-sm bg-red-500/10 py-2 px-3 rounded-md border border-red-500/20">
          <XCircle className="h-4 w-4 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {step === "phone" && (
        <Button
          type="button"
          className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-lg shadow-blue-900/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          onClick={handleRequest}
          disabled={isRequesting || !isPhoneValid || cooldown > 0}
        >
          {isRequesting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>جاري الإرسال...</span>
            </>
          ) : cooldown > 0 ? (
            `إعادة المحاولة بعد ${formattedCooldown}`
          ) : (
            "إرسال رمز عبر واتساب"
          )}
        </Button>
      )}

      {step === "sent" && (
        <div className="space-y-3 rounded-lg border border-border/50 bg-card p-4">
          {alreadyVerified && (
            <div className="flex items-start gap-2 text-sm text-amber-300 bg-amber-500/10 py-2 px-3 rounded-md border border-amber-500/20">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>
                رقمك مُتحقق منه مسبقاً. أدخل الرمز لإنشاء جلسة جديدة. يجب التحقق
                في كل مرة تريد فيها تسجيل الدخول.
              </span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-zinc-300">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            {whatsappLink
              ? "لم نتمكن من إرسال الرمز مباشرة. اضغط الزر لفتح واتساب ونسخ الرمز، ثم الصقه هنا."
              : "تم إرسال رمز التحقق إلى واتساب. أدخل الرمز هنا."}
          </div>
          {whatsappLink && (
            <Button
              type="button"
              variant="outline"
              className="w-full h-10 gap-2"
              onClick={() => window.open(whatsappLink!, "_blank")}
            >
              فتح واتساب ونسخ الرمز
            </Button>
          )}
          <div className="space-y-2">
            <Label htmlFor="otp" className="text-zinc-300 block text-right">
              رمز التحقق
            </Label>
            <div className="relative">
              <KeyRound className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <Input
                id="otp"
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                value={otpInput}
                onChange={(e) => {
                  setOtpInput(e.target.value.replace(/\D/g, ""));
                  setError(null);
                }}
                className="pl-4 pr-10 h-11 text-center font-mono text-lg tracking-widest"
                dir="ltr"
                disabled={isVerifying || isSubmittingOTP}
                autoComplete="one-time-code"
              />
            </div>
          </div>
          <Button
            type="button"
            className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-medium flex items-center justify-center gap-2"
            onClick={handleVerifyOTP}
            disabled={isVerifying || isSubmittingOTP || otpInput.length < 6}
          >
            {isSubmittingOTP ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>جاري التحقق...</span>
              </>
            ) : isVerifying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>جاري إنشاء الجلسة...</span>
              </>
            ) : (
              "تحقق"
            )}
          </Button>
          <div className="text-xs text-zinc-500" dir="ltr">
            {phone}
          </div>
          <div className="flex flex-wrap gap-2">
            {sessionCreationError && status?.sessionToken && (
              <Button
                type="button"
                className="h-10 bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-2"
                onClick={handleRetrySessionCreation}
                disabled={isVerifying || isSubmittingOTP}
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>جاري المحاولة...</span>
                  </>
                ) : (
                  "إعادة المحاولة"
                )}
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              className="h-10"
              onClick={handleRequest}
              disabled={
                isRequesting || isVerifying || isSubmittingOTP || cooldown > 0
              }
            >
              {isRequesting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : cooldown > 0 ? (
                `إعادة الإرسال بعد ${formattedCooldown}`
              ) : (
                "إعادة إرسال الرمز"
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="h-10 text-zinc-400 hover:text-zinc-200"
              onClick={handleReset}
              disabled={isVerifying || isSubmittingOTP}
            >
              تغيير الرقم
            </Button>
          </div>
        </div>
      )}

      {step === "verified" && (
        <div className="space-y-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4">
          <div className="flex items-center gap-2 text-sm text-emerald-200">
            <CheckCircle2 className="h-4 w-4" />
            تم التحقق بنجاح.
          </div>
          <Button
            type="button"
            className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-lg shadow-emerald-900/20 transition-all active:scale-[0.98]"
            onClick={() => onVerified?.(verifiedToken ?? undefined)}
          >
            {ctaText}
          </Button>
        </div>
      )}
    </div>
  );
}
