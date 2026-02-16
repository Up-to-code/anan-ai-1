import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  Pressable,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { useAction, useQuery } from "convex/react";
import { useThemedTheme, type ThemeTokens } from "../theme";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Linking } from "react-native";
import { api } from "../convex";
import { authClient } from "../lib/auth-client";

// Explicit layout numbers for this screen (plan: AUTH_LAYOUT)
const AUTH_LAYOUT = {
  paddingYButtons: 8,
  marginBetweenSections: 8,
  countrySelectorWidth: 88,
  containerPaddingH: 32,
  containerPaddingTop: 48,
  modalRowPaddingV: 16,
  modalRowPaddingH: 16,
  modalRowGap: 16,
  modalRowCodeMinWidth: 48,
} as const;

const MIN_PHONE_DIGITS = 10;
const MAX_PHONE_DIGITS = 15;
const COOLDOWN_SECONDS = 30;

const DEFAULT_COUNTRY = { code: "+966", name: "المملكة العربية السعودية", flag: "SA" };

const COUNTRIES = [
  DEFAULT_COUNTRY,
  { code: "+971", name: "الإمارات", flag: "AE" },
  { code: "+20", name: "مصر", flag: "EG" },
  { code: "+965", name: "الكويت", flag: "KW" },
  { code: "+973", name: "البحرين", flag: "BH" },
  { code: "+974", name: "قطر", flag: "QA" },
  { code: "+968", name: "عُمان", flag: "OM" },
  { code: "+962", name: "الأردن", flag: "JO" },
];

const ERROR_MESSAGES: Record<string, string> = {
  INVALID_PHONE: "رقم الهاتف غير صحيح. تأكد من إدخال رقم صحيح مع رمز الدولة.",
  LIMIT_EXCEEDED: "تم تجاوز الحد اليومي لطلبات الرمز. حاول لاحقاً.",
  WHATSAPP_NOT_CONFIGURED: "خدمة واتساب غير مفعلة حالياً. حاول لاحقاً.",
  SEND_FAILED: "فشل إرسال الرمز عبر واتساب. حاول مرة أخرى.",
  ALREADY_LOGGED_IN: "أنت مسجل الدخول بالفعل. إذا كنت تريد تسجيل الدخول من جهاز آخر، يرجى تسجيل الخروج أولاً.",
  INVALID_OTP: "الرمز غير صحيح.",
  EXPIRED: "انتهت صلاحية الرمز. اطلب رمزاً جديداً.",
  NOT_FOUND: "لم يتم العثور على طلب تحقق. اطلب رمزاً جديداً.",
};

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

type Step = "phone" | "sent" | "verified";

