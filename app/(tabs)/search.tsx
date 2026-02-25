import { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Input, InputField } from "@gluestack-ui/themed";
import { useLanguage } from "../_contexts/LanguageContext";
import { useJobs } from "../_hooks/useJobs";
import { EmptyState } from "../_components/EmptyState";
import { BlobShape } from "../_components/ui/BlobShape";
import { AnimatedPressable } from "../_components/ui/AnimatedPressable";
import { WarmButton } from "../_components/ui/WarmButton";
import { elevation } from "../_theme/tokens";
import type { Job } from "../_types";

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const [searched, setSearched] = useState(false);
  const { jobs, loading, refresh } = useJobs({
    search: searched ? query : undefined,
    enabled: searched,
  });

  const onSearch = () => {
    if (!query.trim()) return;
    setSearched(true);
    refresh();
  };

  const renderItem = ({ item }: { item: Job }) => (
    <AnimatedPressable
      onPress={() => router.push({ pathname: "/job-details", params: { id: item.id } })}
      style={{ marginBottom: 12 }}
    >
      <View
        style={[
          elevation.card,
          {
            backgroundColor: "#FFFFFF",
            borderRadius: 20,
            padding: 18,
          },
        ]}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 14,
              backgroundColor: "#D4F0EC",
              justifyContent: "center",
              alignItems: "center",
              marginRight: 12,
            }}
          >
            <Text style={{ fontSize: 18 }}>💼</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontFamily: "Poppins_600SemiBold", color: "#2D1B0E" }} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={{ fontSize: 12, fontFamily: "Poppins_400Regular", color: "#8C7A6D", marginTop: 2 }}>
              📍 {item.location} · ₹{item.salaryMin}–{item.salaryMax}
            </Text>
          </View>
        </View>
      </View>
    </AnimatedPressable>
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#FFF8E7", paddingTop: insets.top }}>
      <BlobShape color="#2A9D8F" size={200} opacity={0.05} variant={2} style={{ top: -40, right: -50 }} />

      <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 }}>
        <Text style={{ fontSize: 24, fontFamily: "Poppins_600SemiBold", color: "#2D1B0E", marginBottom: 12 }}>
          {t("search.placeholder")}
        </Text>

        {/* Search bar */}
        <View
          style={[
            elevation.soft,
            {
              flexDirection: "row",
              backgroundColor: "#FFFFFF",
              borderRadius: 20,
              overflow: "hidden",
              alignItems: "center",
            },
          ]}
        >
          <View style={{ flex: 1, paddingLeft: 16 }}>
            <Input variant="underlined" size="lg" style={{ borderBottomWidth: 0 }}>
              <InputField
                placeholder={t("search.placeholder")}
                value={query}
                onChangeText={setQuery}
                onSubmitEditing={onSearch}
                returnKeyType="search"
                style={{ fontFamily: "Poppins_500Medium", fontSize: 15, color: "#2D1B0E" }}
              />
            </Input>
          </View>
          <View style={{ paddingRight: 6, paddingVertical: 6 }}>
            <WarmButton label={loading ? "..." : "🔍"} onPress={onSearch} disabled={loading} size="sm" variant="teal" />
          </View>
        </View>
      </View>

      <FlashList
        data={jobs}
        keyExtractor={(item: Job) => item.id}
        renderItem={renderItem}
        estimatedItemSize={100}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100, paddingTop: 8 }}
        ListEmptyComponent={
          searched && !loading ? (
            <EmptyState message={t("search.noJobsFound")} scene="job-search" subtitle="Try different keywords" />
          ) : null
        }
      />
    </View>
  );
}
