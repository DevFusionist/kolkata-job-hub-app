import { useState } from "react";
import { View, Text, ScrollView, Pressable, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Input, InputField } from "@gluestack-ui/themed";
import { useAuth } from "../_contexts/AuthContext";
import { useLanguage } from "../_contexts/LanguageContext";
import { useBilling } from "../_hooks/useBilling";
import { PaymentModal } from "../_components/PaymentModal";
import { ErrorBoundary } from "../_components/ErrorBoundary";
import { BlobShape } from "../_components/ui/BlobShape";
import { AnimatedPressable } from "../_components/ui/AnimatedPressable";
import { WarmButton } from "../_components/ui/WarmButton";
import { IllustrationPlaceholder } from "../_components/ui/IllustrationPlaceholder";
import { elevation } from "../_theme/tokens";
import { aiService } from "../_services/aiService";

function profileStrengthKey(score?: number): "strengthIncomplete" | "strengthFair" | "strengthGood" | "strengthStrong" {
  if (score == null) return "strengthIncomplete";
  if (score >= 80) return "strengthStrong";
  if (score >= 60) return "strengthGood";
  if (score >= 40) return "strengthFair";
  return "strengthIncomplete";
}

const strengthColor: Record<string, string> = {
  strengthIncomplete: "#E76F51",
  strengthFair: "#F4A261",
  strengthGood: "#E9C46A",
  strengthStrong: "#2A9D8F",
};

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useLanguage();
  const { user, logout } = useAuth();
  const { entitlements, refresh } = useBilling();
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [improveText, setImproveText] = useState("");
  const [extractedSkills, setExtractedSkills] = useState<string[]>([]);
  const [improveLoading, setImproveLoading] = useState(false);

  const handleLogout = () => {
    Alert.alert(t("profile.logout"), t("profile.logoutConfirm"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("profile.logout"),
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  const strengthKey = profileStrengthKey(user?.profileScore);
  const sColor = strengthColor[strengthKey] ?? "#E76F51";
  const strengthPercent = user?.profileScore ?? 20;

  const handleImproveWithAi = async () => {
    if (!improveText.trim()) return;
    setImproveLoading(true);
    setExtractedSkills([]);
    try {
      const { skills } = await aiService.analyzeExperience(improveText.trim());
      setExtractedSkills(skills ?? []);
    } catch (e: unknown) {
      Alert.alert(t("common.error"), (e as Error)?.message ?? t("common.error"));
    } finally {
      setImproveLoading(false);
    }
  };

  const menuItems = [
    { label: t("profile.editProfile"), route: "/edit-profile", emoji: "✏️", bg: "#FADAD2" },
    { label: t("profile.resume"), route: "/portfolio", emoji: "📄", bg: "#D4F0EC" },
    { label: t("profile.resumeBuilder"), route: "/resume-builder", emoji: "📝", bg: "#FDE8D0" },
    { label: t("profile.aiCopilot"), route: "/ai-copilot", emoji: "🤖", bg: "#FBF0D0" },
  ];

  return (
    <ErrorBoundary>
      <View style={{ flex: 1, backgroundColor: "#FFF8E7" }}>
        <BlobShape color="#E76F51" size={200} opacity={0.05} variant={1} style={{ top: -40, right: -50 }} />
        <BlobShape color="#2A9D8F" size={160} opacity={0.04} variant={3} style={{ bottom: 100, left: -40 }} />

        <ScrollView
          contentContainerStyle={{ paddingBottom: 100, paddingTop: insets.top }}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile header card */}
          <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
            <LinearGradient
              colors={["#2A9D8F", "#5BC0B5"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[elevation.warm, { borderRadius: 28, padding: 24, marginBottom: 16 }]}
            >
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 20,
                    backgroundColor: "rgba(255,255,255,0.25)",
                    justifyContent: "center",
                    alignItems: "center",
                    marginRight: 14,
                  }}
                >
                  <Text style={{ fontSize: 24, fontFamily: "Poppins_600SemiBold", color: "#FFFFFF" }}>
                    {(user?.name ?? "U")[0].toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 20, fontFamily: "Poppins_600SemiBold", color: "#FFFFFF" }}>
                    {user?.name ?? t("profile.user")}
                  </Text>
                  <Text style={{ fontSize: 13, fontFamily: "Poppins_400Regular", color: "rgba(255,255,255,0.8)", marginTop: 2 }}>
                    {user?.role === "seeker" ? t("profile.jobSeeker") : t("profile.employer")}
                    {user?.location ? ` · ${user.location}` : ""}
                  </Text>
                </View>
              </View>

              {/* Strength bar */}
              <View style={{ marginTop: 4 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
                  <Text style={{ fontSize: 12, fontFamily: "Poppins_500Medium", color: "rgba(255,255,255,0.8)" }}>
                    {t("profile.profileStrength")}
                  </Text>
                  <Text style={{ fontSize: 12, fontFamily: "Poppins_600SemiBold", color: "#FFFFFF" }}>
                    {t(`profile.${strengthKey}`)}
                  </Text>
                </View>
                <View style={{ height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.25)" }}>
                  <View style={{ height: 6, borderRadius: 3, backgroundColor: "#FFFFFF", width: `${strengthPercent}%` }} />
                </View>
              </View>

              {/* Credits */}
              {(entitlements || user) && (
                <View style={{ flexDirection: "row", gap: 12, marginTop: 16 }}>
                  <View style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 14, padding: 12 }}>
                    <Text style={{ fontSize: 20, fontFamily: "Poppins_600SemiBold", color: "#FFFFFF" }}>
                      {entitlements?.jobCreditsRemaining ?? user?.freeJobsRemaining ?? 0}
                    </Text>
                    <Text style={{ fontSize: 11, fontFamily: "Poppins_400Regular", color: "rgba(255,255,255,0.7)" }}>Job credits</Text>
                  </View>
                  {entitlements?.aiCreditsRemaining != null && (
                    <View style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 14, padding: 12 }}>
                      <Text style={{ fontSize: 20, fontFamily: "Poppins_600SemiBold", color: "#FFFFFF" }}>
                        {entitlements.aiCreditsRemaining}
                      </Text>
                      <Text style={{ fontSize: 11, fontFamily: "Poppins_400Regular", color: "rgba(255,255,255,0.7)" }}>AI credits</Text>
                    </View>
                  )}
                </View>
              )}
            </LinearGradient>
          </View>

          {/* Buy credits */}
          <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
            <WarmButton
              label="Buy credits / subscription"
              onPress={() => setPaymentModalVisible(true)}
              variant="coral"
              size="lg"
              fullWidth
            />
          </View>

          {/* AI improve card */}
          <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
            <View style={[elevation.card, { backgroundColor: "#FFFFFF", borderRadius: 24, padding: 20 }]}>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
                <Text style={{ fontSize: 20, marginRight: 8 }}>✨</Text>
                <Text style={{ fontSize: 16, fontFamily: "Poppins_600SemiBold", color: "#2D1B0E" }}>
                  Improve with AI
                </Text>
              </View>
              <Text style={{ fontSize: 12, fontFamily: "Poppins_400Regular", color: "#8C7A6D", marginBottom: 12, lineHeight: 18 }}>
                Paste your experience text to extract skills for your profile.
              </Text>
              <View
                style={{
                  backgroundColor: "#FFF5E6",
                  borderRadius: 16,
                  paddingHorizontal: 14,
                  paddingVertical: 4,
                  borderWidth: 1.5,
                  borderColor: "#E8DDD0",
                  marginBottom: 12,
                  minHeight: 80,
                }}
              >
                <Input variant="underlined" size="md" style={{ borderBottomWidth: 0 }}>
                  <InputField
                    placeholder={t("profile.improvePlaceholder")}
                    value={improveText}
                    onChangeText={setImproveText}
                    multiline
                    style={{ fontFamily: "Poppins_400Regular", fontSize: 14, color: "#2D1B0E" }}
                  />
                </Input>
              </View>
              <WarmButton
                label={improveLoading ? "..." : t("profile.extractSkills")}
                onPress={handleImproveWithAi}
                disabled={improveLoading || !improveText.trim()}
                variant="mustard"
                size="sm"
              />
              {extractedSkills.length > 0 && (
                <View style={{ marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: "#E8DDD0" }}>
                  <Text style={{ fontSize: 12, fontFamily: "Poppins_500Medium", color: "#8C7A6D", marginBottom: 8 }}>
                    Extracted skills
                  </Text>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                    {extractedSkills.map((skill) => (
                      <View key={skill} style={{ backgroundColor: "#D4F0EC", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14 }}>
                        <Text style={{ fontSize: 12, fontFamily: "Poppins_500Medium", color: "#1E7A6F" }}>{skill}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Menu items */}
          <View style={{ paddingHorizontal: 20, gap: 10, marginBottom: 16 }}>
            {menuItems.map((item) => (
              <AnimatedPressable
                key={item.route}
                onPress={() => router.push(item.route as any)}
              >
                <View
                  style={[
                    elevation.soft,
                    {
                      backgroundColor: "#FFFFFF",
                      borderRadius: 20,
                      padding: 16,
                      flexDirection: "row",
                      alignItems: "center",
                    },
                  ]}
                >
                  <View
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 14,
                      backgroundColor: item.bg,
                      justifyContent: "center",
                      alignItems: "center",
                      marginRight: 14,
                    }}
                  >
                    <Text style={{ fontSize: 18 }}>{item.emoji}</Text>
                  </View>
                  <Text style={{ fontSize: 15, fontFamily: "Poppins_500Medium", color: "#2D1B0E", flex: 1 }}>
                    {item.label}
                  </Text>
                  <Text style={{ fontSize: 16, color: "#D4C4B0" }}>›</Text>
                </View>
              </AnimatedPressable>
            ))}
          </View>

          {/* Logout */}
          <View style={{ paddingHorizontal: 20, marginTop: 8 }}>
            <AnimatedPressable onPress={handleLogout}>
              <View
                style={{
                  borderWidth: 1.5,
                  borderColor: "#E76F51",
                  borderRadius: 20,
                  padding: 16,
                  alignItems: "center",
                }}
              >
                <Text style={{ fontSize: 15, fontFamily: "Poppins_600SemiBold", color: "#E76F51" }}>
                  {t("profile.logout")}
                </Text>
              </View>
            </AnimatedPressable>
          </View>
        </ScrollView>

        <PaymentModal
          visible={paymentModalVisible}
          onClose={() => setPaymentModalVisible(false)}
          onSuccess={refresh}
        />
      </View>
    </ErrorBoundary>
  );
}
