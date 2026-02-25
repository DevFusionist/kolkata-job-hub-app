import { useState } from "react";
import { View, Text, ScrollView, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { aiService } from "./_services/aiService";
import { useAuth } from "./_contexts/AuthContext";
import { useLanguage } from "./_contexts/LanguageContext";
import { ErrorBoundary } from "./_components/ErrorBoundary";
import { BlobShape } from "./_components/ui/BlobShape";
import { KormoMascot } from "./_components/ui/KormoMascot";
import { WarmButton } from "./_components/ui/WarmButton";
import { elevation } from "./_theme/tokens";

export default function AICopilotScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { user } = useAuth();

  const [step, setStep] = useState(1);
  const [audit, setAudit] = useState<{
    profileScore?: number;
    hireScore?: number;
    strengths?: string[];
    weaknesses?: string[];
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const runAudit = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const data = await aiService.runCopilotAudit(user.id);
      setAudit(data ?? null);
      setStep(2);
    } catch (e: unknown) {
      Alert.alert(t("common.error"), (e as Error)?.message ?? t("copilot.auditFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ErrorBoundary>
      <View style={{ flex: 1, backgroundColor: "#FFF8E7" }}>
        <BlobShape color="#E76F51" size={220} opacity={0.05} variant={1} style={{ top: -50, right: -50 }} />
        <BlobShape color="#E9C46A" size={180} opacity={0.06} variant={2} style={{ bottom: 40, left: -40 }} />

        <ScrollView
          contentContainerStyle={{ padding: 20, paddingTop: insets.top + 16, paddingBottom: 40 }}
        >
          {step === 1 && (
            <>
              <View style={{ alignItems: "center", marginBottom: 20 }}>
                <KormoMascot size={120} mood="working" />
              </View>

              <Text style={{ fontSize: 28, fontFamily: "Poppins_600SemiBold", color: "#2D1B0E", textAlign: "center", marginBottom: 6 }}>
                {t("copilot.title")}
              </Text>
              <Text style={{ fontSize: 14, fontFamily: "Poppins_400Regular", color: "#8C7A6D", textAlign: "center", lineHeight: 22, marginBottom: 32, paddingHorizontal: 20 }}>
                {t("copilot.subtitle")}
              </Text>

              <WarmButton label={loading ? "Analyzing..." : t("copilot.runAudit")} onPress={runAudit} disabled={loading} size="lg" fullWidth variant="teal" />
            </>
          )}

          {step === 2 && audit && (
            <>
              <View style={{ alignItems: "center", marginBottom: 20 }}>
                <KormoMascot size={100} mood="celebrating" />
              </View>

              <Text style={{ fontSize: 22, fontFamily: "Poppins_600SemiBold", color: "#2D1B0E", textAlign: "center", marginBottom: 20 }}>
                Your Profile Audit
              </Text>

              {/* Score cards */}
              <View style={{ flexDirection: "row", gap: 12, marginBottom: 20 }}>
                {audit.profileScore != null && (
                  <View style={{ flex: 1 }}>
                    <LinearGradient
                      colors={["#E76F51", "#F4A261"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={[elevation.warm, { borderRadius: 24, padding: 20, alignItems: "center" }]}
                    >
                      <Text style={{ fontSize: 36, fontFamily: "Poppins_600SemiBold", color: "#FFFFFF" }}>
                        {audit.profileScore}
                      </Text>
                      <Text style={{ fontSize: 12, fontFamily: "Poppins_500Medium", color: "rgba(255,255,255,0.8)", marginTop: 2 }}>
                        Profile Score
                      </Text>
                    </LinearGradient>
                  </View>
                )}
                {audit.hireScore != null && (
                  <View style={{ flex: 1 }}>
                    <LinearGradient
                      colors={["#2A9D8F", "#5BC0B5"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={[elevation.warm, { borderRadius: 24, padding: 20, alignItems: "center" }]}
                    >
                      <Text style={{ fontSize: 36, fontFamily: "Poppins_600SemiBold", color: "#FFFFFF" }}>
                        {audit.hireScore}
                      </Text>
                      <Text style={{ fontSize: 12, fontFamily: "Poppins_500Medium", color: "rgba(255,255,255,0.8)", marginTop: 2 }}>
                        Hire Score
                      </Text>
                    </LinearGradient>
                  </View>
                )}
              </View>

              {/* Strengths */}
              {(audit.strengths?.length ?? 0) > 0 && (
                <View style={[elevation.card, { backgroundColor: "#FFFFFF", borderRadius: 24, padding: 20, marginBottom: 16 }]}>
                  <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
                    <Text style={{ fontSize: 18, marginRight: 8 }}>💪</Text>
                    <Text style={{ fontSize: 17, fontFamily: "Poppins_600SemiBold", color: "#2D1B0E" }}>
                      Strengths
                    </Text>
                  </View>
                  {audit.strengths!.map((s, i) => (
                    <View key={i} style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: 8 }}>
                      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#2A9D8F", marginTop: 7, marginRight: 10 }} />
                      <Text style={{ fontSize: 14, fontFamily: "Poppins_400Regular", color: "#5C4A3D", flex: 1, lineHeight: 20 }}>
                        {s}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Weaknesses */}
              {(audit.weaknesses?.length ?? 0) > 0 && (
                <View style={[elevation.card, { backgroundColor: "#FFFFFF", borderRadius: 24, padding: 20, marginBottom: 20 }]}>
                  <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
                    <Text style={{ fontSize: 18, marginRight: 8 }}>🎯</Text>
                    <Text style={{ fontSize: 17, fontFamily: "Poppins_600SemiBold", color: "#2D1B0E" }}>
                      Areas to improve
                    </Text>
                  </View>
                  {audit.weaknesses!.map((w, i) => (
                    <View key={i} style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: 8 }}>
                      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#E76F51", marginTop: 7, marginRight: 10 }} />
                      <Text style={{ fontSize: 14, fontFamily: "Poppins_400Regular", color: "#5C4A3D", flex: 1, lineHeight: 20 }}>
                        {w}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              <WarmButton label="Run again" onPress={runAudit} disabled={loading} variant="outline" size="md" fullWidth />
            </>
          )}
        </ScrollView>
      </View>
    </ErrorBoundary>
  );
}
