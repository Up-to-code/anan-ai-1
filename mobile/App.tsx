import React from "react";
import { StatusBar } from "expo-status-bar";
import { I18nManager } from "react-native";
import { View, Text, ActivityIndicator } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useFonts } from "@expo-google-fonts/cairo";
import {
  Cairo_400Regular,
  Cairo_500Medium,
  Cairo_700Bold,
} from "@expo-google-fonts/cairo";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import { convex } from "./src/convex";
import { authClient } from "./src/lib/auth-client";
import { RootNavigator } from "./src/navigation/RootNavigator";
import { ThemeProvider, useTheme } from "./src/contexts/ThemeContext";

// App is Arabic-only, default RTL.
I18nManager.allowRTL(true);
if (!I18nManager.isRTL) {
  I18nManager.forceRTL(true);
}

function ThemeAwareStatusBar() {
  const { theme } = useTheme();
  return <StatusBar style={theme === "dark" ? "light" : "dark"} />;
}

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Cairo_400Regular,
    Cairo_500Medium,
    Cairo_700Bold,
  });

  if (!fontsLoaded && !fontError) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0a0a0f" }}>
        <ActivityIndicator size="large" color="#0B2C4B" />
        <Text style={{ color: "#a1a1aa", marginTop: 12 }}>جاري التحميل...</Text>
      </View>
    );
  }

  if (fontError) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0a0a0f", padding: 24 }}>
        <Text style={{ color: "#f87171", textAlign: "center" }}>فشل تحميل الخط. أعد تشغيل التطبيق.</Text>
      </View>
    );
  }

  return (
    <ThemeProvider>
      <ThemeAwareStatusBar />
      <ConvexProvider client={convex}>
        <ConvexBetterAuthProvider client={convex} authClient={authClient}>
          <SafeAreaProvider>
            <NavigationContainer direction="rtl">
              <RootNavigator />
            </NavigationContainer>
          </SafeAreaProvider>
        </ConvexBetterAuthProvider>
      </ConvexProvider>
    </ThemeProvider>
  );
}
