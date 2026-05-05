import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ProductService } from '../src/services/ProductService';
import { Colors } from '../src/constants/Colors';

export default function AddManualProductScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [soldBy, setSoldBy] = useState<'weight' | 'unit'>('unit');
  const [category, setCategory] = useState('');

  const handleSave = async () => {
    if (!name || !price) {
      Alert.alert('Hata', 'Ürün adı ve fiyat gerekli!');
      return;
    }

    const item = {
      id: Date.now().toString(),
      name,
      category: category || 'Diğer',
      soldBy,
      ...(soldBy === 'weight'
        ? { pricePerKg: parseFloat(price) }
        : { pricePerUnit: parseFloat(price) }),
    };

    await ProductService.addProduceItem(item as any);
    Alert.alert('Başarılı', 'Ürün kaydedildi!', [
      { text: 'Tamam', onPress: () => router.back() },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manuel Ürün Ekle</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <TextInput
          style={styles.input}
          placeholder="Ürün Adı"
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>Satış Şekli:</Text>
        <View style={styles.radioGroup}>
          <TouchableOpacity
            style={[
              styles.radioButton,
              soldBy === 'weight' && styles.radioButtonActive,
            ]}
            onPress={() => setSoldBy('weight')}
          >
            <Text
              style={[
                styles.radioText,
                soldBy === 'weight' && styles.radioTextActive,
              ]}
            >
              Tartılarak (kg)
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.radioButton,
              soldBy === 'unit' && styles.radioButtonActive,
            ]}
            onPress={() => setSoldBy('unit')}
          >
            <Text
              style={[
                styles.radioText,
                soldBy === 'unit' && styles.radioTextActive,
              ]}
            >
              Adet
            </Text>
          </TouchableOpacity>
        </View>

        <TextInput
          style={styles.input}
          placeholder={soldBy === 'weight' ? 'Fiyat (₺/kg)' : 'Fiyat (₺/adet)'}
          value={price}
          onChangeText={setPrice}
          keyboardType="numeric"
        />

        <TextInput
          style={styles.input}
          placeholder="Kategori (opsiyonel)"
          value={category}
          onChangeText={setCategory}
        />

        <TouchableOpacity style={styles.button} onPress={handleSave}>
          <Text style={styles.buttonText}>Kaydet</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: Colors.white,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  radioGroup: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  radioButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    alignItems: 'center',
  },
  radioButtonActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  radioText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  radioTextActive: {
    color: Colors.white,
  },
  button: {
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
});
