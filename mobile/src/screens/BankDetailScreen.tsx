/**
 * BankDetailScreen - Displays bank loan details with loan calculator
 * Shows bank info, loan products, and calculates monthly payments
 */
import React, { useMemo, useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useThemedTheme, type ThemeTokens } from "../theme";
import type { RootStackParamList } from "../navigation/RootNavigator";

type BankDetailRoute = RouteProp<RootStackParamList, "BankDetail">;

export function BankDetailScreen() {
  const theme = useThemedTheme();
  const insets = useSafeAreaInsets();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<BankDetailRoute>();
  const { bankId, bankName, product, rate, maxAmount, maxYears } = route.params;

  const [loanAmount, setLoanAmount] = useState("");
  const [loanYears, setLoanYears] = useState("");

  const styles = useMemo(() => createStyles(theme, insets), [theme, insets]);

  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  // Calculate monthly payment using formula: M = P * [r(1+r)^n] / [(1+r)^n – 1]
  const calculation = useMemo(() => {
    const principal = parseFloat(loanAmount.replace(/[^0-9]/g, ""));
    const years = parseInt(loanYears, 10);
    const annualRate = rate ?? 5; // Default 5% if not provided
    const maxLoanYears = maxYears ?? 25;
    const maxLoanAmount = maxAmount ?? 5000000;

    if (!principal || !years || principal <= 0 || years <= 0) {
      return null;
    }

    const validYears = Math.min(years, maxLoanYears);
    const validPrincipal = Math.min(principal, maxLoanAmount);
    const monthlyRate = annualRate / 100 / 12;
    const numPayments = validYears * 12;

    const monthlyPayment =
      (validPrincipal * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
      (Math.pow(1 + monthlyRate, numPayments) - 1);

    const totalPayment = monthlyPayment * numPayments;
    const totalInterest = totalPayment - validPrincipal;

    return {
      monthlyPayment: Math.round(monthlyPayment),
      totalPayment: Math.round(totalPayment),
      totalInterest: Math.round(totalInterest),
      principal: validPrincipal,
      years: validYears,
      rate: annualRate,
    };
  }, [loanAmount, loanYears, rate, maxAmount, maxYears]);

  const formatCurrency = (value: number) => {
    return `${value.toLocaleString("ar-SA")} ر.س`;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
          <Ionicons
            name="arrow-forward"
            size={24}
            color={theme.colors.foreground}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{bankName || "تفاصيل البنك"}</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Bank Info Card */}
        <View style={styles.card}>
          <View style={styles.bankIconWrap}>
            <Ionicons name="business" size={32} color={theme.colors.primary} />
          </View>
          <Text style={styles.bankName}>{bankName || "البنك"}</Text>
          {product && <Text style={styles.productName}>{product}</Text>}

          <View style={styles.infoGrid}>
            {rate && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>نسبة الفائدة</Text>
                <Text style={styles.infoValue}>{rate}% سنوياً</Text>
              </View>
            )}
            {maxAmount && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>الحد الأقصى</Text>
                <Text style={styles.infoValue}>
                  {formatCurrency(maxAmount)}
                </Text>
              </View>
            )}
            {maxYears && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>الحد الأقصى للسنوات</Text>
                <Text style={styles.infoValue}>{maxYears} سنة</Text>
              </View>
            )}
          </View>
        </View>

        {/* Loan Calculator */}
        <View style={styles.calculatorCard}>
          <Text style={styles.sectionTitle}>حاسبة القرض</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>قيمة القرض (ر.س)</Text>
            <TextInput
              style={styles.input}
              value={loanAmount}
              onChangeText={(t) => setLoanAmount(t.replace(/[^0-9]/g, ""))}
              placeholder="مثال: 1000000"
              placeholderTextColor={theme.colors.mutedForeground}
              keyboardType="number-pad"
              textAlign="right"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>عدد السنوات</Text>
            <TextInput
              style={styles.input}
              value={loanYears}
              onChangeText={(t) => setLoanYears(t.replace(/[^0-9]/g, ""))}
              placeholder="مثال: 20"
              placeholderTextColor={theme.colors.mutedForeground}
              keyboardType="number-pad"
              textAlign="right"
            />
          </View>

          {calculation && (
            <View style={styles.resultCard}>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>القسط الشهري</Text>
                <Text style={styles.resultValue}>
                  {formatCurrency(calculation.monthlyPayment)}
                </Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>إجمالي السداد</Text>
                <Text style={styles.resultValue}>
                  {formatCurrency(calculation.totalPayment)}
                </Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>إجمالي الفائدة</Text>
                <Text style={styles.resultValue}>
                  {formatCurrency(calculation.totalInterest)}
                </Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>نسبة الفائدة</Text>
                <Text style={styles.resultValue}>{calculation.rate}%</Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function createStyles(theme: ThemeTokens, insets: { bottom: number }) {
  const { colors, radius, spacing, fontSize, fontFamily } = theme;
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: spacing.md,
      paddingTop: spacing.md,
      paddingBottom: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backBtn: {
      width: 44,
      height: 44,
      justifyContent: "center",
      alignItems: "center",
    },
    headerTitle: {
      flex: 1,
      fontSize: fontSize.lg,
      fontFamily: fontFamily.bold,
      color: colors.foreground,
      textAlign: "center",
      marginHorizontal: spacing.sm,
    },
    headerRight: {
      width: 44,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      padding: spacing.md,
      paddingBottom: spacing["2xl"],
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: radius.xl,
      padding: spacing.lg,
      marginBottom: spacing.lg,
      alignItems: "center",
    },
    bankIconWrap: {
      width: 64,
      height: 64,
      borderRadius: radius.full,
      backgroundColor: colors.primary + "20",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: spacing.md,
    },
    bankName: {
      fontSize: fontSize.xl,
      fontFamily: fontFamily.bold,
      color: colors.foreground,
      marginBottom: spacing.xs,
      textAlign: "center",
    },
    productName: {
      fontSize: fontSize.base,
      fontFamily: fontFamily.medium,
      color: colors.primary,
      marginBottom: spacing.md,
      textAlign: "center",
    },
    infoGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "center",
      gap: spacing.lg,
      marginTop: spacing.sm,
    },
    infoItem: {
      alignItems: "center",
      minWidth: 100,
    },
    infoLabel: {
      fontSize: fontSize.sm,
      color: colors.mutedForeground,
      fontFamily: fontFamily.regular,
      marginBottom: spacing.xs,
      textAlign: "center",
    },
    infoValue: {
      fontSize: fontSize.base,
      color: colors.foreground,
      fontFamily: fontFamily.bold,
      textAlign: "center",
    },
    calculatorCard: {
      backgroundColor: colors.card,
      borderRadius: radius.xl,
      padding: spacing.lg,
    },
    sectionTitle: {
      fontSize: fontSize.lg,
      fontFamily: fontFamily.bold,
      color: colors.foreground,
      marginBottom: spacing.lg,
      textAlign: "right",
    },
    inputGroup: {
      marginBottom: spacing.lg,
    },
    inputLabel: {
      fontSize: fontSize.base,
      color: colors.foreground,
      fontFamily: fontFamily.medium,
      marginBottom: spacing.sm,
      textAlign: "right",
    },
    input: {
      backgroundColor: colors.input,
      borderRadius: radius.lg,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      fontSize: fontSize.base,
      fontFamily: fontFamily.regular,
      color: colors.foreground,
      borderWidth: 1,
      borderColor: colors.border,
      textAlign: "right",
    },
    resultCard: {
      backgroundColor: colors.secondary,
      borderRadius: radius.lg,
      padding: spacing.md,
      marginTop: spacing.md,
    },
    resultRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    resultLabel: {
      fontSize: fontSize.base,
      color: colors.mutedForeground,
      fontFamily: fontFamily.regular,
    },
    resultValue: {
      fontSize: fontSize.base,
      color: colors.foreground,
      fontFamily: fontFamily.bold,
    },
  });
}
