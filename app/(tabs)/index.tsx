import { View, Text, RefreshControl, ActivityIndicator } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../_contexts/AuthContext";
import { useLanguage } from "../_contexts/LanguageContext";
import { useTheme } from "../_contexts/ThemeContext";
import { useJobs } from "../_hooks/useJobs";
import { EmptyState } from "../_components/EmptyState";
import { BlobShape } from "../_components/ui/BlobShape";
import { AnimatedPressable } from "../_components/ui/AnimatedPressable";
import { elevation } from "../_theme/tokens";
import type { Job } from "../_types";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useLanguage();
  const { colors } = useTheme();
  const { user } = useAuth();
  const { jobs, loading, refreshing, refresh } = useJobs({ recommended: true });

  const renderItem = ({ item }: { item: Job }) => (
    <AnimatedPressable
      onPress={() => router.push({ pathname: "/job-details", params: { id: item.id } })}
      style={{ marginBottom: 12 }}
    >
      <View
        style={[
          elevation.card,
          {
            backgroundColor: "#FFFFFF",
            borderRadius: 20,
            padding: 18,
            borderLeftWidth: 4,
            borderLeftColor: "#E76F51",
          },
        ]}
      >
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 14,
              backgroundColor: "#FADAD2",
              justifyContent: "center",
              alignItems: "center",
              marginRight: 12,
            }}
          >
            <Text style={{ fontSize: 18 }}>💼</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontFamily: "Poppins_600SemiBold", color: "#2D1B0E" }} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={{ fontSize: 12, fontFamily: "Poppins_400Regular", color: "#8C7A6D", marginTop: 2 }}>
              📍 {item.location} · ₹{item.salaryMin}–{item.salaryMax}
            </Text>
          </View>
        </View>
        <Text style={{ fontSize: 13, fontFamily: "Poppins_400Regular", color: "#5C4A3D", lineHeight: 20 }} numberOfLines={2}>
          {item.description}
        </Text>
      </View>
    </AnimatedPressable>
  );

  if (loading && jobs.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#FFF8E7", paddingTop: insets.top }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#FFF8E7", paddingTop: insets.top }}>
      <BlobShape color="#E76F51" size={180} opacity={0.05} variant={1} style={{ top: -30, right: -40 }} />

      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 }}>
        <LinearGradient
          colors={["#E76F51", "#F4A261"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ borderRadius: 20, padding: 20, marginBottom: 8 }}
        >
          <Text style={{ fontSize: 11, fontFamily: "Poppins_600SemiBold", color: "rgba(255,255,255,0.8)", letterSpacing: 1.5, textTransform: "uppercase" }}>
            {t("common.appName")} · {t("common.appTagline")}
          </Text>
          <Text style={{ fontSize: 24, fontFamily: "Poppins_600SemiBold", color: "#FFFFFF", marginTop: 6 }}>
            {user?.role === "employer" ? t("home.myPostings") : t("home.title")}
          </Text>
          <Text style={{ fontSize: 13, fontFamily: "Poppins_400Regular", color: "rgba(255,255,255,0.85)", marginTop: 4 }}>
            {user?.role === "employer" ? t("home.myPostingsSubtitle") : t("home.recentJobs")}
          </Text>
        </LinearGradient>
      </View>

      <FlashList
        data={jobs}
        keyExtractor={(item: Job) => item.id}
        renderItem={renderItem}
        estimatedItemSize={120}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          <EmptyState message={t("home.noJobs")} scene="job-search" subtitle="New opportunities are added daily!" />
        }
      />
    </View>
  );
}
