import { View, Text } from "react-native";
import { AppLottie } from "./AppLottie";
import { BlobShape } from "./ui/BlobShape";

export function LoadingScreen() {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#FFF8E7" }}>
      <BlobShape color="#E76F51" size={300} opacity={0.06} variant={1} style={{ top: -40, left: -60 }} />
      <BlobShape color="#2A9D8F" size={250} opacity={0.05} variant={3} style={{ bottom: 20, right: -50 }} />
      <AppLottie
        source={require("../../assets/lottie/loading.json")}
        autoPlay
        loop
        style={{ width: 140, height: 140 }}
      />
      <Text style={{ fontSize: 14, fontFamily: "Poppins_500Medium", color: "#8C7A6D", marginTop: 12 }}>
        Loading...
      </Text>
    </View>
  );
}
