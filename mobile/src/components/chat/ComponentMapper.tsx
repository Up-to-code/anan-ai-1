/**
 * ComponentMapper - Maps message types to appropriate UI components
 * Handles property cards, bank cards, and their lists with navigation and delete
 */
import React from "react";
import { View, Text } from "react-native";
import { PropertyCard, type PropertyCardData } from "./PropertyCard";
import { PropertyList } from "./PropertyList";
import { BankCard, type BankCardData } from "./BankCard";
import { BankList } from "./BankList";
import type { ComponentType } from "../../lib/chat-types";
import type { ThemeTokens } from "../../theme";

interface ComponentMapperProps {
  type: ComponentType;
  data: unknown;
  theme: ThemeTokens;
  onPropertyPress?: (property: PropertyCardData) => void;
  onPropertyDelete?: (property: PropertyCardData) => void;
  onBankPress?: (bank: BankCardData) => void;
  onBankDelete?: (bank: BankCardData) => void;
}

export function ComponentMapper({
  type,
  data,
  theme,
  onPropertyPress,
  onPropertyDelete,
  onBankPress,
  onBankDelete,
}: ComponentMapperProps): React.ReactNode {
  try {
    switch (type) {
      case "property":
        return (
          <PropertyCard
            property={data as PropertyCardData}
            theme={theme}
            onPress={onPropertyPress}
            onDelete={onPropertyDelete}
          />
        );
      case "property-list":
        return (
          <PropertyList
            properties={(Array.isArray(data) ? data : []) as PropertyCardData[]}
            theme={theme}
            onPropertyPress={onPropertyPress}
            onPropertyDelete={onPropertyDelete}
          />
        );
      case "bank":
        return (
          <BankCard
            bank={data as BankCardData}
            theme={theme}
            onPress={
              onBankPress ? () => onBankPress(data as BankCardData) : undefined
            }
            onDelete={onBankDelete}
          />
        );
      case "bank-list":
        return (
          <BankList
            banks={(Array.isArray(data) ? data : []) as BankCardData[]}
            theme={theme}
            onBankPress={onBankPress}
            onBankDelete={onBankDelete}
          />
        );
      case "text":
      default:
        return null;
    }
  } catch {
    return (
      <View style={{ padding: 8 }}>
        <Text style={{ fontSize: 14, color: theme.colors.mutedForeground }}>
          عرض غير متاح
        </Text>
      </View>
    );
  }
}
