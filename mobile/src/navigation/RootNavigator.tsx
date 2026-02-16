import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { TouchableOpacity } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useTheme } from "../contexts/ThemeContext";
import { getTheme } from "../theme";
import { ChatHomeScreen } from "../screens/ChatHomeScreen";
import { ChatThreadScreen } from "../screens/ChatThreadScreen";
import { ConversationsScreen } from "../screens/ConversationsScreen";
import { AuthScreen } from "../screens/AuthScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { SettingsScreen } from "../screens/SettingsScreen";
import { PrivacyScreen } from "../screens/PrivacyScreen";
import { TermsScreen } from "../screens/TermsScreen";
import { PropertyDetailScreen } from "../screens/PropertyDetailScreen";
import { PropertySearchScreen } from "../screens/PropertySearchScreen";
import { BankDetailScreen } from "../screens/BankDetailScreen";

export type RootStackParamList = {
  ChatHome: undefined;
  ChatThread: { threadId: string };
  Conversations: undefined;
  Auth: undefined;
  Profile: undefined;
  Settings: undefined;
  Privacy: undefined;
  Terms: undefined;
  PropertyDetail: {
    propertyId: string;
    threadId?: string;
    cachedProperty?: {
      title: string;
      address?: string;
      description?: string;
      price?: number;
      beds?: number;
      baths?: number;
      sqft?: number;
      location?: string;
      imageUrls?: string[];
      imageUrl?: string;
      propertyUrl?: string;
      features?: string[];
    };
  };
  PropertySearch: undefined;
  BankDetail: {
    bankId: string;
    bankName?: string;
    product?: string;
    rate?: number;
    maxAmount?: number;
    maxYears?: number;
  };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { theme: themeMode, toggleTheme } = useTheme();
  const theme = getTheme(themeMode);
  const { colors, spacing } = theme;

  return (
    <Stack.Navigator
      initialRouteName="ChatHome"
      screenOptions={({ navigation, route }) => {
        const showMenu =
          route.name === "ChatHome" || route.name === "ChatThread";
        const hitSlop = { top: 12, bottom: 12, left: 12, right: 12 };
        const headerBtnStyle = {
          minWidth: 44,
          minHeight: 44,
          justifyContent: "center" as const,
          alignItems: "center" as const,
        };
        return {
          headerStyle: { backgroundColor: colors.background, height: 48 },
          headerTintColor: colors.foreground,
          headerTitleStyle: {
            fontSize: theme.fontSize.lg,
            fontFamily: theme.fontFamily.bold,
          },
          contentStyle: { backgroundColor: colors.background },
          animation: "slide_from_left",
          headerLeft: showMenu
            ? () => (
                <TouchableOpacity
                  onPress={() => navigation.navigate("Conversations")}
                  style={[{ paddingHorizontal: spacing.sm }, headerBtnStyle]}
                  hitSlop={hitSlop}
                  accessibilityLabel="فتح قائمة المحادثات"
                  accessibilityRole="button"
                >
                  <Ionicons name="menu" size={24} color={colors.foreground} />
                </TouchableOpacity>
              )
            : undefined,
          headerRight: showMenu
            ? () => (
                <TouchableOpacity
                  onPress={toggleTheme}
                  style={[{ paddingHorizontal: spacing.sm }, headerBtnStyle]}
                  hitSlop={hitSlop}
                  accessibilityLabel={
                    themeMode === "dark"
                      ? "تفعيل الوضع الفاتح"
                      : "تفعيل الوضع الداكن"
                  }
                  accessibilityRole="button"
                >
                  <Ionicons
                    name={
                      themeMode === "dark" ? "moon-outline" : "sunny-outline"
                    }
                    size={22}
                    color={colors.foreground}
                  />
                </TouchableOpacity>
              )
            : undefined,
        };
      }}
    >
      <Stack.Screen
        name="ChatHome"
        component={ChatHomeScreen}
        options={{ title: "عنان" }}
      />
      <Stack.Screen
        name="ChatThread"
        component={ChatThreadScreen}
        options={{ title: "عنان" }}
      />
      <Stack.Screen
        name="Conversations"
        component={ConversationsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Auth"
        component={AuthScreen}
        options={{ title: "تسجيل الدخول" }}
      />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: "الملف الشخصي" }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: "الإعدادات" }}
      />
      <Stack.Screen
        name="Privacy"
        component={PrivacyScreen}
        options={{ title: "سياسة الخصوصية" }}
      />
      <Stack.Screen
        name="Terms"
        component={TermsScreen}
        options={{ title: "الشروط والأحكام" }}
      />
      <Stack.Screen
        name="PropertyDetail"
        component={PropertyDetailScreen}
        options={{ title: "تفاصيل العقار" }}
      />
      <Stack.Screen
        name="PropertySearch"
        component={PropertySearchScreen}
        options={{ title: "بحث" }}
      />
      <Stack.Screen
        name="BankDetail"
        component={BankDetailScreen}
        options={{ title: "تفاصيل البنك" }}
      />
    </Stack.Navigator>
  );
}
