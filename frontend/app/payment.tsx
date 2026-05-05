import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { NfcAnimation } from '../src/components/NfcAnimation';
import { CartService } from '../src/services/CartService';
import { ReceiptService } from '../src/services/ReceiptService';
import { CartItem } from '../src/models/CartItem';
import { Colors } from '../src/constants/Colors';
import { Texts } from '../src/constants/Texts';

export default function PaymentScreen() {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [processing, setProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    const data = await CartService.getCart();
    setCart(data);
  };

  const handleSimulatePayment = () => {
    handlePaymentSuccess('Simulated');
  };

  const handlePaymentSuccess = async (method: 'NFC' | 'Simulated') => {
    setProcessing(true);
    setTimeout(async () => {
      await ReceiptService.generateReceipt(cart, method);
      await CartService.clearCart();
      setPaymentSuccess(true);
      setTimeout(() => {
        router.replace('/receipts');
      }, 2000);
    }, 1500);
  };

  const total = CartService.calculateTotal(cart);
  const itemCount = CartService.getItemCount(cart);

  if (paymentSuccess) {
    return (
      <View style={styles.container}>
        <View style={styles.successContainer}>
          <Ionicons name="checkmark-circle" size={120} color={Colors.success} />
          <Text style={styles.successText}>{Texts.payment.success}</Text>
          <Text style={styles.successSubtext}>{Texts.receipt.thanksMessage}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{Texts.payment.title}</Text>
        <View style={{ width: 24 }} />
      </View>
      <View style={styles.content}>
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>{Texts.payment.summary}</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{itemCount} {Texts.cart.itemCount}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>{Texts.payment.total}</Text>
            <Text style={styles.totalValue}>{total.toFixed(2)} {Texts.common.tl}</Text>
          </View>
        </View>
        {processing ? (
          <View style={styles.processingContainer}>
            <NfcAnimation />
            <Text style={styles.processingText}>{Texts.payment.processing}</Text>
          </View>
        ) : (
          <>
            <View style={styles.nfcContainer}>
              <NfcAnimation />
              <Text style={styles.nfcPrompt}>Ödeme Hazır</Text>
              <Text style={styles.nfcHint}>
                Aşağıdaki butona basarak ödemeyi tamamlayın
              </Text>
            </View>
            <TouchableOpacity style={styles.simulateButton} onPress={handleSimulatePayment}>
              <Ionicons name="card-outline" size={24} color={Colors.white} />
              <Text style={styles.simulateButtonText}>{Texts.payment.simulateButton}</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: Colors.text },
  content: { flex: 1, padding: 16 },
  summaryContainer: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  summaryTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 16 },
  summaryRow: { marginBottom: 8 },
  summaryLabel: { fontSize: 16, color: Colors.textSecondary },
  divider: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    borderStyle: 'dashed',
    marginVertical: 16,
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 18, fontWeight: '700', color: Colors.text },
  totalValue: { fontSize: 28, fontWeight: '700', color: Colors.primary },
  nfcContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  nfcPrompt: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 24,
    textAlign: 'center',
  },
  nfcHint: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  simulateButton: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  simulateButtonText: { fontSize: 16, fontWeight: '700', color: Colors.white },
  processingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  processingText: { fontSize: 20, fontWeight: '600', color: Colors.primary, marginTop: 24 },
  successContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  successText: { fontSize: 28, fontWeight: '700', color: Colors.success, marginTop: 24, marginBottom: 12 },
  successSubtext: { fontSize: 16, color: Colors.text, textAlign: 'center' },
});
