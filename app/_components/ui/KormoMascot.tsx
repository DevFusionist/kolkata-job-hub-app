import { View, Text } from "react-native";
import Svg, { Circle, Ellipse, Path, G } from "react-native-svg";

interface KormoMascotProps {
  size?: number;
  mood?: "happy" | "thinking" | "waving" | "working" | "celebrating";
  showSpeech?: boolean;
  speechText?: string;
}

export function KormoMascot({ size = 120, mood = "happy", showSpeech, speechText }: KormoMascotProps) {
  return (
    <View style={{ alignItems: "center" }}>
      <Svg width={size} height={size} viewBox="0 0 120 120">
        <G transform="translate(60, 60)">
          {/* Body */}
          <Ellipse cx={0} cy={12} rx={28} ry={32} fill="#F4A261" />
          {/* Head */}
          <Circle cx={0} cy={-18} r={22} fill="#E9C46A" />
          {/* Cheeks */}
          <Circle cx={-12} cy={-12} r={5} fill="#FADAD2" opacity={0.7} />
          <Circle cx={12} cy={-12} r={5} fill="#FADAD2" opacity={0.7} />

          {/* Eyes — mood variants */}
          {mood === "happy" || mood === "celebrating" ? (
            <>
              <Path d="M-8,-22 Q-6,-18 -4,-22" stroke="#2D1B0E" strokeWidth={2} fill="none" strokeLinecap="round" />
              <Path d="M4,-22 Q6,-18 8,-22" stroke="#2D1B0E" strokeWidth={2} fill="none" strokeLinecap="round" />
            </>
          ) : (
            <>
              <Circle cx={-7} cy={-21} r={2.5} fill="#2D1B0E" />
              <Circle cx={7} cy={-21} r={2.5} fill="#2D1B0E" />
            </>
          )}

          {/* Mouth */}
          {mood === "happy" || mood === "celebrating" ? (
            <Path d="M-6,-12 Q0,-7 6,-12" stroke="#2D1B0E" strokeWidth={1.5} fill="none" strokeLinecap="round" />
          ) : mood === "thinking" ? (
            <Circle cx={3} cy={-11} r={2} fill="#2D1B0E" opacity={0.5} />
          ) : (
            <Path d="M-4,-12 L4,-12" stroke="#2D1B0E" strokeWidth={1.5} strokeLinecap="round" />
          )}

          {/* Arms */}
          {mood === "waving" || mood === "celebrating" ? (
            <>
              <Path d="M-25,5 Q-35,-10 -28,-22" stroke="#F4A261" strokeWidth={6} fill="none" strokeLinecap="round" />
              <Path d="M25,5 Q35,-10 28,-22" stroke="#F4A261" strokeWidth={6} fill="none" strokeLinecap="round" />
            </>
          ) : (
            <>
              <Path d="M-25,5 Q-32,15 -28,25" stroke="#F4A261" strokeWidth={6} fill="none" strokeLinecap="round" />
              <Path d="M25,5 Q32,15 28,25" stroke="#F4A261" strokeWidth={6} fill="none" strokeLinecap="round" />
            </>
          )}

          {/* Briefcase for "working" mood */}
          {mood === "working" && (
            <G transform="translate(0, 32)">
              <Path d="M-10,-2 L10,-2 L10,8 L-10,8 Z" fill="#2A9D8F" />
              <Path d="M-4,-5 L-4,-2 L4,-2 L4,-5" stroke="#2A9D8F" strokeWidth={2} fill="none" />
            </G>
          )}

          {/* Celebration sparkles */}
          {mood === "celebrating" && (
            <>
              <Circle cx={-30} cy={-30} r={2} fill="#E9C46A" />
              <Circle cx={30} cy={-28} r={2.5} fill="#E76F51" />
              <Circle cx={-20} cy={-38} r={1.5} fill="#2A9D8F" />
              <Circle cx={25} cy={-38} r={1.5} fill="#F4A261" />
            </>
          )}

          {/* Legs */}
          <Path d="M-8,42 L-8,50" stroke="#F4A261" strokeWidth={6} strokeLinecap="round" />
          <Path d="M8,42 L8,50" stroke="#F4A261" strokeWidth={6} strokeLinecap="round" />
        </G>
      </Svg>

      {showSpeech && speechText && (
        <View
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 16,
            paddingHorizontal: 16,
            paddingVertical: 10,
            marginTop: -4,
            maxWidth: 200,
            shadowColor: "#2D1B0E",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 8,
            elevation: 3,
          }}
        >
          <Text style={{ fontSize: 13, color: "#2D1B0E", textAlign: "center", fontFamily: "Poppins_500Medium" }}>
            {speechText}
          </Text>
        </View>
      )}
    </View>
  );
}