export function AuthScreen() {
  const theme = useThemedTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, "Auth">>();
  const [country, setCountry] = useState(DEFAULT_COUNTRY);
  const [phone, setPhone] = useState("");
  const [step, setStep] = useState<Step>("phone");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countryModalVisible, setCountryModalVisible] = useState(false);
  const [otpInput, setOtpInput] = useState("");
  const [isSubmittingOTP, setIsSubmittingOTP] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [sessionCreationError, setSessionCreationError] = useState(false);
  const [whatsappLink, setWhatsappLink] = useState<string | null>(null);
  const [alreadyVerified, setAlreadyVerified] = useState(false);

  const digitsOnly = useMemo(() => phone.replace(/\D/g, ""), [phone]);
  const fullPhoneForStep = useMemo(() => {
    const code = country.code.replace(/\D/g, "");
    const full = `${code}${digitsOnly}`;
    return full.startsWith("+") ? full : `+${full}`;
  }, [country.code, digitsOnly]);
  const normalizedPhone = useMemo(() => normalizePhone(fullPhoneForStep), [fullPhoneForStep]);
  const isPhoneValid =
    normalizedPhone.length >= MIN_PHONE_DIGITS && normalizedPhone.length <= MAX_PHONE_DIGITS;

  const requestVerification = useAction(api.features.auth.actions.requestVerification);
  const verifyOTP = useAction(api.features.auth.actions.verifyOTP);
  const status = useQuery(
    api.features.auth.actions.getVerificationStatus,
    step === "sent" || step === "verified" ? { phoneNumber: fullPhoneForStep } : "skip"
  );

  const styles = useMemo(() => createStyles(theme), [theme]);

  // When status has sessionToken after OTP verify, create Better Auth session
  useEffect(() => {
    const sessionToken = status?.sessionToken;
    if (!status?.verified || step === "verified" || !sessionToken) return;
    if (sessionCreationError || isVerifying) return;

    const runVerification = async () => {
      setIsVerifying(true);
      setError(null);
      setSessionCreationError(false);
      const e164Phone = normalizedPhone.startsWith("+") ? normalizedPhone : `+${normalizedPhone}`;
      try {
        const result = await authClient.phoneNumber.verify({
          phoneNumber: e164Phone,
          code: sessionToken,
        });
        const res = result as { status?: boolean; data?: unknown; error?: unknown } | null | undefined;
        const success =
          res && typeof res === "object" && (res.status === true || (res.data && !res.error));
        if (!success) {
          const err =
            result && typeof result === "object" && "error" in result && result.error
              ? (result as { error: { code?: string; message?: string } }).error
              : null;
          const message: string =
            err?.code === "INVALID_ORIGIN"
              ? "تعذر إنشاء الجلسة (خطأ في الاتصال). حاول مرة أخرى."
              : (err?.message ?? "تعذر إنشاء الجلسة. حاول مرة أخرى.");
          setError(message);
          setSessionCreationError(true);
          setStep("sent");
          return;
        }
        setStep("verified");
        navigation.reset({ index: 0, routes: [{ name: "ChatHome" }] });
      } catch (err) {
        setError(
          err instanceof Error ? (err.message || "تعذر إنشاء الجلسة. حاول مرة أخرى.") : "تعذر إنشاء الجلسة. حاول مرة أخرى."
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
    step,
    sessionCreationError,
    isVerifying,
    normalizedPhone,
    navigation,
  ]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((prev) => Math.max(0, prev - 1)), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const onPhoneChange = useCallback((t: string) => {
    setPhone(t.replace(/\D/g, ""));
    setError(null);
  }, []);

  const handleRequestVerification = async () => {
    if (!isPhoneValid) {
      setError(ERROR_MESSAGES.INVALID_PHONE);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const e164 = fullPhoneForStep.startsWith("+") ? fullPhoneForStep : `+${fullPhoneForStep}`;
      const result = await requestVerification({ phoneNumber: e164 });
      if (!result || result.success !== true) {
        const msg = result?.error && ERROR_MESSAGES[result.error] ? ERROR_MESSAGES[result.error] : "فشل إرسال الرمز. حاول مرة أخرى.";
        setError(msg);
        if (result?.error === "LIMIT_EXCEEDED" && result?.retryAfterSeconds) {
          setCooldown(Math.max(COOLDOWN_SECONDS, result.retryAfterSeconds));
        }
        return;
      }
      setAlreadyVerified(result.alreadyVerified ?? false);
      setWhatsappLink(result.whatsappLink ?? null);
      setStep("sent");
      setCooldown(COOLDOWN_SECONDS);
    } catch (e) {
      setError(e instanceof Error ? e.message : "حدث خطأ. حاول مرة أخرى.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    const otp = otpInput.trim();
    if (otp.length < 6) {
      setError("أدخل الرمز المكون من 6 أرقام.");
      return;
    }
    setError(null);
    setIsSubmittingOTP(true);
    try {
      const e164 = fullPhoneForStep.startsWith("+") ? fullPhoneForStep : `+${fullPhoneForStep}`;
      const result = await verifyOTP({ phoneNumber: e164, otp });
      if (result?.success) {
        setOtpInput("");
      } else {
        const msg = result?.error && ERROR_MESSAGES[result.error] ? ERROR_MESSAGES[result.error] : "الرمز غير صحيح أو انتهت صلاحيته.";
        setError(msg);
        setOtpInput("");
      }
    } catch (e) {
      setError("فشل التحقق. حاول مرة أخرى.");
      setOtpInput("");
    } finally {
      setIsSubmittingOTP(false);
    }
  };

  const handleReset = useCallback(() => {
    setStep("phone");
    setError(null);
    setOtpInput("");
    setSessionCreationError(false);
    setWhatsappLink(null);
    setAlreadyVerified(false);
  }, []);

  const selectCountry = useCallback((c: (typeof COUNTRIES)[0]) => {
    setCountry(c);
    setCountryModalVisible(false);
  }, []);

  const formattedCooldown =
    cooldown > 0 ? `${Math.floor(cooldown / 60)}:${String(cooldown % 60).padStart(2, "0")}` : "";

  return (
    <View style={styles.container}>
      <Text style={styles.title}>تسجيل الدخول</Text>
      <Text style={styles.subtitle}>أدخل رقم هاتفك للتحقق</Text>

      {step === "phone" && (
        <>
          <View style={styles.countryRow}>
            <TouchableOpacity
              style={styles.countryButton}
              onPress={() => setCountryModalVisible(true)}
              accessibilityLabel="اختر الدولة"
              accessibilityRole="button"
            >
              <Text style={styles.countryCode}>{country.code}</Text>
              <Ionicons name="chevron-down" size={18} color={theme.colors.foreground} />
            </TouchableOpacity>
            <Input
              placeholder="رقم الهاتف (أرقام فقط)"
              value={phone}
              onChangeText={onPhoneChange}
              keyboardType="number-pad"
              editable={!loading}
              style={styles.phoneInput}
              accessibilityLabel="رقم الهاتف"
              maxLength={15}
              writingDirection="ltr"
            />
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button
            onPress={handleRequestVerification}
            loading={loading}
            disabled={loading || !isPhoneValid || cooldown > 0}
            accessibilityLabel="متابعة"
            style={styles.submitButton}
          >
            {cooldown > 0 ? `إعادة المحاولة بعد ${formattedCooldown}` : "متابعة"}
          </Button>
        </>
      )}

      {step === "sent" && (
        <>
          <View style={styles.statusBlock}>
            <Text style={styles.statusText}>
              {alreadyVerified
                ? "رقمك مُتحقق منه مسبقاً. أدخل الرمز لإنشاء جلسة جديدة."
                : whatsappLink
                  ? "لم نتمكن من إرسال الرمز مباشرة. افتح واتساب وانسخ الرمز ثم الصقه هنا."
                  : "تم إرسال رمز التحقق إلى واتساب. أدخل الرمز هنا."}
            </Text>
          </View>
          {whatsappLink ? (
            <Button
              onPress={() => whatsappLink && Linking.openURL(whatsappLink)}
              accessibilityLabel="فتح واتساب"
              style={styles.secondaryButton}
              variant="secondary"
            >
              فتح واتساب ونسخ الرمز
            </Button>
          ) : null}
          <Text style={styles.otpLabel}>رمز التحقق</Text>
          <Input
            placeholder="000000"
            value={otpInput}
            onChangeText={(t) => {
              setOtpInput(t.replace(/\D/g, "").slice(0, 6));
              setError(null);
            }}
            keyboardType="number-pad"
            editable={!isSubmittingOTP && !isVerifying}
            style={styles.otpInput}
            accessibilityLabel="رمز التحقق"
            maxLength={6}
            writingDirection="ltr"
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button
            onPress={handleVerifyOTP}
            loading={isSubmittingOTP || isVerifying}
            disabled={isSubmittingOTP || isVerifying || otpInput.length < 6}
            accessibilityLabel="تحقق"
            style={styles.submitButton}
          >
            {isVerifying ? "جاري إنشاء الجلسة..." : "تحقق"}
          </Button>
          <Button
            onPress={handleReset}
            disabled={loading}
            accessibilityLabel="تغيير الرقم"
            style={styles.backButton}
            variant="secondary"
          >
            تغيير الرقم
          </Button>
        </>
      )}

      <Modal
        visible={countryModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCountryModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setCountryModalVisible(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>اختر الدولة</Text>
            <FlatList
              data={COUNTRIES}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <Pressable
                  style={[styles.modalRow, item.code === country.code && styles.modalRowSelected]}
                  onPress={() => selectCountry(item)}
                  accessibilityLabel={`${item.name} ${item.code}`}
                  accessibilityRole="button"
                >
                  <Text style={styles.modalRowCode}>{item.code}</Text>
                  <Text style={styles.modalRowName}>{item.name}</Text>
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

function createStyles(theme: ThemeTokens) {
  const { colors, radius, fontSize, fontFamily } = theme;
  const L = AUTH_LAYOUT;
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingHorizontal: L.containerPaddingH,
      paddingTop: L.containerPaddingTop,
    },
    title: {
      color: colors.foreground,
      fontSize: fontSize.xl,
      fontFamily: fontFamily.bold,
      marginBottom: L.marginBetweenSections,
      textAlign: "right",
    },
    subtitle: {
      color: colors.mutedForeground,
      fontSize: fontSize.base,
      fontFamily: fontFamily.regular,
      marginBottom: L.marginBetweenSections,
      textAlign: "right",
    },
    countryRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: L.marginBetweenSections,
      marginBottom: L.marginBetweenSections,
    },
    countryButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      minWidth: L.countrySelectorWidth,
      paddingVertical: L.paddingYButtons,
      paddingHorizontal: 8,
      backgroundColor: colors.input,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 4,
    },
    countryCode: {
      color: colors.foreground,
      fontSize: fontSize.base,
      fontFamily: fontFamily.medium,
    },
    phoneInput: {
      flex: 1,
      marginBottom: 0,
    },
    error: {
      color: colors.destructive,
      fontSize: fontSize.sm,
      fontFamily: fontFamily.regular,
      marginBottom: L.marginBetweenSections,
      textAlign: "right",
    },
    submitButton: {
      marginTop: L.marginBetweenSections,
      paddingVertical: L.paddingYButtons,
    },
    secondaryButton: {
      marginBottom: L.marginBetweenSections,
      paddingVertical: L.paddingYButtons,
    },
    backButton: {
      marginTop: L.marginBetweenSections,
      paddingVertical: L.paddingYButtons,
    },
    statusBlock: {
      marginBottom: L.marginBetweenSections,
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: colors.input,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    statusText: {
      color: colors.mutedForeground,
      fontSize: fontSize.sm,
      fontFamily: fontFamily.regular,
      textAlign: "right",
    },
    otpLabel: {
      color: colors.foreground,
      fontSize: fontSize.sm,
      fontFamily: fontFamily.medium,
      marginBottom: 4,
      textAlign: "right",
    },
    otpInput: {
      marginBottom: L.marginBetweenSections,
      textAlign: "center",
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "flex-end",
    },
    modalContent: {
      backgroundColor: colors.card,
      borderTopLeftRadius: radius.xl,
      borderTopRightRadius: radius.xl,
      padding: 24,
      maxHeight: "70%",
    },
    modalTitle: {
      color: colors.foreground,
      fontSize: fontSize.lg,
      fontFamily: fontFamily.bold,
      marginBottom: L.marginBetweenSections,
      textAlign: "center",
    },
    modalRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: L.modalRowPaddingV,
      paddingHorizontal: L.modalRowPaddingH,
      borderRadius: radius.lg,
      gap: L.modalRowGap,
    },
    modalRowSelected: {
      backgroundColor: colors.primary + "20",
    },
    modalRowCode: {
      color: colors.foreground,
      fontSize: fontSize.base,
      fontFamily: fontFamily.medium,
      minWidth: L.modalRowCodeMinWidth,
    },
    modalRowName: {
      color: colors.foreground,
      fontSize: fontSize.base,
      fontFamily: fontFamily.regular,
      flex: 1,
      textAlign: "right",
    },
  });
}
