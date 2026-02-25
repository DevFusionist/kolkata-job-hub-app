import { useState } from "react";
import { View, Text, ScrollView, Alert, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Input, InputField } from "@gluestack-ui/themed";
import { useLanguage } from "../_contexts/LanguageContext";
import { useJobPosting } from "../_hooks/useJobPosting";
import { LocationSelector } from "../_components/LocationSelector";
import { BlobShape } from "../_components/ui/BlobShape";
import { WarmButton } from "../_components/ui/WarmButton";
import { AnimatedPressable } from "../_components/ui/AnimatedPressable";
import { elevation } from "../_theme/tokens";
import type { JobCategory } from "../_types";

const CATEGORIES: { key: JobCategory; emoji: string }[] = [
  { key: "sales", emoji: "🛍️" },
  { key: "delivery", emoji: "🚚" },
  { key: "retail", emoji: "🏪" },
  { key: "hospitality", emoji: "🏨" },
  { key: "office_work", emoji: "💻" },
  { key: "driver", emoji: "🚗" },
  { key: "warehouse", emoji: "📦" },
  { key: "restaurant", emoji: "🍽️" },
  { key: "security", emoji: "🛡️" },
  { key: "other", emoji: "✨" },
];

export default function PostJobScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { form, update, submit, loading, error } = useJobPosting();
  const [locationModalVisible, setLocationModalVisible] = useState(false);

  const handlePost = async () => {
    const success = await submit();
    if (success) Alert.alert(t("common.done"), t("postJob.postSuccess"));
    else if (error) Alert.alert(t("common.error"), error);
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
    <>
      <View style={{ flex: 1, backgroundColor: "#FFF8E7" }}>
        <BlobShape color="#E9C46A" size={200} opacity={0.06} variant={1} style={{ top: -50, left: -40 }} />
        <BlobShape color="#E76F51" size={160} opacity={0.04} variant={4} style={{ bottom: 50, right: -40 }} />

        <ScrollView
          contentContainerStyle={{ padding: 20, paddingTop: insets.top + 16, paddingBottom: 100 }}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={{ fontSize: 26, fontFamily: "Poppins_600SemiBold", color: "#2D1B0E", marginBottom: 4 }}>
            {t("postJob.title")}
          </Text>
          <Text style={{ fontSize: 13, fontFamily: "Poppins_400Regular", color: "#8C7A6D", marginBottom: 24 }}>
            Fill in the details to find great candidates
          </Text>

          {error && (
            <View style={{ backgroundColor: "#FADAD2", borderRadius: 14, padding: 14, marginBottom: 16 }}>
              <Text style={{ color: "#C95A3F", fontSize: 13, fontFamily: "Poppins_500Medium" }}>{error}</Text>
            </View>
          )}

          <View style={[elevation.card, { backgroundColor: "#FFFFFF", borderRadius: 24, padding: 20, marginBottom: 16 }]}>
            <Text style={{ fontSize: 13, fontFamily: "Poppins_500Medium", color: "#5C4A3D", marginBottom: 6 }}>
              {t("postJob.jobTitle")}
            </Text>
            <View style={inputContainerStyle}>
              <Input variant="underlined" size="lg" style={{ borderBottomWidth: 0 }}>
                <InputField
                  placeholder="e.g. Delivery Partner"
                  value={form.title}
                  onChangeText={(v) => update("title", v)}
                  style={{ fontFamily: "Poppins_500Medium", fontSize: 16, color: "#2D1B0E" }}
                />
              </Input>
            </View>

            <Text style={{ fontSize: 13, fontFamily: "Poppins_500Medium", color: "#5C4A3D", marginBottom: 6 }}>
              {t("postJob.description")}
            </Text>
            <View style={[inputContainerStyle, { minHeight: 100 }]}>
              <Input variant="underlined" size="lg" style={{ borderBottomWidth: 0 }}>
                <InputField
                  placeholder={t("postJob.describeRole")}
                  value={form.description}
                  onChangeText={(v) => update("description", v)}
                  multiline
                  style={{ fontFamily: "Poppins_400Regular", fontSize: 14, color: "#2D1B0E" }}
                />
              </Input>
            </View>

            <Text style={{ fontSize: 13, fontFamily: "Poppins_500Medium", color: "#5C4A3D", marginBottom: 10 }}>
              {t("postJob.category")}
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
              {CATEGORIES.map((c) => (
                <AnimatedPressable key={c.key} onPress={() => update("category", c.key)}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                      backgroundColor: form.category === c.key ? "#E76F51" : "#FFF5E6",
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: 20,
                      borderWidth: form.category === c.key ? 0 : 1.5,
                      borderColor: "#E8DDD0",
                    }}
                  >
                    <Text style={{ fontSize: 14 }}>{c.emoji}</Text>
                    <Text
                      style={{
                        fontSize: 12,
                        fontFamily: "Poppins_500Medium",
                        color: form.category === c.key ? "#FFFFFF" : "#5C4A3D",
                        textTransform: "capitalize",
                      }}
                    >
                      {c.key.replace("_", " ")}
                    </Text>
                  </View>
                </AnimatedPressable>
              ))}
            </View>

            <Text style={{ fontSize: 13, fontFamily: "Poppins_500Medium", color: "#5C4A3D", marginBottom: 6 }}>
              {t("postJob.location")}
            </Text>
            <AnimatedPressable onPress={() => setLocationModalVisible(true)}>
              <View
                style={{
                  backgroundColor: "#FFF5E6",
                  borderRadius: 16,
                  paddingHorizontal: 16,
                  height: 52,
                  justifyContent: "center",
                  borderWidth: 1.5,
                  borderColor: "#E8DDD0",
                  marginBottom: 20,
                }}
              >
                <Text style={{ fontFamily: "Poppins_500Medium", fontSize: 15, color: form.location ? "#2D1B0E" : "#8C7A6D" }}>
                  {form.location || t("postJob.tapToSelect")}
                </Text>
              </View>
            </AnimatedPressable>

            <Text style={{ fontSize: 13, fontFamily: "Poppins_500Medium", color: "#5C4A3D", marginBottom: 6 }}>
              {t("postJob.salaryRange")}
            </Text>
            <View style={{ flexDirection: "row", gap: 12, marginBottom: 8 }}>
              <View style={[inputContainerStyle, { flex: 1, marginBottom: 0 }]}>
                <Input variant="underlined" size="lg" style={{ borderBottomWidth: 0 }}>
                  <InputField
                    placeholder={t("postJob.min")}
                    value={form.salaryMin}
                    onChangeText={(v) => update("salaryMin", v)}
                    keyboardType="number-pad"
                    style={{ fontFamily: "Poppins_500Medium", fontSize: 16, color: "#2D1B0E" }}
                  />
                </Input>
              </View>
              <View style={[inputContainerStyle, { flex: 1, marginBottom: 0 }]}>
                <Input variant="underlined" size="lg" style={{ borderBottomWidth: 0 }}>
                  <InputField
                    placeholder={t("postJob.max")}
                    value={form.salaryMax}
                    onChangeText={(v) => update("salaryMax", v)}
                    keyboardType="number-pad"
                    style={{ fontFamily: "Poppins_500Medium", fontSize: 16, color: "#2D1B0E" }}
                  />
                </Input>
              </View>
            </View>
          </View>

          <WarmButton label={loading ? "..." : t("postJob.post")} onPress={handlePost} disabled={loading} size="lg" fullWidth variant="coral" />
        </ScrollView>
      </View>

      <LocationSelector
        visible={locationModalVisible}
        onClose={() => setLocationModalVisible(false)}
        value={form.location}
        onSelect={(location) => update("location", location)}
      />
    </>
  );
}
