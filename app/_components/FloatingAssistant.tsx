import { useRef, useEffect } from "react";
import { Pressable, Text, Animated } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { elevation } from "../_theme/tokens";

export function FloatingAssistant() {
  const router = useRouter();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
      ]),
    ).start();
  }, [pulseAnim]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.9, useNativeDriver: true, damping: 15, stiffness: 200 }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, damping: 12, stiffness: 180 }).start();
  };

  const combinedScale = Animated.multiply(pulseAnim, scaleAnim);

  return (
    <Animated.View
      style={{
        position: "absolute",
        bottom: 88,
        right: 20,
        width: 60,
        height: 60,
        borderRadius: 30,
        transform: [{ scale: combinedScale }],
        ...elevation.float,
      }}
    >
      <Pressable
        onPress={() => router.push("/(tabs)/protibha")}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={{ flex: 1 }}
      >
        <LinearGradient
          colors={["#E76F51", "#F4A261"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            flex: 1,
            borderRadius: 30,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#FFFFFF", fontSize: 13, fontFamily: "Poppins_600SemiBold", letterSpacing: 0.5 }}>
            AI
          </Text>
          <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 8, fontFamily: "Poppins_500Medium", marginTop: -2 }}>
            প্রতিভা
          </Text>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}
