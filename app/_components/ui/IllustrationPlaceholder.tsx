import { View } from "react-native";
import Svg, { Circle, Rect, Path, G, Ellipse } from "react-native-svg";

type SceneType =
  | "job-search"
  | "profile"
  | "success"
  | "error"
  | "empty"
  | "chat"
  | "resume"
  | "ai"
  | "onboarding"
  | "payment";

interface IllustrationPlaceholderProps {
  scene: SceneType;
  size?: number;
}

function JobSearchScene({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      <Circle cx={100} cy={100} r={90} fill="#FFF0CC" />
      <Circle cx={100} cy={100} r={70} fill="#FADAD2" opacity={0.5} />
      {/* Magnifying glass */}
      <Circle cx={85} cy={80} r={25} stroke="#2A9D8F" strokeWidth={4} fill="#D4F0EC" />
      <Path d="M103,98 L120,115" stroke="#2A9D8F" strokeWidth={5} strokeLinecap="round" />
      {/* Document cards */}
      <Rect x={55} y={120} width={35} height={45} rx={6} fill="#FFFFFF" stroke="#E8DDD0" strokeWidth={1.5} />
      <Rect x={60} y={128} width={20} height={3} rx={1.5} fill="#E9C46A" />
      <Rect x={60} y={135} width={25} height={2} rx={1} fill="#D4C4B0" />
      <Rect x={60} y={141} width={18} height={2} rx={1} fill="#D4C4B0" />
      <Rect x={100} y={115} width={35} height={45} rx={6} fill="#FFFFFF" stroke="#E8DDD0" strokeWidth={1.5} />
      <Rect x={105} y={123} width={20} height={3} rx={1.5} fill="#E76F51" />
      <Rect x={105} y={130} width={25} height={2} rx={1} fill="#D4C4B0" />
      <Rect x={105} y={136} width={18} height={2} rx={1} fill="#D4C4B0" />
      {/* Stars */}
      <Circle cx={145} cy={60} r={3} fill="#E9C46A" />
      <Circle cx={55} cy={55} r={2} fill="#F4A261" />
      <Circle cx={155} cy={90} r={2.5} fill="#E76F51" />
    </Svg>
  );
}

function ProfileScene({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      <Circle cx={100} cy={100} r={90} fill="#D4F0EC" opacity={0.4} />
      <Circle cx={100} cy={75} r={28} fill="#E9C46A" />
      <Ellipse cx={100} cy={130} rx={38} ry={25} fill="#F4A261" />
      {/* Eyes */}
      <Circle cx={90} cy={70} r={3} fill="#2D1B0E" />
      <Circle cx={110} cy={70} r={3} fill="#2D1B0E" />
      {/* Smile */}
      <Path d="M90,82 Q100,90 110,82" stroke="#2D1B0E" strokeWidth={2} fill="none" strokeLinecap="round" />
      {/* Badge */}
      <Circle cx={135} cy={95} r={12} fill="#2A9D8F" />
      <Path d="M130,95 L133,98 L140,91" stroke="#FFFFFF" strokeWidth={2} fill="none" strokeLinecap="round" />
      {/* Sparkles */}
      <Circle cx={60} cy={60} r={3} fill="#E76F51" opacity={0.6} />
      <Circle cx={150} cy={55} r={2} fill="#E9C46A" />
    </Svg>
  );
}

