import { useState } from "react";
import { View, Text, KeyboardAvoidingView, Platform, Alert, ScrollView, Pressable } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Input, InputField } from "@gluestack-ui/themed";
import { useAuth } from "../_contexts/AuthContext";
import { useLanguage } from "../_contexts/LanguageContext";
import { authService } from "../_services/authService";
import { BlobShape } from "../_components/ui/BlobShape";
import { KormoMascot } from "../_components/ui/KormoMascot";
import { WarmButton } from "../_components/ui/WarmButton";
import { AnimatedPressable } from "../_components/ui/AnimatedPressable";
import { elevation } from "../_theme/tokens";
import type { UserRole } from "../_types";

type Step = "phone" | "otp" | "profile" | "mpin";

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ phone?: string }>();
  const { t } = useLanguage();
  const { login } = useAuth();

  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState(params.phone ?? "");
  const [otp, setOtp] = useState("");
  const [registrationToken, setRegistrationToken] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [role, setRole] = useState<UserRole>("seeker");
  const [businessName, setBusinessName] = useState("");
  const [location, setLocation] = useState("");
  const [mpin, setMpin] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async () => {
    if (!phone.trim() || phone.length < 10) {
      Alert.alert(t("common.error"), "Please enter a valid 10-digit phone number");
      return;
    }
    setLoading(true);
    try {
      await authService.sendOtp(phone.trim(), "register");
      setStep("otp");
      setOtp("");
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? (e as Error)?.message ?? "Failed to send OTP";
      Alert.alert(t("common.error"), msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim() || otp.length < 6) {
      Alert.alert(t("common.error"), "Please enter the 6-digit OTP");
      return;
    }
    setLoading(true);
    try {
      const res = await authService.verifyOtp(phone.trim(), otp.trim(), "register");
      if (!res.isNewUser || !("registrationToken" in res)) {
        Alert.alert(t("common.error"), "Invalid response. Try again.");
        return;
      }
      setRegistrationToken(res.registrationToken);
      setStep("profile");
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? (e as Error)?.message ?? "Invalid OTP";
      Alert.alert(t("common.error"), msg);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!name.trim()) {
      Alert.alert(t("common.error"), "Please enter your name");
      return;
    }
    if (role === "employer" && !businessName.trim()) {
      Alert.alert(t("common.error"), "Please enter business name");
      return;
    }
    if (!mpin.trim() || mpin.length < 4) {
      Alert.alert(t("common.error"), "Please set a 4–6 digit MPIN");
      return;
    }
    if (!registrationToken) {
      Alert.alert(t("common.error"), "Session expired. Please start again.");
      router.replace("/(auth)/register");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        phone: phone.trim(),
        registrationToken,
        name: name.trim(),
        role,
        location: location.trim() || "Kolkata",
      };
      if (role === "employer") (payload as Record<string, unknown>).businessName = businessName.trim();
      const { user, token } = await authService.register(payload);
      await authService.setMpin(mpin.trim(), { authToken: token });
      await login(user, token);
      router.replace("/(tabs)");
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? (e as Error)?.message ?? "Registration failed";
      Alert.alert(t("common.error"), msg);
    } finally {
      setLoading(false);
    }
  };

  const inputContainerStyle = {
    backgroundColor: "#FFF5E6",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 1.5,
    borderColor: "#E8DDD0",
    marginBottom: 16,
  };

  const steps: Step[] = ["phone", "otp", "profile", "mpin"];
  const stepIndex = steps.indexOf(step);

  return (
    <View style={{ flex: 1, backgroundColor: "#FFF8E7" }}>
      <BlobShape color="#2A9D8F" size={260} opacity={0.05} variant={2} style={{ top: -80, left: -60 }} />
      <BlobShape color="#E76F51" size={200} opacity={0.06} variant={4} style={{ bottom: -30, right: -50 }} />
      <BlobShape color="#E9C46A" size={160} opacity={0.07} variant={1} style={{ top: 300, right: -30 }} />

      <KeyboardAvoidingView
        style={{ flex: 1, paddingTop: insets.top }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ alignItems: "center", marginTop: 32, marginBottom: 16 }}>
            <KormoMascot size={90} mood={step === "mpin" ? "celebrating" : "happy"} />
          </View>

          <Text style={{ fontSize: 26, fontFamily: "Poppins_600SemiBold", color: "#2D1B0E", textAlign: "center", marginBottom: 4 }}>
            {t("auth.register")}
          </Text>
          <Text style={{ fontSize: 13, fontFamily: "Poppins_400Regular", color: "#8C7A6D", textAlign: "center", marginBottom: 28 }}>
            {step === "phone" && "Verify your phone with OTP"}
            {step === "otp" && "Enter the code we sent"}
            {step === "profile" && "Tell us about yourself"}
            {step === "mpin" && "Set your quick-access PIN"}
          </Text>

          <View style={{ flexDirection: "row", justifyContent: "center", gap: 6, marginBottom: 24 }}>
            {steps.map((s, i) => (
              <View
                key={s}
                style={{
                  width: step === s ? 24 : 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: step === s ? "#E76F51" : i < stepIndex ? "#2A9D8F" : "#E8DDD0",
                }}
              />
            ))}
          </View>

          <View style={[elevation.card, { backgroundColor: "#FFFFFF", borderRadius: 28, padding: 24, marginBottom: 24 }]}>
            {step === "phone" && (
              <>
                <Text style={{ fontSize: 13, fontFamily: "Poppins_500Medium", color: "#5C4A3D", marginBottom: 6 }}>
                  {t("auth.phone")}
                </Text>
                <View style={inputContainerStyle}>
                  <Input variant="underlined" size="lg" style={{ borderBottomWidth: 0 }}>
                    <InputField
                      placeholder="10-digit mobile number"
                      value={phone}
                      onChangeText={setPhone}
                      keyboardType="phone-pad"
                      maxLength={10}
                      style={{ fontFamily: "Poppins_500Medium", fontSize: 16, color: "#2D1B0E" }}
                    />
                  </Input>
                </View>
                <WarmButton label={loading ? "..." : t("auth.sendOtp")} onPress={handleSendOtp} disabled={loading} size="lg" fullWidth />
                <Pressable onPress={() => router.replace("/(auth)/login")} style={{ marginTop: 16, alignItems: "center" }}>
                  <Text style={{ color: "#2A9D8F", fontFamily: "Poppins_500Medium", fontSize: 14 }}>
                    Already have an account? Login
                  </Text>
                </Pressable>
              </>
            )}

            {step === "otp" && (
              <>
                <Text style={{ fontSize: 13, fontFamily: "Poppins_400Regular", color: "#8C7A6D", marginBottom: 12 }}>
                  Code sent to +91 {phone}
                </Text>
                <View style={inputContainerStyle}>
                  <Input variant="underlined" size="lg" style={{ borderBottomWidth: 0 }}>
                    <InputField
                      placeholder="000000"
                      value={otp}
                      onChangeText={setOtp}
                      keyboardType="number-pad"
                      maxLength={6}
                      style={{ fontFamily: "Poppins_600SemiBold", fontSize: 24, letterSpacing: 8, textAlign: "center", color: "#2D1B0E" }}
                    />
                  </Input>
                </View>
                <WarmButton label={loading ? "..." : t("auth.verifyOtp")} onPress={handleVerifyOtp} disabled={loading} size="lg" fullWidth />
                <Pressable onPress={() => setStep("phone")} style={{ marginTop: 16, alignItems: "center" }}>
                  <Text style={{ color: "#2A9D8F", fontFamily: "Poppins_500Medium", fontSize: 14 }}>
                    Change number
                  </Text>
                </Pressable>
              </>
            )}

            {step === "profile" && (
              <>
                <Text style={{ fontSize: 13, fontFamily: "Poppins_500Medium", color: "#5C4A3D", marginBottom: 6 }}>
                  Name
                </Text>
                <View style={inputContainerStyle}>
                  <Input variant="underlined" size="lg" style={{ borderBottomWidth: 0 }}>
                    <InputField
                      placeholder="Your name"
                      value={name}
                      onChangeText={setName}
                      autoCapitalize="words"
                      style={{ fontFamily: "Poppins_500Medium", fontSize: 16, color: "#2D1B0E" }}
                    />
                  </Input>
                </View>

                <Text style={{ fontSize: 13, fontFamily: "Poppins_500Medium", color: "#5C4A3D", marginBottom: 8 }}>
                  I am a
                </Text>
                <View style={{ flexDirection: "row", gap: 12, marginBottom: 16 }}>
                  <AnimatedPressable
                    onPress={() => setRole("seeker")}
                    style={{ flex: 1, height: 56, borderRadius: 20, ...(role === "seeker" ? elevation.warm : elevation.soft) }}
                  >
                    <View
                      style={{
                        flex: 1,
                        borderRadius: 20,
                        justifyContent: "center",
                        alignItems: "center",
                        backgroundColor: role === "seeker" ? "#E76F51" : "#FFF5E6",
                        borderWidth: role === "seeker" ? 0 : 1.5,
                        borderColor: "#E8DDD0",
                      }}
                    >
                      <Text style={{ fontSize: 20, marginBottom: 2 }}>🔍</Text>
                      <Text style={{ fontFamily: "Poppins_600SemiBold", fontSize: 13, color: role === "seeker" ? "#FFFFFF" : "#5C4A3D" }}>
                        Job Seeker
                      </Text>
                    </View>
                  </AnimatedPressable>
                  <AnimatedPressable
                    onPress={() => setRole("employer")}
                    style={{ flex: 1, height: 56, borderRadius: 20, ...(role === "employer" ? elevation.warm : elevation.soft) }}
                  >
                    <View
                      style={{
                        flex: 1,
                        borderRadius: 20,
                        justifyContent: "center",
                        alignItems: "center",
                        backgroundColor: role === "employer" ? "#2A9D8F" : "#FFF5E6",
                        borderWidth: role === "employer" ? 0 : 1.5,
                        borderColor: "#E8DDD0",
                      }}
                    >
                      <Text style={{ fontSize: 20, marginBottom: 2 }}>🏢</Text>
                      <Text style={{ fontFamily: "Poppins_600SemiBold", fontSize: 13, color: role === "employer" ? "#FFFFFF" : "#5C4A3D" }}>
                        Employer
                      </Text>
                    </View>
                  </AnimatedPressable>
                </View>

                {role === "employer" && (
                  <>
                    <Text style={{ fontSize: 13, fontFamily: "Poppins_500Medium", color: "#5C4A3D", marginBottom: 6 }}>
                      Business name
                    </Text>
                    <View style={inputContainerStyle}>
                      <Input variant="underlined" size="lg" style={{ borderBottomWidth: 0 }}>
                        <InputField
                          placeholder="Business name"
                          value={businessName}
                          onChangeText={setBusinessName}
                          style={{ fontFamily: "Poppins_500Medium", fontSize: 16, color: "#2D1B0E" }}
                        />
                      </Input>
                    </View>
                  </>
                )}

                <Text style={{ fontSize: 13, fontFamily: "Poppins_500Medium", color: "#5C4A3D", marginBottom: 6 }}>
                  Location
                </Text>
                <View style={inputContainerStyle}>
                  <Input variant="underlined" size="lg" style={{ borderBottomWidth: 0 }}>
                    <InputField
                      placeholder="e.g. Kolkata"
                      value={location}
                      onChangeText={setLocation}
                      style={{ fontFamily: "Poppins_500Medium", fontSize: 16, color: "#2D1B0E" }}
                    />
                  </Input>
                </View>

                <WarmButton label={t("common.next")} onPress={() => setStep("mpin")} size="lg" fullWidth />
                <Pressable onPress={() => setStep("otp")} style={{ marginTop: 16, alignItems: "center" }}>
                  <Text style={{ color: "#2A9D8F", fontFamily: "Poppins_500Medium", fontSize: 14 }}>
                    {t("common.back")}
                  </Text>
                </Pressable>
              </>
            )}

            {step === "mpin" && (
              <>
                <Text style={{ fontSize: 13, fontFamily: "Poppins_400Regular", color: "#8C7A6D", marginBottom: 16, lineHeight: 20 }}>
                  Set a 4–6 digit MPIN to sign in quickly next time.
                </Text>
                <Text style={{ fontSize: 13, fontFamily: "Poppins_500Medium", color: "#5C4A3D", marginBottom: 6 }}>
                  {t("auth.setMpin")}
                </Text>
                <View style={inputContainerStyle}>
                  <Input variant="underlined" size="lg" style={{ borderBottomWidth: 0 }}>
                    <InputField
                      placeholder="••••"
                      value={mpin}
                      onChangeText={setMpin}
                      keyboardType="number-pad"
                      secureTextEntry
                      maxLength={6}
                      style={{ fontFamily: "Poppins_600SemiBold", fontSize: 24, letterSpacing: 8, textAlign: "center", color: "#2D1B0E" }}
                    />
                  </Input>
                </View>

                <WarmButton label={loading ? "..." : t("common.done")} onPress={handleRegister} disabled={loading} size="lg" fullWidth />
                <Pressable onPress={() => setStep("profile")} style={{ marginTop: 16, alignItems: "center" }}>
                  <Text style={{ color: "#2A9D8F", fontFamily: "Poppins_500Medium", fontSize: 14 }}>
                    {t("common.back")}
                  </Text>
                </Pressable>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
