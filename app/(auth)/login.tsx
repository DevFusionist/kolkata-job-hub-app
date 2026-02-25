import { useState } from "react";
import { View, Text, KeyboardAvoidingView, Platform, Alert, Pressable, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Input, InputField } from "@gluestack-ui/themed";
import { useAuth } from "../_contexts/AuthContext";
import { useLanguage } from "../_contexts/LanguageContext";
import { authService } from "../_services/authService";
import { BlobShape } from "../_components/ui/BlobShape";
import { KormoMascot } from "../_components/ui/KormoMascot";
import { WarmButton } from "../_components/ui/WarmButton";
import { elevation } from "../_theme/tokens";

type Step = "phone_mpin" | "forgot_otp" | "forgot_verify" | "forgot_set_mpin";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useLanguage();
  const { login } = useAuth();

  const [step, setStep] = useState<Step>("phone_mpin");
  const [phone, setPhone] = useState("");
  const [mpin, setMpin] = useState("");
  const [otp, setOtp] = useState("");
  const [newMpin, setNewMpin] = useState("");
  const [mpinResetToken, setMpinResetToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!phone.trim() || phone.length < 10) {
      Alert.alert(t("common.error"), "Please enter a valid phone number");
      return;
    }
    if (!mpin.trim() || mpin.length < 4) {
      Alert.alert(t("common.error"), "Please enter your MPIN");
      return;
    }
    setLoading(true);
    try {
      const { user, token } = await authService.login(phone.trim(), mpin.trim());
      await login(user, token);
      router.replace("/(tabs)");
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? (e as Error)?.message ?? "Login failed";
      Alert.alert(t("common.error"), msg);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotMpin = () => {
    if (!phone.trim() || phone.length < 10) {
      Alert.alert(t("common.error"), "Enter your phone number first");
      return;
    }
    setStep("forgot_otp");
    setOtp("");
    setNewMpin("");
    setMpinResetToken(null);
  };

  const handleForgotSendOtp = async () => {
    if (!phone.trim() || phone.length < 10) {
      Alert.alert(t("common.error"), "Please enter a valid phone number");
      return;
    }
    setLoading(true);
    try {
      await authService.sendOtp(phone.trim(), "reset_mpin");
      setStep("forgot_verify");
      setOtp("");
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? (e as Error)?.message ?? "Failed to send OTP";
      Alert.alert(t("common.error"), msg);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotVerifyOtp = async () => {
    if (!otp.trim() || otp.length < 6) {
      Alert.alert(t("common.error"), "Please enter the 6-digit OTP");
      return;
    }
    setLoading(true);
    try {
      const res = await authService.verifyOtp(phone.trim(), otp.trim(), "reset_mpin");
      if (res.isNewUser || !("mpinResetToken" in res)) {
        Alert.alert(t("common.error"), "Invalid response. Try again.");
        return;
      }
      setMpinResetToken(res.mpinResetToken);
      setStep("forgot_set_mpin");
      setNewMpin("");
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? (e as Error)?.message ?? "Invalid OTP";
      Alert.alert(t("common.error"), msg);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSetMpin = async () => {
    if (!newMpin.trim() || newMpin.length < 4) {
      Alert.alert(t("common.error"), "Please enter a 4–6 digit MPIN");
      return;
    }
    if (!mpinResetToken) {
      Alert.alert(t("common.error"), "Session expired. Please start again.");
      setStep("phone_mpin");
      return;
    }
    setLoading(true);
    try {
      await authService.setMpin(newMpin.trim(), { resetToken: mpinResetToken });
      const { user, token } = await authService.login(phone.trim(), newMpin.trim());
      await login(user, token);
      router.replace("/(tabs)");
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? (e as Error)?.message ?? "Failed to set MPIN";
      Alert.alert(t("common.error"), msg);
    } finally {
      setLoading(false);
    }
  };

  const backToLogin = () => {
    setStep("phone_mpin");
    setOtp("");
    setNewMpin("");
    setMpinResetToken(null);
  };

  const isForgotFlow = step !== "phone_mpin";
  const stepTitle =
    step === "phone_mpin"
      ? t("auth.login")
      : step === "forgot_otp"
        ? "Forgot MPIN"
        : step === "forgot_verify"
          ? t("auth.otp")
          : t("auth.setMpin");
  const mascotMood =
    step === "phone_mpin" ? "waving" : step === "forgot_verify" ? "thinking" : "happy";

  return (
    <View style={{ flex: 1, backgroundColor: "#FFF8E7" }}>
      <BlobShape color="#E76F51" size={280} opacity={0.06} variant={1} style={{ top: -80, right: -60 }} />
      <BlobShape color="#2A9D8F" size={220} opacity={0.05} variant={3} style={{ bottom: -40, left: -60 }} />
      <BlobShape color="#E9C46A" size={180} opacity={0.07} variant={2} style={{ top: 200, left: -40 }} />

      <KeyboardAvoidingView
        style={{ flex: 1, paddingTop: insets.top }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ alignItems: "center", marginTop: 40, marginBottom: 8 }}>
            <KormoMascot size={110} mood={mascotMood as "waving" | "thinking" | "happy"} />
          </View>

          <Text style={{ fontSize: 28, fontFamily: "Poppins_600SemiBold", color: "#2D1B0E", textAlign: "center", marginBottom: 4 }}>
            {t("common.appName")}
          </Text>
          <Text style={{ fontSize: 14, fontFamily: "Poppins_400Regular", color: "#8C7A6D", textAlign: "center", marginBottom: 32 }}>
            {t("common.appTagline")}
          </Text>

          <View
            style={[
              elevation.card,
              { backgroundColor: "#FFFFFF", borderRadius: 28, padding: 24, marginBottom: 24 },
            ]}
          >
            <Text style={{ fontSize: 22, fontFamily: "Poppins_600SemiBold", color: "#2D1B0E", marginBottom: 4 }}>
              {stepTitle}
            </Text>
            <Text style={{ fontSize: 13, fontFamily: "Poppins_400Regular", color: "#8C7A6D", marginBottom: 20 }}>
              {step === "phone_mpin"
                ? "Enter your phone and MPIN to sign in"
                : step === "forgot_otp"
                  ? "We'll send a code to reset your MPIN"
                  : step === "forgot_verify"
                    ? `Code sent to +91 ${phone}`
                    : "Enter your new 4–6 digit MPIN"}
            </Text>

            {step === "phone_mpin" && (
              <>
                <View
                  style={{
                    backgroundColor: "#FFF5E6",
                    borderRadius: 16,
                    paddingHorizontal: 16,
                    paddingVertical: 4,
                    borderWidth: 1.5,
                    borderColor: "#E8DDD0",
                    marginBottom: 16,
                  }}
                >
                  <Input variant="underlined" size="lg" style={{ borderBottomWidth: 0 }}>
                    <InputField
                      placeholder={t("auth.phone")}
                      value={phone}
                      onChangeText={setPhone}
                      keyboardType="phone-pad"
                      maxLength={10}
                      style={{ fontFamily: "Poppins_500Medium", fontSize: 16, color: "#2D1B0E" }}
                    />
                  </Input>
                </View>
                <View
                  style={{
                    backgroundColor: "#FFF5E6",
                    borderRadius: 16,
                    paddingHorizontal: 16,
                    paddingVertical: 4,
                    borderWidth: 1.5,
                    borderColor: "#E8DDD0",
                    marginBottom: 16,
                  }}
                >
                  <Input variant="underlined" size="lg" style={{ borderBottomWidth: 0 }}>
                    <InputField
                      placeholder="MPIN"
                      value={mpin}
                      onChangeText={setMpin}
                      keyboardType="number-pad"
                      secureTextEntry
                      maxLength={6}
                      style={{ fontFamily: "Poppins_600SemiBold", fontSize: 20, letterSpacing: 4, textAlign: "center", color: "#2D1B0E" }}
                    />
                  </Input>
                </View>
                <WarmButton label={loading ? "..." : t("auth.login")} onPress={handleLogin} disabled={loading} size="lg" fullWidth />
                <Pressable onPress={handleForgotMpin} style={{ marginTop: 16, alignItems: "center" }}>
                  <Text style={{ color: "#2A9D8F", fontFamily: "Poppins_500Medium", fontSize: 14 }}>
                    {t("auth.forgotMpin")}
                  </Text>
                </Pressable>
              </>
            )}

            {step === "forgot_otp" && (
              <>
                <View
                  style={{
                    backgroundColor: "#FFF5E6",
                    borderRadius: 16,
                    paddingHorizontal: 16,
                    paddingVertical: 4,
                    borderWidth: 1.5,
                    borderColor: "#E8DDD0",
                    marginBottom: 16,
                  }}
                >
                  <Input variant="underlined" size="lg" style={{ borderBottomWidth: 0 }}>
                    <InputField
                      placeholder={t("auth.phone")}
                      value={phone}
                      onChangeText={setPhone}
                      keyboardType="phone-pad"
                      maxLength={10}
                      style={{ fontFamily: "Poppins_500Medium", fontSize: 16, color: "#2D1B0E" }}
                    />
                  </Input>
                </View>
                <WarmButton label={loading ? "..." : "Send OTP"} onPress={handleForgotSendOtp} disabled={loading} size="lg" fullWidth />
                <Pressable onPress={backToLogin} style={{ marginTop: 16, alignItems: "center" }}>
                  <Text style={{ color: "#2A9D8F", fontFamily: "Poppins_500Medium", fontSize: 14 }}>
                    Back to login
                  </Text>
                </Pressable>
              </>
            )}

            {step === "forgot_verify" && (
              <>
                <View
                  style={{
                    backgroundColor: "#FFF5E6",
                    borderRadius: 16,
                    paddingHorizontal: 16,
                    paddingVertical: 4,
                    borderWidth: 1.5,
                    borderColor: "#E8DDD0",
                    marginBottom: 16,
                  }}
                >
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
                <WarmButton label={loading ? "..." : t("auth.verifyOtp")} onPress={handleForgotVerifyOtp} disabled={loading} size="lg" fullWidth />
                <Pressable onPress={() => setStep("forgot_otp")} style={{ marginTop: 16, alignItems: "center" }}>
                  <Text style={{ color: "#2A9D8F", fontFamily: "Poppins_500Medium", fontSize: 14 }}>
                    Change number
                  </Text>
                </Pressable>
              </>
            )}

            {step === "forgot_set_mpin" && (
              <>
                <View
                  style={{
                    backgroundColor: "#FFF5E6",
                    borderRadius: 16,
                    paddingHorizontal: 16,
                    paddingVertical: 4,
                    borderWidth: 1.5,
                    borderColor: "#E8DDD0",
                    marginBottom: 16,
                  }}
                >
                  <Input variant="underlined" size="lg" style={{ borderBottomWidth: 0 }}>
                    <InputField
                      placeholder="••••"
                      value={newMpin}
                      onChangeText={setNewMpin}
                      keyboardType="number-pad"
                      secureTextEntry
                      maxLength={6}
                      style={{ fontFamily: "Poppins_600SemiBold", fontSize: 24, letterSpacing: 8, textAlign: "center", color: "#2D1B0E" }}
                    />
                  </Input>
                </View>
                <WarmButton label={loading ? "..." : "Set MPIN & sign in"} onPress={handleForgotSetMpin} disabled={loading} size="lg" fullWidth />
                <Pressable onPress={backToLogin} style={{ marginTop: 16, alignItems: "center" }}>
                  <Text style={{ color: "#2A9D8F", fontFamily: "Poppins_500Medium", fontSize: 14 }}>
                    Back to login
                  </Text>
                </Pressable>
              </>
            )}
          </View>

          {!isForgotFlow && (
            <Pressable onPress={() => router.replace({ pathname: "/(auth)/register" })} style={{ alignItems: "center" }}>
              <Text style={{ color: "#5C4A3D", fontFamily: "Poppins_500Medium", fontSize: 14 }}>
                Don't have an account? Sign up
              </Text>
            </Pressable>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
