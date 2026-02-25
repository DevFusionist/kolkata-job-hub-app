import { useState, useCallback } from "react";
import { paymentService } from "../_services/paymentService";
import type { PaymentCatalogItem } from "../_types";

type PaymentStep = "catalog" | "checkout" | "verifying";

export function usePayment(onSuccess?: () => void) {
  const [catalog, setCatalog] = useState<PaymentCatalogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<PaymentStep>("catalog");
  const [selectedItem, setSelectedItem] = useState<PaymentCatalogItem | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [orderDetails, setOrderDetails] = useState<{
    orderId: string;
    amount: number;
    currency: string;
    checkoutUrl?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadCatalog = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const items = await paymentService.getCatalog();
      setCatalog(items);
    } catch (e: unknown) {
      setError((e as Error)?.message ?? "Failed to load catalog");
      setCatalog([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const createOrder = useCallback(
    async (
      item: PaymentCatalogItem
    ): Promise<{ orderId: string; amount: number; currency: string; checkoutUrl?: string } | null> => {
      setLoading(true);
      setError(null);
      setSelectedItem(item);
      try {
        const order = await paymentService.createOrder(item.id);
        setOrderId(order.orderId);
        setOrderDetails({
          orderId: order.orderId,
          amount: order.amount,
          currency: order.currency,
          checkoutUrl: order.checkoutUrl,
        });
        setStep("checkout");
        return order;
      } catch (e: unknown) {
        setError((e as Error)?.message ?? "Failed to create order");
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const verify = useCallback(
    async (razorpayPaymentId: string): Promise<boolean> => {
      if (!orderId) return false;
      setStep("verifying");
      setError(null);
      try {
        const { success } = await paymentService.verifyOrder(orderId, razorpayPaymentId);
        if (success) {
          setStep("catalog");
          setOrderId(null);
          setOrderDetails(null);
          setSelectedItem(null);
          onSuccess?.();
          return true;
        }
      } catch (e: unknown) {
        setError((e as Error)?.message ?? "Verification failed");
      } finally {
        setStep("catalog");
      }
      return false;
    },
    [orderId, onSuccess]
  );

  const reset = useCallback(() => {
    setStep("catalog");
    setSelectedItem(null);
    setOrderId(null);
    setOrderDetails(null);
    setError(null);
  }, []);

  return {
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
  };
}
