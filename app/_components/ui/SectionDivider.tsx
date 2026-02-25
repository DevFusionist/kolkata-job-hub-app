import { View } from "react-native";
import Svg, { Path } from "react-native-svg";

interface SectionDividerProps {
  color?: string;
  height?: number;
  flip?: boolean;
}

export function SectionDivider({ color = "#FFF8E7", height = 40, flip = false }: SectionDividerProps) {
  return (
    <View style={{ height, width: "100%", transform: flip ? [{ scaleY: -1 }] : [] }}>
      <Svg width="100%" height={height} viewBox="0 0 400 40" preserveAspectRatio="none">
        <Path
          d="M0,20 C100,40 200,0 300,25 C350,35 380,10 400,20 L400,40 L0,40 Z"
          fill={color}
        />
      </Svg>
    </View>
  );
}
