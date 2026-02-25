import "../global.css";
import { useEffect } from "react";
import { View } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GluestackUIProvider } from "@gluestack-ui/themed";
import { config } from "@gluestack-ui/config";
import { OfflineBanner } from "./_components/OfflineBanner";
import { ErrorBoundary } from "./_components/ErrorBoundary";
import { useCrashReport } from "./_hooks/useCrashReport";
import { useLanguage } from "./_contexts/LanguageContext";
import * as SplashScreen from "expo-splash-screen";
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
} from "@expo-google-fonts/poppins";
import {
  HindSiliguri_400Regular,
  HindSiliguri_500Medium,
  HindSiliguri_600SemiBold,
} from "@expo-google-fonts/hind-siliguri";
import { AuthProvider } from "./_contexts/AuthContext";
import { ThemeProvider } from "./_contexts/ThemeContext";
import { LanguageProvider } from "./_contexts/LanguageContext";
import { SocketProvider } from "./_contexts/SocketContext";
import { AuthBackProvider } from "./_contexts/AuthBackContext";

const en = require("../locales/en.json");
const bn = require("../locales/bn.json");
const translations = { en, bn };

SplashScreen.preventAutoHideAsync();

function ErrorBoundaryWithReporting({ children }: { children: React.ReactNode }) {
  const { reportError } = useCrashReport();
  const { t } = useLanguage();
  return (
    <ErrorBoundary
      title={t("errorBoundary.title")}
      tryAgainLabel={t("errorBoundary.tryAgain")}
      onError={(error, errorInfo) =>
        reportError(error, { componentStack: errorInfo?.componentStack })
      }
    >
      {children}
    </ErrorBoundary>
  );
}

function RootLayoutNav() {
  return (
    <GluestackUIProvider config={config}>
      <View className="flex-1">
      <OfflineBanner />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="job-details" options={{ presentation: "modal" }} />
        <Stack.Screen name="chat" />
        <Stack.Screen name="edit-profile" />
        <Stack.Screen name="portfolio" />
        <Stack.Screen name="resume-builder" />
        <Stack.Screen name="ai-copilot" />
      </Stack>
      <StatusBar style="auto" />
      </View>
    </GluestackUIProvider>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    HindSiliguri_400Regular,
    HindSiliguri_500Medium,
    HindSiliguri_600SemiBold,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <ThemeProvider>
      <LanguageProvider translations={translations}>
        <AuthProvider>
          <AuthBackProvider>
            <SocketProvider>
              <ErrorBoundaryWithReporting>
                <RootLayoutNav />
              </ErrorBoundaryWithReporting>
            </SocketProvider>
          </AuthBackProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
