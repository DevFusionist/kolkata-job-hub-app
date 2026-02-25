import { useEffect, useState } from "react";
import { View } from "react-native";
import { Tabs, usePathname } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useTheme } from "../_contexts/ThemeContext";
import { useAuth } from "../_contexts/AuthContext";
import { useLanguage } from "../_contexts/LanguageContext";
import { FloatingAssistant } from "../_components/FloatingAssistant";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

const TAB_ICONS: Record<string, { focused: IoniconsName; default: IoniconsName }> = {
  index: { focused: "home", default: "home-outline" },
  search: { focused: "search", default: "search-outline" },
  "post-job": { focused: "add-circle", default: "add-circle-outline" },
  applications: { focused: "document-text", default: "document-text-outline" },
  messages: { focused: "chatbubbles", default: "chatbubbles-outline" },
  profile: { focused: "person", default: "person-outline" },
  protibha: { focused: "sparkles", default: "sparkles-outline" },
};

function tabIcon(name: string) {
  return ({ color, size, focused }: { color: string; size: number; focused: boolean }) => {
    const icons = TAB_ICONS[name] ?? TAB_ICONS.index;
    return <Ionicons name={focused ? icons.focused : icons.default} size={size} color={color} />;
  };
}

export default function TabLayout() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { user } = useAuth();
  const pathname = usePathname();
  const isSeeker = user?.role === "seeker";
  const isEmployer = user?.role === "employer";
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const hideFloating = pathname === "/protibha" || pathname === "/(tabs)/protibha";

  if (!mounted) {
    return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textMuted ?? "#8C7A6D",
          tabBarLabelStyle: {
            fontFamily: "Poppins_500Medium",
            fontSize: 11,
            marginTop: -2,
          },
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopWidth: 0,
            height: 68,
            paddingBottom: 10,
            paddingTop: 8,
            shadowColor: "#2D1B0E",
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.06,
            shadowRadius: 16,
            elevation: 8,
          },
          tabBarItemStyle: {
            borderRadius: 16,
            marginHorizontal: 2,
          },
        }}
      >
        <Tabs.Screen name="index" options={{ title: t("tabs.home"), tabBarLabel: t("tabs.home"), tabBarIcon: tabIcon("index") }} />
        <Tabs.Screen
          name="search"
          options={{ title: t("tabs.search"), tabBarLabel: t("tabs.search"), tabBarIcon: tabIcon("search"), href: isSeeker ? undefined : null }}
        />
        <Tabs.Screen
          name="post-job"
          options={{ title: t("tabs.postJob"), tabBarLabel: t("tabs.postJob"), tabBarIcon: tabIcon("post-job"), href: isEmployer ? undefined : null }}
        />
        <Tabs.Screen
          name="applications"
          options={{ title: t("tabs.applications"), tabBarLabel: t("tabs.applications"), tabBarIcon: tabIcon("applications"), href: isSeeker ? undefined : null }}
        />
        <Tabs.Screen name="messages" options={{ title: t("tabs.messages"), tabBarLabel: t("tabs.messages"), tabBarIcon: tabIcon("messages") }} />
        <Tabs.Screen name="profile" options={{ title: t("tabs.profile"), tabBarLabel: t("tabs.profile"), tabBarIcon: tabIcon("profile") }} />
        <Tabs.Screen name="protibha" options={{ title: t("protibha.title"), tabBarLabel: "AI", tabBarIcon: tabIcon("protibha"), href: null }} />
      </Tabs>
      {!hideFloating && <FloatingAssistant />}
    </View>
  );
}
