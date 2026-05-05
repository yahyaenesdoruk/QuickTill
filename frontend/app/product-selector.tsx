import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../src/constants/Colors';

export default function ProductSelectorScreen() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Ürün Ekle</Text>
        <View style={{ width: 24 }} />
      </View>
      <View style={styles.content}>
        <TouchableOpacity style={styles.card} onPress={() => router.push('/scanner')}>
          <Ionicons name="barcode" size={64} color={Colors.primary} />
          <Text style={styles.cardTitle}>Barkod Okut</Text>
          <Text style={styles.cardDesc}>Kamera ile barkod tara</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.card} onPress={() => router.push('/product-list')}>
          <Ionicons name="list" size={64} color={Colors.primary} />
          <Text style={styles.cardTitle}>Listeden Seç</Text>
          <Text style={styles.cardDesc}>Arama ile ürün bul</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  title: { fontSize: 20, fontWeight: '700', color: Colors.text },
  content: { flex: 1, padding: 16, gap: 16 },
  card: { backgroundColor: Colors.white, borderRadius: 16, padding: 48, alignItems: 'center', elevation: 3, shadowColor: Colors.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 6 },
  cardTitle: { fontSize: 22, fontWeight: '700', color: Colors.text, marginTop: 20, marginBottom: 8 },
  cardDesc: { fontSize: 15, color: Colors.textSecondary },
});
