import React, { useMemo } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useThemedTheme, type ThemeTokens } from "../theme";

export function PrivacyScreen() {
  const theme = useThemedTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>سياسة الخصوصية</Text>
      <Text style={styles.paragraph}>
        نحن في عنان نحترم خصوصيتك. تستخدم هذه التطبيق بياناتك لتقديم خدمة المحادثة والتمويل العقاري وتحسين تجربتك.
      </Text>
      <Text style={styles.paragraph}>
        لا نشارك بياناتك الشخصية مع أطراف ثالثة لأغراض تسويقية دون موافقتك. قد نستخدم البيانات المجمعة لتحسين الخدمة.
      </Text>
      <Text style={styles.paragraph}>
        للاستفسارات أو طلبات حذف البيانات، يرجى التواصل معنا عبر الإعدادات أو البريد الإلكتروني.
      </Text>
    </ScrollView>
  );
}

function createStyles(theme: ThemeTokens) {
  const { colors, spacing, fontSize, fontFamily } = theme;
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.lg, paddingBottom: spacing["3xl"] },
    title: {
      color: colors.foreground,
      fontSize: fontSize.xl,
      fontFamily: fontFamily.bold,
      marginBottom: spacing.lg,
    },
    paragraph: {
      color: colors.foreground,
      fontSize: fontSize.base,
      fontFamily: fontFamily.regular,
      marginBottom: spacing.md,
      lineHeight: fontSize.base * 1.6,
    },
  });
}
