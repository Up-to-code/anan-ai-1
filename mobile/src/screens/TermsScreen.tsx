import React, { useMemo } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useThemedTheme, type ThemeTokens } from "../theme";

export function TermsScreen() {
  const theme = useThemedTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>الشروط والأحكام</Text>
      <Text style={styles.paragraph}>
        باستخدامك تطبيق عنان، فإنك توافق على هذه الشروط. الخدمة مقدمة لأغراض المساعدة في الاستفسارات العقارية والتمويلية.
      </Text>
      <Text style={styles.paragraph}>
        المحتوى المعروض (عقارات، بنوك، قروض) لأغراض إعلامية ولا يشكل عرضاً ملزماً. يرجى التحقق من التفاصيل مع الجهات المعنية.
      </Text>
      <Text style={styles.paragraph}>
        نحن نحتفظ بالحق في تحديث الشروط. استمرار الاستخدام بعد التحديث يعني موافقتك على التغييرات.
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
