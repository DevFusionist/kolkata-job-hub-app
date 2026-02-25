import type { ReactNode } from "react";
import { Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { AnimatedPressable } from "./AnimatedPressable";
import { elevation } from "../../_theme/tokens";

interface WarmButtonProps {
  label: string;
  onPress: () => void;
  variant?: "coral" | "teal" | "mustard" | "outline";
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  icon?: ReactNode;
  fullWidth?: boolean;
}

const gradients: Record<string, [string, string]> = {
  coral: ["#E76F51", "#F4A261"],
  teal: ["#2A9D8F", "#5BC0B5"],
  mustard: ["#E9C46A", "#F4A261"],
};

const sizes = {
  sm: { py: 10, px: 20, text: 13, radius: 16 },
  md: { py: 14, px: 28, text: 15, radius: 20 },
  lg: { py: 18, px: 32, text: 17, radius: 24 },
};

export function WarmButton({ label, onPress, variant = "coral", disabled = false, size = "md", icon, fullWidth = false }: WarmButtonProps) {
  const s = sizes[size];

  if (variant === "outline") {
    return (
      <AnimatedPressable
        onPress={onPress}
        disabled={disabled}
        style={[
          {
            paddingVertical: s.py,
            paddingHorizontal: s.px,
            borderRadius: s.radius,
            borderWidth: 2,
            borderColor: "#E76F51",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "row",
            gap: 8,
            opacity: disabled ? 0.5 : 1,
            alignSelf: fullWidth ? "stretch" : "auto",
          },
        ]}
      >
        {icon}
        <Text style={{ color: "#E76F51", fontFamily: "Poppins_600SemiBold", fontSize: s.text }}>
          {label}
        </Text>
      </AnimatedPressable>
    );
  }

  const grad = gradients[variant] ?? gradients.coral;

  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={disabled}
      style={[
        elevation.warm,
        { borderRadius: s.radius, opacity: disabled ? 0.5 : 1, alignSelf: fullWidth ? "stretch" : "auto" },
      ]}
    >
      <LinearGradient
        colors={grad}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{
          paddingVertical: s.py,
          paddingHorizontal: s.px,
          borderRadius: s.radius,
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
          gap: 8,
        }}
      >
        {icon}
        <Text style={{ color: "#FFFFFF", fontFamily: "Poppins_600SemiBold", fontSize: s.text }}>
          {label}
        </Text>
      </LinearGradient>
    </AnimatedPressable>
  );
}
