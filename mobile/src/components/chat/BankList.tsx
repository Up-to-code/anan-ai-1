/**
 * BankList - Renders a list of bank cards with optional delete
 */
import React from "react";
import { View } from "react-native";
import { BankCard, type BankCardData } from "./BankCard";
import type { ThemeTokens } from "../../theme";

interface BankListProps {
  banks: BankCardData[] | BankCardData;
  theme: ThemeTokens;
  onBankPress?: (bank: BankCardData) => void;
  onBankDelete?: (bank: BankCardData) => void;
}

export function BankList({
  banks,
  theme,
  onBankPress,
  onBankDelete,
}: BankListProps) {
  const list = Array.isArray(banks) ? banks : [banks];
  if (list.length === 0) return null;
  return (
    <View style={{ gap: 8 }}>
      {list.map((b, i) => (
        <BankCard
          key={i}
          bank={b}
          theme={theme}
          onPress={onBankPress ? () => onBankPress(b) : undefined}
          onDelete={onBankDelete}
        />
      ))}
    </View>
  );
}
