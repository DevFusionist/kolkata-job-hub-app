import LottieView from "lottie-react-native";
import { ViewStyle } from "react-native";

interface AppLottieProps {
  source: number | object;
  style?: ViewStyle;
  autoPlay?: boolean;
  loop?: boolean;
}

export function AppLottie({ source, style, autoPlay = true, loop = true }: AppLottieProps) {
  return (
    <LottieView
      source={typeof source === "number" ? source : source as any}
      autoPlay={autoPlay}
      loop={loop}
      style={style}
    />
  );
}
