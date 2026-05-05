import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, FlatList, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { ProductService } from '../src/services/ProductService';
import { CartService } from '../src/services/CartService';
import { Colors } from '../src/constants/Colors';

export default function ScannerScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [showList, setShowList] = useState(false);
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    const data = await ProductService.getProducts();
    setProducts(data);
  };

  const handleBarCodeScanned = async (result: BarcodeScanningResult) => {
    if (scanned) return;
    setScanned(true);
    const product = await ProductService.findProductByBarcode(result.data);
    if (product) {
      await CartService.addProduct(product);
      Alert.alert('Added', product.name, [{ text: 'OK', onPress: () => router.back() }]);
    } else {
      Alert.alert('Not Found', `Barcode: ${result.data}`, [{ text: 'OK', onPress: () => setScanned(false) }]);
    }
  };

  const handleProductSelect = async (product: any) => {
    await CartService.addProduct(product);
    Alert.alert('Added', product.name, [{ text: 'OK', onPress: () => router.back() }]);
  };

  // Show product list if permission not granted or user chose list view
  if (showList || (permission && !permission.granted)) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Product List</Text>
          {permission && !permission.granted && !showList ? (
            <TouchableOpacity onPress={() => requestPermission()} style={styles.headerBtn}>
              <Ionicons name="camera" size={24} color={Colors.primary} />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 44 }} />
          )}
        </View>
        {permission && !permission.granted && (
          <TouchableOpacity style={styles.permissionBanner} onPress={() => requestPermission()}>
            <Ionicons name="camera-outline" size={20} color={Colors.primary} />
            <Text style={styles.permissionText}>Kamera izni ver ve barkod tara</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.primary} />
          </TouchableOpacity>
        )}
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.productCard} onPress={() => handleProductSelect(item)}>
              <View style={styles.productInfo}>
                <Text style={styles.productName}>{item.name}</Text>
                <Text style={styles.productBarcode}>{item.barcode}</Text>
              </View>
              <Text style={styles.productPrice}>{item.price.toFixed(2)} ₺</Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.list}
        />
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
        <TouchableOpacity onPress={() => setShowList(true)} style={styles.headerBtn}>
          <Ionicons name="list" size={24} color={Colors.white} />
        </TouchableOpacity>
      </View>
      <View style={styles.overlay}>
        <View style={styles.scanArea}>
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
        </View>
      </View>
      <View style={styles.instructionContainer}>
        <Text style={styles.instruction}>Barkodu kare içine hizalayın</Text>
        {scanned && (
          <TouchableOpacity style={styles.rescanButton} onPress={() => setScanned(false)}>
            <Ionicons name="refresh" size={20} color={Colors.white} />
            <Text style={styles.rescanText}>Tekrar Tara</Text>
          </TouchableOpacity>
        )}
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
    padding: 16,
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
  permissionBanner: {
    flexDirection: 'row',
    backgroundColor: '#E8F5E9',
    padding: 14,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 10,
  },
  permissionText: { flex: 1, fontSize: 14, color: Colors.text, fontWeight: '500' },
  message: { fontSize: 16, color: Colors.text, textAlign: 'center' },
  list: { padding: 16 },
  productCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  productInfo: { flex: 1 },
  productName: { fontSize: 16, fontWeight: '600', color: Colors.text },
  productBarcode: { fontSize: 12, color: Colors.textSecondary, marginTop: 4 },
  productPrice: { fontSize: 18, fontWeight: '700', color: Colors.primary },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  scanArea: { width: 280, height: 280, position: 'relative' },
  corner: { position: 'absolute', width: 40, height: 40, borderColor: Colors.primary },
  topLeft: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4 },
  topRight: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4 },
  bottomLeft: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4 },
  bottomRight: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4 },
  instructionContainer: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 12,
  },
  instruction: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  rescanButton: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    gap: 8,
  },
  rescanText: { fontSize: 14, fontWeight: '600', color: Colors.white },
});
