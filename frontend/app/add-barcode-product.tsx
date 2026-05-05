import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { ProductService } from '../src/services/ProductService';
import { Colors } from '../src/constants/Colors';

export default function AddBarcodeProductScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [barcode, setBarcode] = useState('');
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');

  const handleBarCodeScanned = (result: BarcodeScanningResult) => {
    setScanned(true);
    setBarcode(result.data);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!barcode || !name || !price) {
      Alert.alert('Hata', 'Tüm alanları doldurun!');
      return;
    }
    const product = {
      id: Date.now().toString(),
      barcode,
      name,
      price: parseFloat(price),
      category: category || 'Diğer',
    };
    await ProductService.addProduct(product);
    Alert.alert('Başarılı', 'Ürün kaydedildi!', [{ text: 'Tamam', onPress: () => router.back() }]);
  };

  // Show form (manual or after scan)
  if (showForm || (permission && !permission.granted)) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Barkodlu Ürün Ekle</Text>
          <View style={{ width: 44 }} />
        </View>
        <ScrollView style={styles.form} keyboardShouldPersistTaps="handled">
          {permission && !permission.granted && (
            <TouchableOpacity style={styles.permissionBanner} onPress={() => requestPermission()}>
              <Ionicons name="camera-outline" size={20} color={Colors.primary} />
              <Text style={styles.permissionText}>Kamera izni ver ve barkod tara</Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.primary} />
            </TouchableOpacity>
          )}
          {scanned && barcode ? (
            <View style={styles.scannedInfo}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
              <Text style={styles.scannedText}>Barkod: {barcode}</Text>
            </View>
          ) : null}
          <TextInput
            style={styles.input}
            placeholder="Barkod Numarası"
            value={barcode}
            onChangeText={setBarcode}
            keyboardType="numeric"
          />
          <TextInput style={styles.input} placeholder="Ürün Adı" value={name} onChangeText={setName} />
          <TextInput style={styles.input} placeholder="Fiyat (₺)" value={price} onChangeText={setPrice} keyboardType="numeric" />
          <TextInput style={styles.input} placeholder="Kategori" value={category} onChangeText={setCategory} />
          <TouchableOpacity style={styles.button} onPress={handleSave}>
            <Ionicons name="save-outline" size={20} color={Colors.white} />
            <Text style={styles.buttonText}>Kaydet</Text>
          </TouchableOpacity>
          {permission?.granted && (
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={() => {
                setScanned(false);
                setBarcode('');
                setShowForm(false);
              }}
            >
              <Ionicons name="camera-outline" size={20} color={Colors.primary} />
              <Text style={styles.secondaryButtonText}>Tekrar Tara</Text>
            </TouchableOpacity>
          )}
          {!permission?.granted && (
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={() => setShowForm(true)}
            >
              <Ionicons name="create-outline" size={20} color={Colors.primary} />
              <Text style={styles.secondaryButtonText}>Manuel Gir</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>
    );
  }

  // Permission not yet determined
  if (!permission) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.message}>Kamera izni isteniyor...</Text>
      </View>
    );
  }

  // Camera scanner view
  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39', 'qr'],
        }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      />
      <View style={styles.headerScanner}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitleWhite}>Barkod Okut</Text>
        <TouchableOpacity onPress={() => setShowForm(true)} style={styles.headerBtn}>
          <Ionicons name="create-outline" size={24} color={Colors.white} />
        </TouchableOpacity>
      </View>
      <View style={styles.overlay}>
        <View style={styles.scanAreaBox}>
          <Text style={styles.scanText}>Barkodu okutun</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  centered: { justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingTop: Platform.OS === 'android' ? 48 : 16,
  },
  headerBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  headerScanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingTop: Platform.OS === 'android' ? 48 : 16,
  },
  headerTitleWhite: { fontSize: 18, fontWeight: '700', color: Colors.white },
  message: { fontSize: 16, color: Colors.text, textAlign: 'center' },
  permissionBanner: {
    flexDirection: 'row',
    backgroundColor: '#E8F5E9',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  permissionText: { flex: 1, fontSize: 14, color: Colors.text, fontWeight: '500' },
  scannedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  scannedText: { fontSize: 15, fontWeight: '600', color: Colors.text },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  scanAreaBox: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  scanText: { fontSize: 18, fontWeight: '600', color: Colors.white },
  form: { flex: 1, padding: 16 },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: Colors.white,
  },
  button: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    gap: 8,
  },
  buttonText: { fontSize: 16, fontWeight: '700', color: Colors.white },
  secondaryButton: {
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  secondaryButtonText: { fontSize: 16, fontWeight: '700', color: Colors.primary },
});