function SuccessScene({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      <Circle cx={100} cy={100} r={90} fill="#D4F0EC" opacity={0.3} />
      <Circle cx={100} cy={100} r={50} fill="#2A9D8F" opacity={0.15} />
      <Circle cx={100} cy={100} r={35} fill="#2A9D8F" />
      <Path d="M82,100 L95,113 L118,88" stroke="#FFFFFF" strokeWidth={5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {/* Confetti */}
      <Circle cx={55} cy={55} r={4} fill="#E9C46A" />
      <Circle cx={145} cy={60} r={3} fill="#E76F51" />
      <Circle cx={50} cy={130} r={3} fill="#F4A261" />
      <Circle cx={150} cy={140} r={4} fill="#E9C46A" />
      <Rect x={70} y={45} width={8} height={4} rx={2} fill="#E76F51" transform="rotate(-20, 74, 47)" />
      <Rect x={130} y={50} width={8} height={4} rx={2} fill="#2A9D8F" transform="rotate(15, 134, 52)" />
    </Svg>
  );
}

function ErrorScene({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      <Circle cx={100} cy={100} r={90} fill="#FADAD2" opacity={0.3} />
      <Circle cx={100} cy={100} r={35} fill="#E76F51" opacity={0.15} />
      <Circle cx={100} cy={85} r={25} fill="#E9C46A" />
      <Ellipse cx={100} cy={130} rx={30} ry={20} fill="#F4A261" />
      {/* Sad eyes */}
      <Circle cx={92} cy={82} r={2.5} fill="#2D1B0E" />
      <Circle cx={108} cy={82} r={2.5} fill="#2D1B0E" />
      {/* Frown */}
      <Path d="M92,94 Q100,88 108,94" stroke="#2D1B0E" strokeWidth={2} fill="none" strokeLinecap="round" />
      {/* Warning triangle */}
      <Path d="M150,55 L160,73 L140,73 Z" fill="#E76F51" />
      <Path d="M150,62 L150,67" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" />
      <Circle cx={150} cy={70} r={1} fill="#FFFFFF" />
    </Svg>
  );
}

function EmptyScene({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      <Circle cx={100} cy={100} r={90} fill="#FFF0CC" opacity={0.5} />
      {/* Empty box */}
      <G transform="translate(65, 60)">
        <Path d="M0,30 L35,15 L70,30 L70,70 L35,85 L0,70 Z" fill="#FFF5E6" stroke="#D4C4B0" strokeWidth={1.5} />
        <Path d="M0,30 L35,45 L70,30" fill="none" stroke="#D4C4B0" strokeWidth={1.5} />
        <Path d="M35,45 L35,85" stroke="#D4C4B0" strokeWidth={1.5} />
        <Path d="M0,30 L35,15 L70,30 L35,45 Z" fill="#FFFFFF" stroke="#D4C4B0" strokeWidth={1.5} />
      </G>
      {/* Floating dots */}
      <Circle cx={55} cy={50} r={3} fill="#E9C46A" opacity={0.5} />
      <Circle cx={150} cy={55} r={2} fill="#E76F51" opacity={0.4} />
      <Circle cx={145} cy={145} r={3} fill="#2A9D8F" opacity={0.4} />
    </Svg>
  );
}

function GenericScene({ size, label }: { size: number; label: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      <Circle cx={100} cy={100} r={90} fill="#FFF0CC" opacity={0.4} />
      <Circle cx={100} cy={100} r={60} fill="#FADAD2" opacity={0.3} />
      <Circle cx={100} cy={80} r={20} fill="#E9C46A" />
      <Ellipse cx={100} cy={120} rx={25} ry={18} fill="#F4A261" />
      <Circle cx={93} cy={77} r={2} fill="#2D1B0E" />
      <Circle cx={107} cy={77} r={2} fill="#2D1B0E" />
      <Path d="M94,86 Q100,91 106,86" stroke="#2D1B0E" strokeWidth={1.5} fill="none" strokeLinecap="round" />
    </Svg>
  );
}

const sceneMap: Record<SceneType, React.FC<{ size: number }>> = {
  "job-search": JobSearchScene,
  profile: ProfileScene,
  success: SuccessScene,
  error: ErrorScene,
  empty: EmptyScene,
  chat: (props) => <GenericScene {...props} label="chat" />,
  resume: (props) => <GenericScene {...props} label="resume" />,
  ai: (props) => <GenericScene {...props} label="ai" />,
  onboarding: (props) => <GenericScene {...props} label="onboarding" />,
  payment: (props) => <GenericScene {...props} label="payment" />,
};

export function IllustrationPlaceholder({ scene, size = 180 }: IllustrationPlaceholderProps) {
  const SceneComponent = sceneMap[scene] ?? EmptyScene;
  return (
    <View style={{ alignItems: "center", justifyContent: "center" }}>
      <SceneComponent size={size} />
    </View>
  );
}
