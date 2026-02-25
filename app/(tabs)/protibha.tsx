import { useState } from "react";
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, Pressable, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Input, InputField } from "@gluestack-ui/themed";
import { useLanguage } from "../_contexts/LanguageContext";
import { useAuth } from "../_contexts/AuthContext";
import { useProtibha } from "../_hooks/useProtibha";
import { ErrorBoundary } from "../_components/ErrorBoundary";
import { BlobShape } from "../_components/ui/BlobShape";
import { KormoMascot } from "../_components/ui/KormoMascot";
import { AnimatedPressable } from "../_components/ui/AnimatedPressable";
import { elevation } from "../_theme/tokens";

const QUICK_CHIPS = [
  { labelKey: "findNearByJobs", cmd: "/findNearByJobs", emoji: "📍" },
  { labelKey: "skillsMatchingJobs", cmd: "/skillsMatchingJobs", emoji: "🎯" },
  { labelKey: "highestPayingJobs", cmd: "/highestPayingJobs", emoji: "💰" },
  { labelKey: "buildResume", cmd: "/buildResume", emoji: "📝" },
  { labelKey: "postJob", cmd: "/postJob", emoji: "📢" },
  { labelKey: "findCandidates", cmd: "/findCandidates", emoji: "👥" },
  { labelKey: "tips", cmd: "/tips", emoji: "💡" },
] as const;

