import { useRef } from "react";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { WebView } from "react-native-webview";
import { parsePaymentIdFromUrl } from "../_lib/razorpayWeb";
import { elevation } from "../_theme/tokens";

interface CheckoutWebViewProps {
  checkoutUrl: string;
  onPaymentSuccess: (paymentId: string) => void;
  onClose: () => void;
}

export function CheckoutWebView({ checkoutUrl, onPaymentSuccess, onClose }: CheckoutWebViewProps) {
  const handledRef = useRef(false);

  const handleNavigationStateChange = (navState: { url?: string }) => {
    const url = navState?.url;
    if (!url || handledRef.current) return;
    const paymentId = parsePaymentIdFromUrl(url);
    if (paymentId) {
      handledRef.current = true;
      onPaymentSuccess(paymentId);
    }
  };

  return (
    <View
      style={[
        elevation.card,
        {
          flex: 1,
          minHeight: 400,
          borderRadius: 20,
          overflow: "hidden",
          backgroundColor: "#FFFFFF",
        },
      ]}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: "#E8DDD0",
        }}
      >
        <Text style={{ fontSize: 14, fontFamily: "Poppins_600SemiBold", color: "#2D1B0E" }}>
          Complete payment
        </Text>
        <Pressable
          onPress={onClose}
          style={{ backgroundColor: "#FFF5E6", paddingHorizontal: 14, paddingVertical: 6, borderRadius: 12 }}
        >
          <Text style={{ fontSize: 13, fontFamily: "Poppins_500Medium", color: "#E76F51" }}>Close</Text>
        </Pressable>
      </View>
      <WebView
        source={{ uri: checkoutUrl }}
        onNavigationStateChange={handleNavigationStateChange}
        startInLoadingState
        renderLoading={() => (
          <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, justifyContent: "center", alignItems: "center", backgroundColor: "#FFF8E7" }}>
            <ActivityIndicator size="large" color="#E76F51" />
          </View>
        )}
        style={{ flex: 1, minHeight: 380 }}
      />
    </View>
  );
}
