import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CartItemCard } from '../../src/components/CartItemCard';
import { CartService } from '../../src/services/CartService';
import { CartItem } from '../../src/models/CartItem';
import { Colors } from '../../src/constants/Colors';
import { Texts } from '../../src/constants/Texts';

export default function CartScreen() {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    loadCart();
    const interval = setInterval(loadCart, 1000);
    return () => clearInterval(interval);
  }, []);

  const loadCart = async () => {
    const data = await CartService.getCart();
    setCart(data);
  };

  const handleIncrement = async (item: CartItem) => {
    await CartService.updateQuantity(item.id, item.quantity + 1);
    loadCart();
  };

  const handleDecrement = async (item: CartItem) => {
    if (item.quantity > 1) {
      await CartService.updateQuantity(item.id, item.quantity - 1);
      loadCart();
    }
  };

  const handleDelete = async (item: CartItem) => {
    Alert.alert('Ürünü Sil', `${item.name} sepetten çıkarılsın mı?`, [
      { text: Texts.common.cancel, style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          await CartService.removeItem(item.id);
          loadCart();
        },
      },
    ]);
  };

  const handleProceedToPayment = () => {
    if (cart.length === 0) {
      Alert.alert('Sepet Boş', 'Lütfen sepete ürün ekleyin');
      return;
    }
    router.push('/payment');
  };

  const total = CartService.calculateTotal(cart);
  const itemCount = CartService.getItemCount(cart);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{Texts.cart.title}</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push('/product-selector')}
        >
          <Ionicons name="add" size={24} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {cart.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="cart-outline" size={80} color={Colors.textSecondary} />
          <Text style={styles.emptyText}>{Texts.cart.empty}</Text>
          <Text style={styles.emptyDesc}>{Texts.cart.emptyDesc}</Text>
          <TouchableOpacity
            style={styles.emptyScanBtn}
            onPress={() => router.push('/scanner')}
          >
            <Ionicons name="barcode-outline" size={24} color={Colors.white} />
            <Text style={styles.emptyScanText}>{Texts.cart.scanButton}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={cart}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <CartItemCard
                item={item}
                onIncrement={() => handleIncrement(item)}
                onDecrement={() => handleDecrement(item)}
                onDelete={() => handleDelete(item)}
              />
            )}
            contentContainerStyle={{ paddingVertical: 8 }}
          />
          <View style={styles.footer}>
            <View style={styles.totalRow}>
              <View>
                <Text style={styles.itemCountText}>
                  {itemCount} {Texts.cart.itemCount}
                </Text>
                <Text style={styles.totalLabel}>{Texts.cart.total}</Text>
              </View>
              <Text style={styles.totalValue}>
                {total.toFixed(2)} {Texts.common.tl}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.payBtn}
              onPress={handleProceedToPayment}
            >
              <Text style={styles.payBtnText}>{Texts.cart.proceedToPayment}</Text>
              <Ionicons name="arrow-forward" size={24} color={Colors.white} />
            </TouchableOpacity>
          </View>
        </>
      )}
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
  title: { fontSize: 24, fontWeight: '700', color: Colors.text },
  addBtn: {
    backgroundColor: Colors.primary,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyText: { fontSize: 20, fontWeight: '600', color: Colors.text, marginTop: 16 },
  emptyDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  emptyScanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 24,
    gap: 8,
  },
  emptyScanText: { fontSize: 16, fontWeight: '600', color: Colors.white },
  footer: {
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  itemCountText: { fontSize: 14, color: Colors.textSecondary, marginBottom: 4 },
  totalLabel: { fontSize: 16, fontWeight: '600', color: Colors.text },
  totalValue: { fontSize: 28, fontWeight: '700', color: Colors.primary },
  payBtn: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  payBtnText: { fontSize: 18, fontWeight: '700', color: Colors.white },
});
