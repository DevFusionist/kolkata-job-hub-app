/**
 * Reusable payment modal: shows catalog (job credits, subscription, AI credits),
 * create-order → Razorpay Checkout → verify. On success calls onSuccess and closes.
 */
import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Platform,
  ActivityIndicator,
  Alert,
  NativeModules,
} from 'react-native';
import { Text, Button } from 'react-native-paper';
import { useTheme } from '../_contexts/ThemeContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import RazorpayCheckout from 'react-native-razorpay';
import api from '../_lib/api';

const RazorpayNative = NativeModules.RNRazorpayCheckout;
import type { ThemeColors } from '../_theme';

export type CatalogItem = {
  itemCode: string;
  label: string;
  amount: number;
  purchaseType: 'credit' | 'subscription' | 'ai_credits';
  creditsPurchased?: number;
  aiTokensPurchased?: number;
  subscriptionDays?: number;
  currency?: string;
};

type PaymentModalProps = {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title?: string;
  subtitle?: string;
  /** Filter catalog: 'job' | 'ai' | 'all' */
  filter?: 'job' | 'ai' | 'all';
};

export function PaymentModal({
  visible,
  onClose,
  onSuccess,
  title = 'Add credits',
  subtitle = 'Choose a plan to continue.',
  filter = 'all',
}: PaymentModalProps) {
  const { colors, isDark } = useTheme();
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [payingItem, setPayingItem] = useState<string | null>(null);

  const loadCatalog = async () => {
    if (!visible) return;
    setLoading(true);
    try {
      const { data } = await api.get('/payments/catalog');
      let items: CatalogItem[] = Array.isArray(data?.items) ? data.items : [];
      if (filter === 'job') {
        items = items.filter((i) => i.purchaseType === 'credit' || i.purchaseType === 'subscription');
      } else if (filter === 'ai') {
        items = items.filter((i) => i.purchaseType === 'ai_credits');
      }
      setCatalog(items);
    } catch {
      setCatalog([]);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (visible) loadCatalog();
  }, [visible, filter]);

  const handlePurchase = async (itemCode: string) => {
    setPayingItem(itemCode);
    try {
      if (!RazorpayNative || typeof RazorpayNative.open !== 'function') {
        Alert.alert(
          'Payment unavailable',
          'Razorpay works only in a native development build. Run: npx expo run:android or npx expo run:ios (not Expo Go or web).'
        );
        setPayingItem(null);
        return;
      }

      const orderRes = await api.post('/payments/create-order', { itemCode });
      const { id: orderId, keyId, amount, currency } = orderRes.data || {};
      if (!orderId || !keyId) throw new Error('Invalid order response');

      const paymentData = await RazorpayCheckout.open({
        description: orderRes.data?.label || 'Payment',
        currency: currency || 'INR',
        key: keyId,
        amount: String(amount || 0),
        name: 'Kolkata Job Hub',
        order_id: orderId,
        theme: { color: '#A04035' },
      });


      const paymentId = paymentData?.razorpay_payment_id;
      const signature = paymentData?.razorpay_signature;
      if (!paymentId || !signature) throw new Error('Payment incomplete');

      await api.post('/payments/verify', {
        razorpayOrderId: orderId,
        razorpayPaymentId: paymentId,
        razorpaySignature: signature,
      });
      onSuccess();
      onClose();
    } catch (e: any) {
      if (e?.code === 0 || e?.description === 'User closed the checkout form') {
        // User cancelled – no error message
      } else {
        const msg = e.response?.data?.detail || e.message || e.description || 'Payment failed';
        Alert.alert('Payment', msg);
      }
    } finally {
      setPayingItem(null);
    }
  };

  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()} style={styles.box}>
          <View style={styles.header}>
            <Text variant="titleLarge" style={styles.title}>{title}</Text>
            <Text variant="bodyMedium" style={styles.subtitle}>{subtitle}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={12}>
              <MaterialCommunityIcons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          {loading ? (
            <View style={styles.loader}>
              <ActivityIndicator size="large" color={colors.terracotta} />
            </View>
          ) : (
            <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
              {catalog.map((item) => {
                const isPaying = payingItem === item.itemCode;
                const isJob = item.purchaseType === 'credit' || item.purchaseType === 'subscription';
                return (
                  <TouchableOpacity
                    key={item.itemCode}
                    style={[styles.item, isJob && styles.itemJob]}
                    onPress={() => handlePurchase(item.itemCode)}
                    disabled={!!payingItem}
                    activeOpacity={0.8}
                  >
                    <View style={styles.itemLeft}>
                      <View style={[styles.itemIcon, { backgroundColor: isJob ? colors.gold + '22' : colors.terracotta + '22' }]}>
                        <MaterialCommunityIcons
                          name={isJob ? 'briefcase-outline' : 'robot-happy-outline'}
                          size={22}
                          color={isJob ? colors.gold : colors.terracotta}
                        />
                      </View>
                      <View>
                        <Text variant="titleSmall" style={styles.itemLabel}>{item.label}</Text>
                        <Text variant="bodySmall" style={styles.itemAmount}>
                          ₹{(item.amount / 100).toLocaleString()}
                          {item.creditsPurchased ? ` · ${item.creditsPurchased} job credits` : ''}
                          {item.aiTokensPurchased ? ` · ${item.aiTokensPurchased.toLocaleString()} AI credits` : ''}
                          {item.subscriptionDays ? ` · ${item.subscriptionDays} days` : ''}
                        </Text>
                      </View>
                    </View>
                    {isPaying ? (
                      <ActivityIndicator size="small" color={colors.terracotta} />
                    ) : (
                      <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textSecondary} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
          <View style={styles.footer}>
            <Button mode="outlined" onPress={onClose} style={styles.cancelBtn} textColor={colors.text}>
              Cancel
            </Button>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

function createStyles(colors: ThemeColors, isDark: boolean) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    box: {
      width: '100%',
      maxWidth: 400,
      maxHeight: '80%',
      backgroundColor: colors.surface,
      borderRadius: 16,
      overflow: 'hidden',
      ...Platform.select({
        ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12 },
        android: { elevation: 8 },
      }),
    },
    header: {
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    title: {
      fontWeight: '700',
      color: colors.terracotta,
      marginBottom: 4,
    },
    subtitle: {
      color: colors.textSecondary,
      marginBottom: 8,
    },
    closeBtn: {
      position: 'absolute',
      top: 16,
      right: 16,
    },
    loader: {
      padding: 40,
      alignItems: 'center',
    },
    scroll: {
      maxHeight: 360,
    },
    scrollContent: {
      padding: 16,
      paddingBottom: 24,
    },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 14,
      marginBottom: 10,
      borderRadius: 12,
      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
      borderWidth: 1,
      borderColor: colors.border,
    },
    itemJob: {
      borderLeftWidth: 4,
      borderLeftColor: colors.gold,
    },
    itemLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    itemIcon: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
    },
    itemLabel: {
      fontWeight: '600',
      color: colors.text,
    },
    itemAmount: {
      color: colors.textSecondary,
      marginTop: 2,
    },
    footer: {
      padding: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    cancelBtn: {
      borderColor: colors.border,
    },
  });
}
