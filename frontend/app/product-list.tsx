import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ProductService } from '../src/services/ProductService';
import { CartService } from '../src/services/CartService';
import { Colors } from '../src/constants/Colors';

export default function ProductListScreen() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    const data = await ProductService.getProducts();
    setProducts(data);
  };

  const filtered = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.barcode.includes(search)
  );

  const handleSelect = async (product: any) => {
    await CartService.addProduct(product);
    Alert.alert('Eklendi', product.name, [{ text: 'Tamam', onPress: () => router.back() }]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Ürün Listesi</Text>
        <View style={{ width: 24 }} />
      </View>
      <View style={styles.searchBox}>
        <Ionicons name="search" size={20} color={Colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Ürün ara..."
          value={search}
          onChangeText={setSearch}
        />
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.item} onPress={() => handleSelect(item)}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemBarcode}>{item.barcode}</Text>
            </View>
            <Text style={styles.itemPrice}>{item.price.toFixed(2)} ₺</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Ürün bulunamadı</Text>
          </View>
        }
      />
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  title: { fontSize: 20, fontWeight: '700', color: Colors.text },
  searchBox: { flexDirection: 'row', alignItems: 'center', margin: 16, padding: 12, backgroundColor: Colors.white, borderRadius: 12, borderWidth: 1, borderColor: Colors.border },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 16 },
  item: { flexDirection: 'row', backgroundColor: Colors.white, padding: 16, marginHorizontal: 16, marginBottom: 8, borderRadius: 12, alignItems: 'center' },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 16, fontWeight: '600', color: Colors.text },
  itemBarcode: { fontSize: 12, color: Colors.textSecondary, marginTop: 4 },
  itemPrice: { fontSize: 18, fontWeight: '700', color: Colors.primary },
  empty: { padding: 40, alignItems: 'center' },
  emptyText: { fontSize: 16, color: Colors.textSecondary },
});
