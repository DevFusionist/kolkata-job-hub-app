import { useEffect, useState } from "react";
import {
  View,
  Text,
  Modal,
  Pressable,
  FlatList,
  ActivityIndicator,
  Linking,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Input, InputField } from "@gluestack-ui/themed";
import { usePayment } from "../_hooks/usePayment";
import { useLanguage } from "../_contexts/LanguageContext";
import { CheckoutWebView } from "./CheckoutWebView";
import { AnimatedPressable } from "./ui/AnimatedPressable";
import { WarmButton } from "./ui/WarmButton";
import { IllustrationPlaceholder } from "./ui/IllustrationPlaceholder";
import { elevation } from "../_theme/tokens";
import type { PaymentCatalogItem } from "../_types";

interface PaymentModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

function formatAmount(paise: number): string {
  return `₹${(paise / 100).toFixed(0)}`;
}

function formatRupees(amount: number): string {
  return `₹${amount}`;
}

export function PaymentModal({ visible, onClose, onSuccess }: PaymentModalProps) {
  const { t } = useLanguage();
  const [paymentIdInput, setPaymentIdInput] = useState("");
  const [showInAppWebView, setShowInAppWebView] = useState(false);
  const {
    catalog,
    loading,
    step,
    selectedItem,
    orderId,
    orderDetails,
    error,
    loadCatalog,
    createOrder,
    verify,
    reset,
  } = usePayment(() => {
    onSuccess?.();
    onClose();
  });

  useEffect(() => {
    if (visible) {
      reset();
      setPaymentIdInput("");
      setShowInAppWebView(false);
      loadCatalog();
    }
  }, [visible]);

  const handleSelectItem = async (item: PaymentCatalogItem) => {
    await createOrder(item);
  };

  const handleVerify = async () => {
    const id = paymentIdInput.trim();
    if (!id) return;
    const ok = await verify(id);
    if (ok) setPaymentIdInput("");
  };

  const handleWebViewPaymentSuccess = async (paymentId: string) => {
    const ok = await verify(paymentId);
    if (ok) {
      setShowInAppWebView(false);
      onSuccess?.();
      onClose();
    }
  };

  const renderCatalogItem = ({ item }: { item: PaymentCatalogItem }) => (
    <AnimatedPressable
      onPress={() => handleSelectItem(item)}
      disabled={loading}
      style={{ marginBottom: 12 }}
    >
      <View
        style={[
          elevation.soft,
          {
            backgroundColor: "#FFFFFF",
            borderRadius: 20,
            padding: 18,
            borderLeftWidth: 4,
            borderLeftColor: "#E76F51",
          },
        ]}
      >
        <Text style={{ fontSize: 16, fontFamily: "Poppins_600SemiBold", color: "#2D1B0E" }}>
          {item.name}
        </Text>
        {item.description && (
          <Text style={{ fontSize: 13, fontFamily: "Poppins_400Regular", color: "#8C7A6D", marginTop: 4, lineHeight: 18 }}>
            {item.description}
          </Text>
        )}
        <Text style={{ fontSize: 20, fontFamily: "Poppins_600SemiBold", color: "#E76F51", marginTop: 8 }}>
          {formatAmount(item.amountPaise)}
        </Text>
      </View>
    </AnimatedPressable>
  );

  const renderCheckoutStep = () => {
    if (!orderDetails) return null;
    return (
      <View style={{ flex: 1 }}>
        <View style={{ alignItems: "center", marginBottom: 16 }}>
          <IllustrationPlaceholder scene="payment" size={100} />
        </View>
        <Text style={{ fontSize: 17, fontFamily: "Poppins_600SemiBold", color: "#2D1B0E", marginBottom: 6 }}>
          Complete payment
        </Text>
        <View style={{ backgroundColor: "#FBF0D0", borderRadius: 14, padding: 12, marginBottom: 16 }}>
          <Text style={{ fontSize: 22, fontFamily: "Poppins_600SemiBold", color: "#D4AD4A" }}>
            {orderDetails.currency === "INR" ? formatRupees(orderDetails.amount) : `${orderDetails.amount} ${orderDetails.currency}`}
          </Text>
        </View>

        {orderDetails.checkoutUrl && (
          <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
            <View style={{ flex: 1 }}>
              <WarmButton label="Open in app" onPress={() => setShowInAppWebView(true)} size="md" fullWidth />
            </View>
            <View style={{ flex: 1 }}>
              <WarmButton label="Open in browser" onPress={() => Linking.openURL(orderDetails.checkoutUrl!)} variant="outline" size="md" fullWidth />
            </View>
          </View>
        )}

        {!orderDetails.checkoutUrl && (
          <Text style={{ fontSize: 13, fontFamily: "Poppins_400Regular", color: "#8C7A6D", marginBottom: 12, lineHeight: 18 }}>
            Complete payment via Razorpay. Then paste the Payment ID below to verify.
          </Text>
        )}

        <Text style={{ fontSize: 12, fontFamily: "Poppins_500Medium", color: "#8C7A6D", marginBottom: 6 }}>
          Payment ID (from Razorpay)
        </Text>
        <View style={{ backgroundColor: "#FFF5E6", borderRadius: 16, paddingHorizontal: 16, paddingVertical: 4, borderWidth: 1.5, borderColor: "#E8DDD0", marginBottom: 14 }}>
          <Input variant="underlined" size="md" style={{ borderBottomWidth: 0 }}>
            <InputField
              placeholder="e.g. pay_xxxxx"
              value={paymentIdInput}
              onChangeText={setPaymentIdInput}
              style={{ fontFamily: "Poppins_500Medium", fontSize: 14, color: "#2D1B0E" }}
            />
          </Input>
        </View>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={{ flex: 1 }}>
            <WarmButton label="Cancel" onPress={reset} variant="outline" size="md" fullWidth />
          </View>
          <View style={{ flex: 1 }}>
            <WarmButton label="Verify" onPress={handleVerify} disabled={!paymentIdInput.trim()} size="md" fullWidth variant="teal" />
          </View>
        </View>
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" }} onPress={onClose}>
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            backgroundColor: "#FFF8E7",
            borderTopLeftRadius: 32,
            borderTopRightRadius: 32,
            maxHeight: "85%",
          }}
        >
          {/* Handle bar */}
          <View style={{ alignItems: "center", paddingTop: 12, paddingBottom: 4 }}>
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: "#D4C4B0" }} />
          </View>

          <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={{ fontSize: 20, fontFamily: "Poppins_600SemiBold", color: "#2D1B0E" }}>
              {step === "checkout" ? t("payment.titleCheckout") : t("payment.title")}
            </Text>
            <Pressable onPress={onClose} style={{ padding: 8 }}>
              <Text style={{ color: "#E76F51", fontFamily: "Poppins_600SemiBold", fontSize: 14 }}>Close</Text>
            </Pressable>
          </View>

          <View style={{ padding: 20, paddingBottom: 32, flex: 1 }}>
            {error && (
              <View style={{ backgroundColor: "#FADAD2", borderRadius: 14, padding: 12, marginBottom: 14 }}>
                <Text style={{ color: "#C95A3F", fontSize: 13, fontFamily: "Poppins_500Medium" }}>{error}</Text>
              </View>
            )}

            {showInAppWebView && orderDetails?.checkoutUrl ? (
              <View style={{ flex: 1, minHeight: 420 }}>
                <CheckoutWebView
                  checkoutUrl={orderDetails.checkoutUrl}
                  onPaymentSuccess={handleWebViewPaymentSuccess}
                  onClose={() => setShowInAppWebView(false)}
                />
              </View>
            ) : step === "checkout" ? (
              renderCheckoutStep()
            ) : loading && catalog.length === 0 ? (
              <View style={{ paddingVertical: 48, alignItems: "center" }}>
                <ActivityIndicator size="large" color="#E76F51" />
              </View>
            ) : step === "verifying" ? (
              <View style={{ paddingVertical: 48, alignItems: "center" }}>
                <ActivityIndicator size="large" color="#2A9D8F" />
                <Text style={{ color: "#8C7A6D", marginTop: 8, fontFamily: "Poppins_400Regular", fontSize: 13 }}>
                  Verifying payment...
                </Text>
              </View>
            ) : (
              <FlatList
                data={catalog}
                keyExtractor={(item) => item.id}
                renderItem={renderCatalogItem}
                ListEmptyComponent={
                  <Text style={{ color: "#8C7A6D", textAlign: "center", paddingVertical: 32, fontFamily: "Poppins_400Regular" }}>
                    No plans available.
                  </Text>
                }
              />
            )}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
