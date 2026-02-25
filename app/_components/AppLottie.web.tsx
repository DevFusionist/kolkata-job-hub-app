import { View, ActivityIndicator, ViewStyle } from "react-native";

interface AppLottieProps {
  source?: number | object;
  style?: ViewStyle;
  autoPlay?: boolean;
  loop?: boolean;
}

export function AppLottie({ style }: AppLottieProps) {
  return (
    <View style={[{ alignItems: "center", justifyContent: "center" }, style]}>
      <ActivityIndicator size="large" color="#E76F51" />
    </View>
  );
}
