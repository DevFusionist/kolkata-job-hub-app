import { useState } from "react";
import { View, Text, ScrollView, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Input, InputField } from "@gluestack-ui/themed";
import { LinearGradient } from "expo-linear-gradient";
import { aiService } from "./_services/aiService";
import { useAuth } from "./_contexts/AuthContext";
import { useLanguage } from "./_contexts/LanguageContext";
import { ErrorBoundary } from "./_components/ErrorBoundary";
import { BlobShape } from "./_components/ui/BlobShape";
import { WarmButton } from "./_components/ui/WarmButton";
import { IllustrationPlaceholder } from "./_components/ui/IllustrationPlaceholder";
import { elevation } from "./_theme/tokens";

type Step = 1 | 2 | 3;

export default function ResumeBuilderScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { user } = useAuth();

  const [step, setStep] = useState<Step>(1);
  const [experience, setExperience] = useState(user?.experience ?? "");
  const [education, setEducation] = useState("");
  const [additional, setAdditional] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const result = await aiService.generateResume({
        userId: user.id,
        experience: experience.trim(),
        education: education.trim(),
      });
      if (result?.url) {
        setGeneratedUrl(result.url);
        Alert.alert(t("common.done"), t("resume.generateSuccess"));
      } else {
        Alert.alert(t("common.done"), t("resume.generateDone"));
      }
    } catch (e: unknown) {
      Alert.alert(t("common.error"), (e as Error)?.message ?? t("resume.generateFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = () => {
    setGeneratedUrl(null);
    handleGenerate();
  };

  const inputContainerStyle = {
    backgroundColor: "#FFF5E6",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 1.5,
    borderColor: "#E8DDD0",
    marginBottom: 20,
  };

  return (
    <ErrorBoundary>
      <View style={{ flex: 1, backgroundColor: "#FFF8E7" }}>
        <BlobShape color="#2A9D8F" size={200} opacity={0.05} variant={3} style={{ top: -50, right: -50 }} />
        <BlobShape color="#E9C46A" size={160} opacity={0.06} variant={1} style={{ bottom: 40, left: -40 }} />

        <ScrollView
          contentContainerStyle={{ padding: 20, paddingTop: insets.top + 16, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Step progress */}
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 24 }}>
            {([1, 2, 3] as const).map((s) => (
              <View key={s} style={{ flex: 1, height: 6, borderRadius: 3, overflow: "hidden" }}>
                {step >= s ? (
                  <LinearGradient
                    colors={["#E76F51", "#F4A261"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ flex: 1, borderRadius: 3 }}
                  />
                ) : (
                  <View style={{ flex: 1, backgroundColor: "#E8DDD0", borderRadius: 3 }} />
                )}
              </View>
            ))}
          </View>

          <View style={{ alignItems: "center", marginBottom: 16 }}>
            <IllustrationPlaceholder scene="resume" size={120} />
          </View>

          <Text style={{ fontSize: 26, fontFamily: "Poppins_600SemiBold", color: "#2D1B0E", textAlign: "center", marginBottom: 4 }}>
            {t("resume.title")}
          </Text>
          <Text style={{ fontSize: 13, fontFamily: "Poppins_400Regular", color: "#8C7A6D", textAlign: "center", marginBottom: 24 }}>
            Step {step} of 3: {step === 1 ? t("resume.stepReview") : step === 2 ? t("resume.stepDetails") : t("resume.stepPreview")}
          </Text>

          {step === 1 && (
            <View style={[elevation.card, { backgroundColor: "#FFFFFF", borderRadius: 24, padding: 20 }]}>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
                <View style={{ width: 40, height: 40, borderRadius: 14, backgroundColor: "#D4F0EC", justifyContent: "center", alignItems: "center", marginRight: 12 }}>
                  <Text style={{ fontSize: 18 }}>👤</Text>
                </View>
                <View>
                  <Text style={{ fontSize: 13, fontFamily: "Poppins_500Medium", color: "#8C7A6D" }}>Name</Text>
                  <Text style={{ fontSize: 17, fontFamily: "Poppins_600SemiBold", color: "#2D1B0E" }}>
                    {user?.name ?? "—"}
                  </Text>
                </View>
              </View>

              <View style={{ backgroundColor: "#FFF5E6", borderRadius: 16, padding: 16, marginBottom: 20 }}>
                <Text style={{ fontSize: 12, fontFamily: "Poppins_500Medium", color: "#8C7A6D", marginBottom: 6 }}>
                  Current experience (from profile)
                </Text>
                <Text style={{ fontSize: 14, fontFamily: "Poppins_400Regular", color: "#5C4A3D", lineHeight: 20 }} numberOfLines={4}>
                  {user?.experience?.trim() || t("resume.notSet")}
                </Text>
              </View>

              <WarmButton label={`${t("common.next")}: ${t("resume.stepDetails")}`} onPress={() => setStep(2)} size="lg" fullWidth />
            </View>
          )}

          {step === 2 && (
            <View style={[elevation.card, { backgroundColor: "#FFFFFF", borderRadius: 24, padding: 20 }]}>
              <Text style={{ fontSize: 13, fontFamily: "Poppins_500Medium", color: "#5C4A3D", marginBottom: 6 }}>
                Experience (paste or type)
              </Text>
              <View style={[inputContainerStyle, { minHeight: 100 }]}>
                <Input variant="underlined" size="lg" style={{ borderBottomWidth: 0 }}>
                  <InputField
                    placeholder={t("resume.experiencePlaceholder")}
                    value={experience}
                    onChangeText={setExperience}
                    multiline
                    style={{ fontFamily: "Poppins_400Regular", fontSize: 14, color: "#2D1B0E" }}
                  />
                </Input>
              </View>

              <Text style={{ fontSize: 13, fontFamily: "Poppins_500Medium", color: "#5C4A3D", marginBottom: 6 }}>
                Education
              </Text>
              <View style={inputContainerStyle}>
                <Input variant="underlined" size="lg" style={{ borderBottomWidth: 0 }}>
                  <InputField
                    placeholder={t("resume.educationPlaceholder")}
                    value={education}
                    onChangeText={setEducation}
                    style={{ fontFamily: "Poppins_500Medium", fontSize: 16, color: "#2D1B0E" }}
                  />
                </Input>
              </View>

              <Text style={{ fontSize: 13, fontFamily: "Poppins_500Medium", color: "#5C4A3D", marginBottom: 6 }}>
                Additional (certifications, etc.)
              </Text>
              <View style={[inputContainerStyle, { minHeight: 80 }]}>
                <Input variant="underlined" size="lg" style={{ borderBottomWidth: 0 }}>
                  <InputField
                    placeholder={t("resume.additionalPlaceholder")}
                    value={additional}
                    onChangeText={setAdditional}
                    multiline
                    style={{ fontFamily: "Poppins_400Regular", fontSize: 14, color: "#2D1B0E" }}
                  />
                </Input>
              </View>

              <View style={{ flexDirection: "row", gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <WarmButton label="Back" onPress={() => setStep(1)} variant="outline" size="md" fullWidth />
                </View>
                <View style={{ flex: 1 }}>
                  <WarmButton label={t("resume.nextPreview")} onPress={() => setStep(3)} size="md" fullWidth />
                </View>
              </View>
            </View>
          )}

          {step === 3 && (
            <>
              <View style={[elevation.card, { backgroundColor: "#FFFFFF", borderRadius: 24, padding: 20, marginBottom: 20 }]}>
                <Text style={{ fontSize: 17, fontFamily: "Poppins_600SemiBold", color: "#2D1B0E", marginBottom: 12 }}>
                  Summary
                </Text>
                <View style={{ backgroundColor: "#FFF5E6", borderRadius: 14, padding: 14, marginBottom: 8, gap: 6 }}>
                  <Text style={{ fontSize: 13, fontFamily: "Poppins_400Regular", color: "#5C4A3D" }}>
                    <Text style={{ fontFamily: "Poppins_600SemiBold" }}>Experience:</Text> {experience.trim().slice(0, 80)}{experience.length > 80 ? "…" : ""}
                  </Text>
                  <Text style={{ fontSize: 13, fontFamily: "Poppins_400Regular", color: "#5C4A3D" }}>
                    <Text style={{ fontFamily: "Poppins_600SemiBold" }}>Education:</Text> {education.trim() || "—"}
                  </Text>
                </View>
                {generatedUrl && (
                  <View style={{ backgroundColor: "#D4F0EC", borderRadius: 14, padding: 12, marginTop: 4 }}>
                    <Text style={{ color: "#1E7A6F", fontSize: 13, fontFamily: "Poppins_500Medium" }}>
                      ✓ Resume generated. Check profile to download.
                    </Text>
                  </View>
                )}
              </View>

              <View style={{ gap: 12 }}>
                <WarmButton
                  label={loading ? "..." : generatedUrl ? t("resume.regenerateBtn") : t("resume.generateBtn")}
                  onPress={generatedUrl ? handleRegenerate : handleGenerate}
                  disabled={loading}
                  size="lg"
                  fullWidth
                  variant="teal"
                />
                <WarmButton label={t("resume.backToEdit")} onPress={() => setStep(2)} variant="outline" size="md" fullWidth />
              </View>
            </>
          )}
        </ScrollView>
      </View>
    </ErrorBoundary>
  );
}
