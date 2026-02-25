import api from "../_lib/api";
import type { PaymentCatalogItem, Entitlements } from "../_types";

export const paymentService = {
  async getCatalog(): Promise<PaymentCatalogItem[]> {
    const { data } = await api.get<PaymentCatalogItem[]>("/payments/catalog");
    return Array.isArray(data) ? data : [];
  },

  async getEntitlements(): Promise<Entitlements> {
    const { data } = await api.get<Entitlements>("/payments/entitlements");
    return data;
  },

  async createOrder(itemId: string): Promise<{
    orderId: string;
    amount: number;
    currency: string;
    checkoutUrl?: string;
  }> {
    const { data } = await api.post<{
      orderId: string;
      amount: number;
      currency: string;
      checkoutUrl?: string;
    }>("/payments/create-order", { itemId });
    return data;
  },

  async verifyOrder(orderId: string, razorpayPaymentId: string): Promise<{ success: boolean }> {
    const { data } = await api.post<{ success: boolean }>("/payments/verify", {
      orderId,
      razorpayPaymentId,
    });
    return data;
  },
};
