import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ProductService } from '../src/services/ProductService';
import { Colors } from '../src/constants/Colors';

export default function ProductManagementScreen() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [produceItems, setProduceItems] = useState<any[]>([]);
  const [tab, setTab] = useState<'barcode' | 'produce'>('barcode');

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    const p = await ProductService.getProducts();
    const pr = await ProductService.getProduceItems();
    setProducts(p);
    setProduceItems(pr);
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      const filtered = products.filter(p => p.id !== id);
      await ProductService.saveProducts(filtered);
      loadProducts();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleDeleteProduce = async (id: string) => {
    try {
      const filtered = produceItems.filter(p => p.id !== id);
      await ProductService.saveProduceItems(filtered);
      loadProducts();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Product Management</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tab === 'barcode' && styles.tabActive]}
          onPress={() => setTab('barcode')}
        >
          <Text style={[styles.tabText, tab === 'barcode' && styles.tabTextActive]}>
            Barcoded ({products.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'produce' && styles.tabActive]}
          onPress={() => setTab('produce')}
        >
          <Text style={[styles.tabText, tab === 'produce' && styles.tabTextActive]}>
            No Barcode ({produceItems.length})
          </Text>
        </TouchableOpacity>
      </View>

      {tab === 'barcode' ? (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.item}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemBarcode}>Barcode: {item.barcode}</Text>
                <Text style={styles.itemCategory}>{item.category}</Text>
              </View>
              <View style={styles.itemRight}>
                <Text style={styles.itemPrice}>{item.price.toFixed(2)} ₺</Text>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteProduct(item.id)}
                >
                  <Ionicons name="trash-outline" size={24} color={Colors.error} />
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="cube-outline" size={64} color={Colors.textSecondary} />
              <Text style={styles.emptyText}>No products found</Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={produceItems}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.item}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemCategory}>{item.category}</Text>
              </View>
              <View style={styles.itemRight}>
                <Text style={styles.itemPrice}>
                  {item.soldBy === 'weight'
                    ? `${item.pricePerKg?.toFixed(2)} ₺/kg`
                    : `${item.pricePerUnit?.toFixed(2)} ₺/unit`}
                </Text>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteProduce(item.id)}
                >
                  <Ionicons name="trash-outline" size={24} color={Colors.error} />
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="leaf-outline" size={64} color={Colors.textSecondary} />
              <Text style={styles.emptyText}>No products found</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  tabs: { flexDirection: 'row', backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabActive: { borderBottomWidth: 3, borderBottomColor: Colors.primary },
  tabText: { fontSize: 15, fontWeight: '600', color: Colors.textSecondary },
  tabTextActive: { color: Colors.primary },
  item: { flexDirection: 'row', backgroundColor: Colors.white, padding: 16, marginHorizontal: 16, marginTop: 12, borderRadius: 12, alignItems: 'center' },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 16, fontWeight: '600', color: Colors.text, marginBottom: 4 },
  itemBarcode: { fontSize: 12, color: Colors.textSecondary, marginBottom: 2 },
  itemCategory: { fontSize: 12, color: Colors.primary },
  itemRight: { alignItems: 'flex-end', gap: 8 },
  itemPrice: { fontSize: 16, fontWeight: '700', color: Colors.text },
  deleteButton: { padding: 4 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 80 },
  emptyText: { fontSize: 16, color: Colors.textSecondary, marginTop: 16 },
});
