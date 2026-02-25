import { View, Text, RefreshControl, ActivityIndicator } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLanguage } from "../_contexts/LanguageContext";
import { useTheme } from "../_contexts/ThemeContext";
import { useApplications } from "../_hooks/useApplications";
import { EmptyState } from "../_components/EmptyState";
import { BlobShape } from "../_components/ui/BlobShape";
import { AnimatedPressable } from "../_components/ui/AnimatedPressable";
import { elevation } from "../_theme/tokens";

const statusColors: Record<string, { bg: string; text: string; dot: string }> = {
  pending: { bg: "#FBF0D0", text: "#D4AD4A", dot: "#E9C46A" },
  reviewed: { bg: "#D4F0EC", text: "#1E7A6F", dot: "#2A9D8F" },
  accepted: { bg: "#D4F0EC", text: "#1E7A6F", dot: "#2A9D8F" },
  rejected: { bg: "#FADAD2", text: "#C95A3F", dot: "#E76F51" },
};

export default function ApplicationsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useLanguage();
  const { colors } = useTheme();
  const { applications, loading, refreshing, refresh } = useApplications();

  const renderItem = ({ item }: { item: { id: string; job?: { title?: string }; jobId: string; status: string } }) => {
    const sc = statusColors[item.status] ?? statusColors.pending;
    return (
      <AnimatedPressable
        onPress={() => router.push({ pathname: "/job-details", params: { id: item.jobId } })}
        style={{ marginBottom: 12 }}
      >
        <View
          style={[
            elevation.card,
            {
              backgroundColor: "#FFFFFF",
              borderRadius: 20,
              padding: 18,
            },
          ]}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View
              style={{
                width: 42,
                height: 42,
                borderRadius: 14,
                backgroundColor: "#FDE8D0",
                justifyContent: "center",
                alignItems: "center",
                marginRight: 12,
              }}
            >
              <Text style={{ fontSize: 20 }}>📄</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontFamily: "Poppins_600SemiBold", color: "#2D1B0E" }} numberOfLines={1}>
                {item.job?.title ?? t("job.jobFallback")}
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center", marginTop: 6 }}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: sc.bg,
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 12,
                    gap: 5,
                  }}
                >
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: sc.dot }} />
                  <Text style={{ fontSize: 11, fontFamily: "Poppins_600SemiBold", color: sc.text, textTransform: "capitalize" }}>
                    {item.status}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </AnimatedPressable>
    );
  };

  if (loading && applications.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#FFF8E7", paddingTop: insets.top }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#FFF8E7", paddingTop: insets.top }}>
      <BlobShape color="#F4A261" size={160} opacity={0.06} variant={4} style={{ top: -20, left: -40 }} />

      <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4 }}>
        <Text style={{ fontSize: 24, fontFamily: "Poppins_600SemiBold", color: "#2D1B0E" }}>
          {t("applications.title")}
        </Text>
        <Text style={{ fontSize: 13, fontFamily: "Poppins_400Regular", color: "#8C7A6D", marginTop: 4 }}>
          Track your job applications
        </Text>
      </View>

      <FlashList
        data={applications}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        estimatedItemSize={88}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100, paddingTop: 8 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          <EmptyState message={t("applications.noApplications")} scene="empty" subtitle="Start applying to jobs you love!" />
        }
      />
    </View>
  );
}
