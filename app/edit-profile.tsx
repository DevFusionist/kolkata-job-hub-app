import { useState } from "react";
import { View, Text, ScrollView, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Input, InputField } from "@gluestack-ui/themed";
import api from "./_lib/api";
import { useAuth } from "./_contexts/AuthContext";
import { useLanguage } from "./_contexts/LanguageContext";
import { BlobShape } from "./_components/ui/BlobShape";
import { WarmButton } from "./_components/ui/WarmButton";
import { IllustrationPlaceholder } from "./_components/ui/IllustrationPlaceholder";
import { elevation } from "./_theme/tokens";

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useLanguage();
  const { user, updateUser } = useAuth();

  const [name, setName] = useState(user?.name ?? "");
  const [location, setLocation] = useState(user?.location ?? "");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data } = await api.put(`/users/${user.id}`, {
        name: name.trim(),
        location: location.trim(),
      });
      await updateUser(data);
      router.back();
    } catch (e: unknown) {
      Alert.alert(t("common.error"), (e as Error)?.message ?? t("editProfile.updateFailed"));
    } finally {
      setLoading(false);
    }
  };

  const inputContainerStyle = {
    backgroundColor: "#FFF5E6",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 1.5,
    borderColor: "#E8DDD0",
    marginBottom: 20,
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#FFF8E7" }}>
      <BlobShape color="#2A9D8F" size={200} opacity={0.05} variant={2} style={{ top: -40, right: -50 }} />

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingTop: insets.top + 16, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ alignItems: "center", marginBottom: 20 }}>
          <IllustrationPlaceholder scene="profile" size={120} />
        </View>

        <Text style={{ fontSize: 26, fontFamily: "Poppins_600SemiBold", color: "#2D1B0E", textAlign: "center", marginBottom: 24 }}>
          {t("profile.editProfile")}
        </Text>

        <View style={[elevation.card, { backgroundColor: "#FFFFFF", borderRadius: 24, padding: 24 }]}>
          <Text style={{ fontSize: 13, fontFamily: "Poppins_500Medium", color: "#5C4A3D", marginBottom: 6 }}>
            Name
          </Text>
          <View style={inputContainerStyle}>
            <Input variant="underlined" size="lg" style={{ borderBottomWidth: 0 }}>
              <InputField
                placeholder={t("editProfile.namePlaceholder")}
                value={name}
                onChangeText={setName}
                style={{ fontFamily: "Poppins_500Medium", fontSize: 16, color: "#2D1B0E" }}
              />
            </Input>
          </View>

          <Text style={{ fontSize: 13, fontFamily: "Poppins_500Medium", color: "#5C4A3D", marginBottom: 6 }}>
            {t("postJob.location")}
          </Text>
          <View style={inputContainerStyle}>
            <Input variant="underlined" size="lg" style={{ borderBottomWidth: 0 }}>
              <InputField
                placeholder="e.g. Kolkata"
                value={location}
                onChangeText={setLocation}
                style={{ fontFamily: "Poppins_500Medium", fontSize: 16, color: "#2D1B0E" }}
              />
            </Input>
          </View>

          <WarmButton label={loading ? "..." : t("common.save")} onPress={handleSave} disabled={loading} size="lg" fullWidth />
        </View>
      </ScrollView>
    </View>
  );
}
