import { useEffect, useRef } from "react";
import { View, Text } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "./_contexts/AuthContext";
import { BlobShape } from "./_components/ui/BlobShape";
import { KormoMascot } from "./_components/ui/KormoMascot";
import { AppLottie } from "./_components/AppLottie";

export default function AuthGuard() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const didNavigate = useRef(false);

  useEffect(() => {
    if (isLoading || didNavigate.current) return;
    didNavigate.current = true;
    const target = isAuthenticated ? "/(tabs)" : "/(auth)/login";
    const id = setTimeout(() => {
      router.replace(target);
    }, 0);
    return () => clearTimeout(id);
  }, [isLoading, isAuthenticated, router]);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#FFF8E7" }}>
      <BlobShape color="#E76F51" size={300} opacity={0.06} variant={1} style={{ top: -60, right: -80 }} />
      <BlobShape color="#2A9D8F" size={250} opacity={0.05} variant={3} style={{ bottom: -40, left: -60 }} />
      <BlobShape color="#E9C46A" size={200} opacity={0.07} variant={2} style={{ top: 200, left: -40 }} />

      <KormoMascot size={120} mood="happy" />
      <Text style={{ fontSize: 28, fontFamily: "Poppins_600SemiBold", color: "#2D1B0E", marginTop: 16 }}>
        কর্ম
      </Text>
      <Text style={{ fontSize: 14, fontFamily: "Poppins_400Regular", color: "#8C7A6D", marginTop: 4 }}>
        Kolkata's Own Talent Hub
      </Text>

      <AppLottie
        source={require("../assets/lottie/loading.json")}
        autoPlay
        loop
        style={{ width: 60, height: 60, marginTop: 32 }}
      />
    </View>
  );
}
