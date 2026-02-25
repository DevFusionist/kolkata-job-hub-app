import { useEffect, useState } from "react";
import { View, Text, ScrollView, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { portfolioService } from "./_services/portfolioService";
import { useAuth } from "./_contexts/AuthContext";
import { useLanguage } from "./_contexts/LanguageContext";
import { BlobShape } from "./_components/ui/BlobShape";
import { IllustrationPlaceholder } from "./_components/ui/IllustrationPlaceholder";
import { elevation } from "./_theme/tokens";

export default function PortfolioScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { user } = useAuth();
  const [portfolio, setPortfolio] = useState<{ experience?: string; skills?: string[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await portfolioService.getBySeeker(user.id);
        if (!cancelled) setPortfolio(data);
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#FFF8E7", paddingTop: insets.top }}>
        <ActivityIndicator size="large" color="#E76F51" />
      </View>
    );
  }

  const skills = portfolio?.skills ?? user?.skills ?? [];
  const experience = portfolio?.experience ?? user?.experience;

  return (
    <View style={{ flex: 1, backgroundColor: "#FFF8E7" }}>
      <BlobShape color="#E9C46A" size={200} opacity={0.06} variant={1} style={{ top: -40, left: -50 }} />
      <BlobShape color="#E76F51" size={160} opacity={0.04} variant={4} style={{ bottom: 40, right: -40 }} />

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingTop: insets.top + 16, paddingBottom: 40 }}
      >
        <View style={{ alignItems: "center", marginBottom: 16 }}>
          <IllustrationPlaceholder scene="resume" size={140} />
        </View>

        <Text style={{ fontSize: 26, fontFamily: "Poppins_600SemiBold", color: "#2D1B0E", textAlign: "center", marginBottom: 24 }}>
          {t("portfolio.title")}
        </Text>

        {/* Experience */}
        <View style={[elevation.card, { backgroundColor: "#FFFFFF", borderRadius: 24, padding: 20, marginBottom: 16 }]}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
            <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: "#D4F0EC", justifyContent: "center", alignItems: "center", marginRight: 10 }}>
              <Text style={{ fontSize: 16 }}>💼</Text>
            </View>
            <Text style={{ fontSize: 17, fontFamily: "Poppins_600SemiBold", color: "#2D1B0E" }}>
              {t("portfolio.experienceTitle")}
            </Text>
          </View>
          <Text style={{ fontSize: 14, fontFamily: "Poppins_400Regular", color: "#5C4A3D", lineHeight: 22 }}>
            {experience ?? t("portfolio.noExperience")}
          </Text>
        </View>

        {/* Skills */}
        <View style={[elevation.card, { backgroundColor: "#FFFFFF", borderRadius: 24, padding: 20 }]}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
            <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: "#FDE8D0", justifyContent: "center", alignItems: "center", marginRight: 10 }}>
              <Text style={{ fontSize: 16 }}>⚡</Text>
            </View>
            <Text style={{ fontSize: 17, fontFamily: "Poppins_600SemiBold", color: "#2D1B0E" }}>
              {t("portfolio.skillsTitle")}
            </Text>
          </View>
          {skills.length > 0 ? (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {skills.map((skill: string) => (
                <View key={skill} style={{ backgroundColor: "#FBF0D0", paddingHorizontal: 14, paddingVertical: 7, borderRadius: 14 }}>
                  <Text style={{ fontSize: 13, fontFamily: "Poppins_500Medium", color: "#D4AD4A" }}>{skill}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={{ fontSize: 14, fontFamily: "Poppins_400Regular", color: "#8C7A6D" }}>
              {t("portfolio.noSkills")}
            </Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
