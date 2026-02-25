import { useState, useEffect, useRef } from "react";
import { View, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import NetInfo from "@react-native-community/netinfo";

export function OfflineBanner() {
  const [isOffline, setOffline] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const unsub = NetInfo.addEventListener((state) => {
      if (mountedRef.current) setOffline(!state.isConnected);
    });
    return () => {
      mountedRef.current = false;
      unsub();
    };
  }, []);

  if (!isOffline) return null;

  return (
    <LinearGradient
      colors={["#E76F51", "#F4A261"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={{ paddingVertical: 10, paddingHorizontal: 20 }}
    >
      <Text style={{ color: "#FFFFFF", textAlign: "center", fontFamily: "Poppins_500Medium", fontSize: 13 }}>
        📡 No internet connection
      </Text>
    </LinearGradient>
  );
}