export default function ProtibhaScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { user } = useAuth();
  const { messages, loading, loadingHistory, error, send, clearHistory } = useProtibha();
  const [input, setInput] = useState("");
  const isSeeker = user?.role === "seeker";

  const handleSend = async () => {
    const text = input.trim();
    if (!text) return;
    setInput("");
    await send(text);
  };

  const handleChip = (cmd: string) => setInput(cmd);

  return (
    <ErrorBoundary>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: "#FFF8E7", paddingTop: insets.top }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={80}
      >
        <BlobShape color="#E76F51" size={200} opacity={0.04} variant={1} style={{ top: -40, right: -50 }} />
        <BlobShape color="#2A9D8F" size={160} opacity={0.03} variant={3} style={{ bottom: 100, left: -40 }} />

        {/* Header */}
        <View
          style={[
            elevation.soft,
            {
              paddingHorizontal: 20,
              paddingVertical: 14,
              backgroundColor: "#FFFFFF",
              borderBottomLeftRadius: 24,
              borderBottomRightRadius: 24,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            },
          ]}
        >
          <View>
            <Text style={{ fontSize: 22, fontFamily: "Poppins_600SemiBold", color: "#2D1B0E" }}>
              {t("protibha.title")}
            </Text>
            <Text style={{ fontSize: 12, fontFamily: "Poppins_400Regular", color: "#8C7A6D", marginTop: 2 }}>
              AI assistant for jobs & resume
            </Text>
          </View>
          {messages.length > 0 && (
            <AnimatedPressable onPress={clearHistory}>
              <View style={{ backgroundColor: "#FFF5E6", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 14 }}>
                <Text style={{ fontSize: 12, fontFamily: "Poppins_500Medium", color: "#E76F51" }}>Clear</Text>
              </View>
            </AnimatedPressable>
          )}
        </View>

        {loadingHistory ? (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <ActivityIndicator size="small" color="#E76F51" />
            <Text style={{ color: "#8C7A6D", marginTop: 8, fontSize: 13, fontFamily: "Poppins_400Regular" }}>
              Loading history...
            </Text>
          </View>
        ) : (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ flexGrow: 1, padding: 16, paddingBottom: 24 }}
            keyboardShouldPersistTaps="handled"
          >
            {messages.length === 0 && (
              <View style={{ marginBottom: 16 }}>
                {/* Mascot welcome */}
                <View style={{ alignItems: "center", marginVertical: 20 }}>
                  <KormoMascot size={100} mood="waving" showSpeech speechText="Hi! How can I help today?" />
                </View>

                <Text style={{ fontSize: 13, fontFamily: "Poppins_500Medium", color: "#5C4A3D", marginBottom: 12 }}>
                  Quick actions
                </Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                  {QUICK_CHIPS.filter((c) => {
                    if (c.cmd === "/postJob" || c.cmd === "/findCandidates" || c.cmd === "/tips")
                      return !isSeeker;
                    if (c.cmd === "/buildResume" || c.cmd === "/findNearByJobs" || c.cmd === "/skillsMatchingJobs" || c.cmd === "/highestPayingJobs")
                      return isSeeker;
                    return true;
                  }).map((chip) => (
                    <AnimatedPressable key={chip.cmd} onPress={() => handleChip(chip.cmd)}>
                      <View
                        style={[
                          elevation.soft,
                          {
                            backgroundColor: "#FFFFFF",
                            paddingHorizontal: 16,
                            paddingVertical: 10,
                            borderRadius: 20,
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 6,
                          },
                        ]}
                      >
                        <Text style={{ fontSize: 14 }}>{chip.emoji}</Text>
                        <Text style={{ fontSize: 13, fontFamily: "Poppins_500Medium", color: "#2D1B0E" }}>
                          {t(`protibha.${chip.labelKey}`)}
                        </Text>
                      </View>
                    </AnimatedPressable>
                  ))}
                </View>
              </View>
            )}

            {messages.map((m) => (
              <View
                key={m.id}
                style={{ marginBottom: 10, alignItems: m.role === "user" ? "flex-end" : "flex-start" }}
              >
                {m.role === "user" ? (
                  <LinearGradient
                    colors={["#E76F51", "#F4A261"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      maxWidth: "85%",
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      borderRadius: 20,
                      borderBottomRightRadius: 6,
                    }}
                  >
                    <Text style={{ color: "#FFFFFF", fontSize: 14, fontFamily: "Poppins_400Regular", lineHeight: 20 }}>
                      {m.content}
                    </Text>
                  </LinearGradient>
                ) : (
                  <View
                    style={[
                      elevation.soft,
                      {
                        maxWidth: "85%",
                        paddingHorizontal: 16,
                        paddingVertical: 12,
                        borderRadius: 20,
                        borderBottomLeftRadius: 6,
                        backgroundColor: "#FFFFFF",
                      },
                    ]}
                  >
                    <Text style={{ color: "#2D1B0E", fontSize: 14, fontFamily: "Poppins_400Regular", lineHeight: 20 }}>
                      {m.content}
                    </Text>
                  </View>
                )}
              </View>
            ))}

            {loading && (
              <View style={{ alignItems: "flex-start", marginBottom: 10 }}>
                <View
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderRadius: 20,
                    borderBottomLeftRadius: 6,
                    backgroundColor: "#FFF5E6",
                  }}
                >
                  <ActivityIndicator size="small" color="#E76F51" />
                </View>
              </View>
            )}

            {error && (
              <Text style={{ color: "#E76F51", fontSize: 13, fontFamily: "Poppins_400Regular", marginBottom: 8 }}>
                {error}
              </Text>
            )}
          </ScrollView>
        )}

        {/* Input bar */}
        <View
          style={[
            elevation.soft,
            {
              flexDirection: "row",
              alignItems: "flex-end",
              padding: 12,
              gap: 10,
              backgroundColor: "#FFFFFF",
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
            },
          ]}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: "#FFF5E6",
              borderRadius: 22,
              paddingHorizontal: 16,
              paddingVertical: 4,
              minHeight: 44,
              borderWidth: 1.5,
              borderColor: "#E8DDD0",
            }}
          >
            <Input variant="underlined" size="lg" style={{ borderBottomWidth: 0 }}>
              <InputField
                placeholder={t("protibha.placeholder")}
                value={input}
                onChangeText={setInput}
                onSubmitEditing={handleSend}
                multiline
                maxLength={2000}
                style={{ fontFamily: "Poppins_400Regular", fontSize: 14, color: "#2D1B0E" }}
              />
            </Input>
          </View>
          <Pressable
            onPress={handleSend}
            disabled={loading || !input.trim()}
            style={{ opacity: loading || !input.trim() ? 0.4 : 1 }}
          >
            <LinearGradient
              colors={["#E76F51", "#F4A261"]}
              style={{ width: 44, height: 44, borderRadius: 22, justifyContent: "center", alignItems: "center" }}
            >
              <Text style={{ color: "#FFFFFF", fontSize: 18 }}>↑</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </ErrorBoundary>
  );
}
