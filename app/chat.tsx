import { useState } from "react";
import { View, Text, FlatList, KeyboardAvoidingView, Platform, Pressable } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Input, InputField } from "@gluestack-ui/themed";
import { useChat } from "./_hooks/useChat";
import { useAuth } from "./_contexts/AuthContext";
import { useSocket } from "./_contexts/SocketContext";
import { useLanguage } from "./_contexts/LanguageContext";
import { formatRelative } from "./_lib/date";
import { SocketStatusBar } from "./_components/SocketStatusBar";
import { EmptyState } from "./_components/EmptyState";
import { elevation } from "./_theme/tokens";

export default function ChatScreen() {
  const { conversationId, userId } = useLocalSearchParams<{ conversationId?: string; userId?: string }>();
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { user } = useAuth();
  const { messages, loading, send } = useChat(conversationId, userId);
  const [input, setInput] = useState("");
  const { isConnected } = useSocket();

  const sendMessage = async () => {
    if (!input.trim()) return;
    const content = input;
    setInput("");
    await send(content);
  };

  const renderItem = ({ item }: { item: { id: string; senderId: string; content: string; createdAt: string } }) => {
    const isMe = item.senderId === user?.id;
    return (
      <View style={{ marginBottom: 10, alignItems: isMe ? "flex-end" : "flex-start" }}>
        {isMe ? (
          <LinearGradient
            colors={["#E76F51", "#F4A261"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ maxWidth: "80%", paddingHorizontal: 16, paddingVertical: 12, borderRadius: 20, borderBottomRightRadius: 6 }}
          >
            <Text style={{ color: "#FFFFFF", fontSize: 14, fontFamily: "Poppins_400Regular", lineHeight: 20 }}>
              {item.content}
            </Text>
            <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 10, fontFamily: "Poppins_400Regular", marginTop: 4 }}>
              {formatRelative(item.createdAt)}
            </Text>
          </LinearGradient>
        ) : (
          <View
            style={[
              elevation.soft,
              {
                maxWidth: "80%",
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderRadius: 20,
                borderBottomLeftRadius: 6,
                backgroundColor: "#FFFFFF",
              },
            ]}
          >
            <Text style={{ color: "#2D1B0E", fontSize: 14, fontFamily: "Poppins_400Regular", lineHeight: 20 }}>
              {item.content}
            </Text>
            <Text style={{ color: "#8C7A6D", fontSize: 10, fontFamily: "Poppins_400Regular", marginTop: 4 }}>
              {formatRelative(item.createdAt)}
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#FFF8E7", paddingTop: insets.top }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={80}
    >
      {/* Header */}
      <View
        style={[
          elevation.soft,
          {
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 20,
            paddingVertical: 12,
            backgroundColor: "#FFFFFF",
            borderBottomLeftRadius: 20,
            borderBottomRightRadius: 20,
          },
        ]}
      >
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 17, fontFamily: "Poppins_600SemiBold", color: "#2D1B0E" }}>
            Chat
          </Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: isConnected ? "#2A9D8F" : "#E76F51" }} />
          <Text style={{ fontSize: 11, fontFamily: "Poppins_500Medium", color: "#8C7A6D" }}>
            {isConnected ? t("common.connected") : t("common.connecting")}
          </Text>
        </View>
      </View>
      <SocketStatusBar />

      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
        ListEmptyComponent={
          loading ? null : <EmptyState message={t("chat.noMessagesYet")} scene="chat" subtitle="Send a message to start the conversation" />
        }
      />

      {/* Input bar */}
      <View
        style={[
          elevation.soft,
          {
            flexDirection: "row",
            alignItems: "flex-end",
            padding: 12,
            gap: 10,
            backgroundColor: "#FFFFFF",
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingBottom: insets.bottom + 12,
          },
        ]}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "#FFF5E6",
            borderRadius: 22,
            paddingHorizontal: 16,
            paddingVertical: 4,
            minHeight: 44,
            borderWidth: 1.5,
            borderColor: "#E8DDD0",
          }}
        >
          <Input variant="underlined" size="lg" style={{ borderBottomWidth: 0 }}>
            <InputField
              placeholder={t("chat.typeMessage")}
              value={input}
              onChangeText={setInput}
              onSubmitEditing={sendMessage}
              multiline
              maxLength={2000}
              style={{ fontFamily: "Poppins_400Regular", fontSize: 14, color: "#2D1B0E" }}
            />
          </Input>
        </View>
        <Pressable
          onPress={sendMessage}
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            justifyContent: "center",
            alignItems: "center",
            overflow: "hidden",
          }}
        >
          <LinearGradient
            colors={["#E76F51", "#F4A261"]}
            style={{ width: 44, height: 44, borderRadius: 22, justifyContent: "center", alignItems: "center" }}
          >
            <Text style={{ color: "#FFFFFF", fontSize: 18 }}>↑</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
