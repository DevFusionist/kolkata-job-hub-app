import { View, Text } from "react-native";
import { IllustrationPlaceholder } from "./ui/IllustrationPlaceholder";
import { KormoMascot } from "./ui/KormoMascot";

interface EmptyStateProps {
  message: string;
  subtitle?: string;
  icon?: string;
  scene?: "empty" | "job-search" | "chat" | "resume" | "profile";
  useMascot?: boolean;
  className?: string;
}

export function EmptyState({ message, subtitle, icon, scene, useMascot = false, className = "" }: EmptyStateProps) {
  return (
    <View className={`py-12 items-center justify-center px-8 ${className}`}>
      {useMascot ? (
        <KormoMascot size={100} mood="thinking" showSpeech speechText={message} />
      ) : scene ? (
        <IllustrationPlaceholder scene={scene} size={160} />
      ) : icon ? (
        <View
          style={{
            width: 72,
            height: 72,
            borderRadius: 36,
            backgroundColor: "#FFF0CC",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 16,
          }}
        >
          <Text style={{ fontSize: 32 }} accessibilityLabel={message}>
            {icon}
          </Text>
        </View>
      ) : null}
      {!useMascot && (
        <>
          <Text
            style={{
              fontSize: 16,
              fontFamily: "Poppins_600SemiBold",
              color: "#2D1B0E",
              textAlign: "center",
              marginTop: scene ? 16 : 0,
            }}
          >
            {message}
          </Text>
          {subtitle && (
            <Text
              style={{
                fontSize: 13,
                fontFamily: "Poppins_400Regular",
                color: "#8C7A6D",
                textAlign: "center",
                marginTop: 6,
                lineHeight: 20,
              }}
            >
              {subtitle}
            </Text>
          )}
        </>
      )}
    </View>
  );
}
