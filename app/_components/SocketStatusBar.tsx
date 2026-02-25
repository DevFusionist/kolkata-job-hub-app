import { View, Text, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSocket } from "../_contexts/SocketContext";
import { useAuth } from "../_contexts/AuthContext";
import { useLanguage } from "../_contexts/LanguageContext";

export function SocketStatusBar() {
  const { t } = useLanguage();
  const { isAuthenticated } = useAuth();
  const { isConnected, isReconnecting } = useSocket();

  if (!isAuthenticated) return null;
  if (isConnected) return null;

  return (
    <LinearGradient
      colors={["#FDE8D0", "#FADAD2"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 8,
        paddingHorizontal: 16,
      }}
    >
      {isReconnecting && (
        <ActivityIndicator size="small" color="#E76F51" style={{ marginRight: 8 }} />
      )}
      <Text style={{ color: "#C95A3F", fontSize: 13, fontFamily: "Poppins_500Medium" }}>
        {isReconnecting ? t("socket.reconnecting") : t("socket.connecting")}
      </Text>
    </LinearGradient>
  );
}
