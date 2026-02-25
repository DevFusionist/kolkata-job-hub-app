import { useState } from "react";
import { View, Text, ScrollView, ActivityIndicator, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useJobDetails } from "./_hooks/useJobDetails";
import { useAuth } from "./_contexts/AuthContext";
import { useLanguage } from "./_contexts/LanguageContext";
import { useTheme } from "./_contexts/ThemeContext";
import { applicationService } from "./_services/applicationService";
import { formatRelative } from "./_lib/date";
import { BlobShape } from "./_components/ui/BlobShape";
import { WarmButton } from "./_components/ui/WarmButton";
import { IllustrationPlaceholder } from "./_components/ui/IllustrationPlaceholder";
import { elevation } from "./_theme/tokens";

export default function JobDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useLanguage();
  const { colors } = useTheme();
  const { user } = useAuth();
  const { job, loading, refresh } = useJobDetails(id);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);

  const handleApply = async () => {
    if (!job || !user?.id) return;
    setApplying(true);
    try {
      await applicationService.apply(job.id, user.id);
      setApplied(true);
      Alert.alert(t("common.done"), t("job.applySuccess"));
    } catch (e: unknown) {
      Alert.alert(t("common.error"), (e as Error)?.message ?? t("job.applyFailed"));
    } finally {
      setApplying(false);
    }
  };

  const handleMessage = () => {
    if (!job?.employerId) return;
    router.push({ pathname: "/chat", params: { userId: job.employerId } });
  };

  if (loading || !job) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#FFF8E7", paddingTop: insets.top }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#FFF8E7" }}>
      <BlobShape color="#F4A261" size={180} opacity={0.06} variant={2} style={{ top: -30, right: -50 }} />

      <ScrollView
        contentContainerStyle={{ paddingBottom: 40, paddingTop: insets.top }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <LinearGradient
          colors={["#E76F51", "#F4A261"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ marginHorizontal: 20, borderRadius: 28, padding: 24, marginTop: 16, marginBottom: 20 }}
        >
          <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
            <View
              style={{
                width: 52,
                height: 52,
                borderRadius: 18,
                backgroundColor: "rgba(255,255,255,0.25)",
                justifyContent: "center",
                alignItems: "center",
                marginRight: 16,
              }}
            >
              <Text style={{ fontSize: 24 }}>💼</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 22, fontFamily: "Poppins_600SemiBold", color: "#FFFFFF" }}>
                {job.title}
              </Text>
              <Text style={{ fontSize: 13, fontFamily: "Poppins_400Regular", color: "rgba(255,255,255,0.85)", marginTop: 4 }}>
                📍 {job.location} · {formatRelative(job.createdAt)}
              </Text>
            </View>
          </View>
          <View
            style={{
              flexDirection: "row",
              marginTop: 16,
              backgroundColor: "rgba(255,255,255,0.2)",
              borderRadius: 16,
              padding: 14,
              gap: 4,
            }}
          >
            <Text style={{ fontSize: 22, fontFamily: "Poppins_600SemiBold", color: "#FFFFFF" }}>
              ₹{job.salaryMin} – ₹{job.salaryMax}
            </Text>
            <Text style={{ fontSize: 12, fontFamily: "Poppins_400Regular", color: "rgba(255,255,255,0.7)", alignSelf: "flex-end", marginBottom: 2 }}>
              /month
            </Text>
          </View>
        </LinearGradient>

        {/* Details */}
        <View style={{ paddingHorizontal: 20 }}>
          <View style={[elevation.card, { backgroundColor: "#FFFFFF", borderRadius: 24, padding: 20, marginBottom: 16 }]}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
              <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: "#D4F0EC", justifyContent: "center", alignItems: "center", marginRight: 10 }}>
                <Text style={{ fontSize: 14 }}>📋</Text>
              </View>
              <Text style={{ fontSize: 17, fontFamily: "Poppins_600SemiBold", color: "#2D1B0E" }}>Description</Text>
            </View>
            <Text style={{ fontSize: 14, fontFamily: "Poppins_400Regular", color: "#5C4A3D", lineHeight: 22 }}>
              {job.description}
            </Text>
          </View>

          <View style={[elevation.card, { backgroundColor: "#FFFFFF", borderRadius: 24, padding: 20, marginBottom: 24 }]}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
              <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: "#FBF0D0", justifyContent: "center", alignItems: "center", marginRight: 10 }}>
                <Text style={{ fontSize: 14 }}>🏷️</Text>
              </View>
              <Text style={{ fontSize: 17, fontFamily: "Poppins_600SemiBold", color: "#2D1B0E" }}>Category</Text>
            </View>
            <View style={{ backgroundColor: "#FBF0D0", alignSelf: "flex-start", paddingHorizontal: 14, paddingVertical: 6, borderRadius: 14 }}>
              <Text style={{ fontSize: 13, fontFamily: "Poppins_600SemiBold", color: "#D4AD4A", textTransform: "capitalize" }}>
                {job.category}
              </Text>
            </View>
          </View>

          {/* CTA */}
          {user?.role === "seeker" && (
            <View style={{ gap: 12 }}>
              {!applied ? (
                <WarmButton label={applying ? "..." : t("job.apply")} onPress={handleApply} disabled={applying} size="lg" fullWidth variant="coral" />
              ) : (
                <View
                  style={{
                    backgroundColor: "#D4F0EC",
                    borderRadius: 20,
                    padding: 16,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ fontSize: 15, fontFamily: "Poppins_600SemiBold", color: "#2A9D8F" }}>
                    ✓ {t("job.applied")}
                  </Text>
                </View>
              )}
              <WarmButton label={t("job.messageEmployer")} onPress={handleMessage} variant="outline" size="lg" fullWidth />
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
