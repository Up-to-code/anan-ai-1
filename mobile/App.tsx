import React, { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { I18nManager } from "react-native";
import { View, Text, ActivityIndicator } from "react-native";
// #region agent log
const DEBUG_INGEST = "http://127.0.0.1:7245/ingest/78cd20fc-b6ba-43f9-ac6b-c2cb1c79c3e3";
function debugLog(location: string, message: string, data?: Record<string, unknown>) {
  fetch(DEBUG_INGEST, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ location, message, data: data ?? {}, timestamp: Date.now() }) }).catch(() => {});
}
// #endregion
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

  useEffect(() => {
    debugLog("App.tsx:mount", "App mounted", { fontsLoaded: !!fontsLoaded, fontError: fontError?.message ?? null });
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    debugLog("App.tsx:state", "showing font loading", {});
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0a0a0f" }}>
        <ActivityIndicator size="large" color="#0B2C4B" />
        <Text style={{ color: "#a1a1aa", marginTop: 12 }}>جاري التحميل...</Text>
      </View>
    );
  }

  if (fontError) {
    debugLog("App.tsx:state", "font load error", { message: fontError?.message });
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0a0a0f", padding: 24 }}>
        <Text style={{ color: "#f87171", textAlign: "center" }}>فشل تحميل الخط. أعد تشغيل التطبيق.</Text>
      </View>
    );
  }

  debugLog("App.tsx:state", "rendering ConvexProvider tree", { convexUrl: (convex as any).origin ?? "n/a" });
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
