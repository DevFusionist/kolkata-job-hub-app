import { View, type ViewProps } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { elevation } from "../../_theme/tokens";

interface GradientCardProps extends ViewProps {
  colors?: [string, string];
  variant?: "warm" | "coral" | "teal" | "surface";
  padding?: number;
  borderRadius?: number;
  elevated?: boolean;
}

const presets: Record<string, [string, string]> = {
  warm: ["#FFF8E7", "#FADAD2"],
  coral: ["#E76F51", "#F4A261"],
  teal: ["#2A9D8F", "#5BC0B5"],
  surface: ["#FFFFFF", "#FFF5E6"],
};

export function GradientCard({
  colors: colorsProp,
  variant = "surface",
  padding = 20,
  borderRadius = 24,
  elevated = true,
  style,
  children,
  ...rest
}: GradientCardProps) {
  const gradColors = colorsProp ?? presets[variant] ?? presets.surface;

  return (
    <View
      style={[
        elevated ? elevation.card : elevation.none,
        { borderRadius, overflow: "hidden" },
        style,
      ]}
      {...rest}
    >
      <LinearGradient
        colors={gradColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ padding, borderRadius }}
      >
        {children}
      </LinearGradient>
    </View>
  );
}
