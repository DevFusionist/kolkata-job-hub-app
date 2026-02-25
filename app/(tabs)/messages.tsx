import { useEffect, useRef } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLanguage } from "../_contexts/LanguageContext";
import { useTheme } from "../_contexts/ThemeContext";
import { useSocket } from "../_contexts/SocketContext";
import { useConversations } from "../_hooks/useConversations";
import { SocketStatusBar } from "../_components/SocketStatusBar";
import { EmptyState } from "../_components/EmptyState";
import { BlobShape } from "../_components/ui/BlobShape";
import { AnimatedPressable } from "../_components/ui/AnimatedPressable";
import { elevation } from "../_theme/tokens";

export default function MessagesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useLanguage();
  const { colors } = useTheme();
  const { isConnected } = useSocket();
  const { conversations, loading, refresh } = useConversations();
  const wasConnectedRef = useRef(isConnected);

  useEffect(() => {
    if (isConnected && !wasConnectedRef.current) {
      refresh();
    }
    wasConnectedRef.current = isConnected;
  }, [isConnected, refresh]);

  const renderItem = ({ item }: { item: { id: string; participant?: { name?: string }; lastMessage?: { content?: string } } }) => (
    <AnimatedPressable
      onPress={() => router.push({ pathname: "/chat", params: { conversationId: item.id } })}
      style={{ marginBottom: 12 }}
    >
      <View
        style={[
          elevation.card,
          {
            backgroundColor: "#FFFFFF",
            borderRadius: 20,
            padding: 16,
            flexDirection: "row",
            alignItems: "center",
          },
        ]}
      >
        {/* Avatar */}
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 18,
            backgroundColor: "#D4F0EC",
            justifyContent: "center",
            alignItems: "center",
            marginRight: 14,
          }}
        >
          <Text style={{ fontSize: 18, fontFamily: "Poppins_600SemiBold", color: "#2A9D8F" }}>
            {(item.participant?.name ?? "?")[0].toUpperCase()}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontFamily: "Poppins_600SemiBold", color: "#2D1B0E" }}>
            {item.participant?.name ?? t("messages.chatFallback")}
          </Text>
          <Text style={{ fontSize: 13, fontFamily: "Poppins_400Regular", color: "#8C7A6D", marginTop: 3 }} numberOfLines={1}>
            {item.lastMessage?.content ?? t("messages.noMessages")}
          </Text>
        </View>
        {/* Unread dot placeholder */}
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#E76F51", opacity: 0.4, marginLeft: 8 }} />
      </View>
    </AnimatedPressable>
  );

  if (loading && conversations.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#FFF8E7", paddingTop: insets.top }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#FFF8E7", paddingTop: insets.top }}>
      <BlobShape color="#2A9D8F" size={180} opacity={0.04} variant={3} style={{ top: -30, right: -40 }} />

      <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4 }}>
        <Text style={{ fontSize: 24, fontFamily: "Poppins_600SemiBold", color: "#2D1B0E" }}>
          {t("messages.title")}
        </Text>
        <Text style={{ fontSize: 13, fontFamily: "Poppins_400Regular", color: "#8C7A6D", marginTop: 4 }}>
          Your conversations
        </Text>
      </View>
      <SocketStatusBar />

      <FlashList
        data={conversations}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        estimatedItemSize={80}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100, paddingTop: 8 }}
        ListEmptyComponent={
          <EmptyState message={t("messages.noConversations")} scene="chat" subtitle="Start a conversation with employers" />
        }
      />
    </View>
  );
}
