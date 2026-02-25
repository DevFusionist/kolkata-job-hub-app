import { useState } from "react";
import { View, Text, Modal, Pressable, ScrollView } from "react-native";
import { Input, InputField } from "@gluestack-ui/themed";
import { useLanguage } from "../_contexts/LanguageContext";
import { AnimatedPressable } from "./ui/AnimatedPressable";
import { elevation } from "../_theme/tokens";

interface LocationSelectorProps {
  visible: boolean;
  onClose: () => void;
  value: string;
  onSelect: (location: string) => void;
}

const KOLKATA_AREAS = [
  { name: "Kolkata", emoji: "🏙️" },
  { name: "Howrah", emoji: "🌉" },
  { name: "Salt Lake", emoji: "🏢" },
  { name: "Park Street", emoji: "🌳" },
  { name: "Dum Dum", emoji: "✈️" },
  { name: "Ballygunge", emoji: "🏘️" },
  { name: "Jadavpur", emoji: "🎓" },
  { name: "Garia", emoji: "🚇" },
  { name: "Behala", emoji: "🏡" },
  { name: "New Town", emoji: "🏗️" },
];

export function LocationSelector({ visible, onClose, value, onSelect }: LocationSelectorProps) {
  const { t } = useLanguage();
  const [query, setQuery] = useState(value);

  const handleSelect = (location: string) => {
    onSelect(location);
    onClose();
  };

  const filtered = query.trim()
    ? KOLKATA_AREAS.filter((a) =>
        a.name.toLowerCase().includes(query.trim().toLowerCase())
      )
    : KOLKATA_AREAS;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" }} onPress={onClose}>
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            backgroundColor: "#FFF8E7",
            borderTopLeftRadius: 32,
            borderTopRightRadius: 32,
            maxHeight: "70%",
          }}
        >
          {/* Handle bar */}
          <View style={{ alignItems: "center", paddingTop: 12, paddingBottom: 4 }}>
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: "#D4C4B0" }} />
          </View>

          <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 8, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={{ fontSize: 20, fontFamily: "Poppins_600SemiBold", color: "#2D1B0E" }}>
              {t("location.selectLocation")}
            </Text>
            <Pressable onPress={onClose} style={{ padding: 8 }}>
              <Text style={{ color: "#E76F51", fontFamily: "Poppins_600SemiBold", fontSize: 14 }}>
                {t("common.cancel")}
              </Text>
            </Pressable>
          </View>

          <View style={{ paddingHorizontal: 20, paddingBottom: 24 }}>
            <View
              style={{
                backgroundColor: "#FFF5E6",
                borderRadius: 16,
                paddingHorizontal: 16,
                paddingVertical: 4,
                borderWidth: 1.5,
                borderColor: "#E8DDD0",
                marginBottom: 16,
              }}
            >
              <Input variant="underlined" size="lg" style={{ borderBottomWidth: 0 }}>
                <InputField
                  placeholder={t("location.searchPlaceholder")}
                  value={query}
                  onChangeText={setQuery}
                  style={{ fontFamily: "Poppins_500Medium", fontSize: 15, color: "#2D1B0E" }}
                />
              </Input>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {filtered.map((area) => (
                <AnimatedPressable key={area.name} onPress={() => handleSelect(area.name)}>
                  <View
                    style={[
                      elevation.soft,
                      {
                        flexDirection: "row",
                        alignItems: "center",
                        backgroundColor: value === area.name ? "#FADAD2" : "#FFFFFF",
                        borderRadius: 16,
                        padding: 14,
                        marginBottom: 8,
                        gap: 12,
                      },
                    ]}
                  >
                    <View
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 12,
                        backgroundColor: value === area.name ? "#E76F51" : "#FFF5E6",
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <Text style={{ fontSize: 16 }}>{area.emoji}</Text>
                    </View>
                    <Text
                      style={{
                        fontSize: 15,
                        fontFamily: value === area.name ? "Poppins_600SemiBold" : "Poppins_500Medium",
                        color: value === area.name ? "#C95A3F" : "#2D1B0E",
                      }}
                    >
                      {area.name}
                    </Text>
                  </View>
                </AnimatedPressable>
              ))}
              {filtered.length === 0 && (
                <Text style={{ color: "#8C7A6D", paddingVertical: 16, fontFamily: "Poppins_400Regular", textAlign: "center" }}>
                  No areas match.
                </Text>
              )}
            </ScrollView>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
