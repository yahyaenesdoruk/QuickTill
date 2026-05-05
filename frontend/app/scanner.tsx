import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Platform, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { ProductService } from '../src/services/ProductService';
import { CartService } from '../src/services/CartService';
import { Colors } from '../src/constants/Colors';

type ToastType = 'success' | 'error' | 'info';

export default function ScannerScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [showList, setShowList] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [toast, setToast] = useState<{ msg: string; type: ToastType } | null>(null);
  const toastOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    const data = await ProductService.getProducts();
    setProducts(data);
  };

  const showToast = (msg: string, type: ToastType, duration = 1800) => {
    setToast({ msg, type });
    Animated.sequence([
      Animated.timing(toastOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(duration),
      Animated.timing(toastOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setToast(null));
  };

  const handleBarCodeScanned = async (result: BarcodeScanningResult) => {
    if (scanned) return;
    setScanned(true);

    const product = await ProductService.findProductByBarcode(result.data);
    if (product) {
      await CartService.addProduct(product);
      showToast(`✓ ${product.name} added to cart`, 'success', 1200);
      setTimeout(() => router.back(), 1400);
    } else {
      showToast(`No product found for barcode: ${result.data}`, 'error', 2000);
      setTimeout(() => setScanned(false), 2200);
    }
  };

  const handleProductSelect = async (product: any) => {
    await CartService.addProduct(product);
    showToast(`✓ ${product.name} added to cart`, 'success', 1200);
    setTimeout(() => router.back(), 1400);
  };

  // Product list view (fallback or user-requested)
  if (showList || (permission && !permission.granted)) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Product List</Text>
          {permission && !permission.granted ? (
            <TouchableOpacity onPress={requestPermission} style={styles.headerBtn}>
              <Ionicons name="camera-outline" size={24} color={Colors.primary} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => setShowList(false)} style={styles.headerBtn}>
              <Ionicons name="barcode-outline" size={24} color={Colors.primary} />
            </TouchableOpacity>
          )}
        </View>

        {permission && !permission.granted && (
          <TouchableOpacity style={styles.permissionBanner} onPress={requestPermission}>
            <Ionicons name="camera-outline" size={20} color={Colors.primary} />
            <Text style={styles.permissionText}>Grant camera access to scan barcodes</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.primary} />
          </TouchableOpacity>
        )}

        {products.length === 0 ? (
          <View style={styles.emptyList}>
            <Ionicons name="cube-outline" size={56} color={Colors.textSecondary} />
            <Text style={styles.emptyText}>No products in database</Text>
          </View>
        ) : (
          <FlatList
            data={products}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.productCard} onPress={() => handleProductSelect(item)}>
                <View style={styles.productInfo}>
                  <Text style={styles.productName}>{item.name}</Text>
                  <Text style={styles.productBarcode}>{item.barcode}</Text>
                </View>
                <View style={styles.productRight}>
                  <Text style={styles.productPrice}>{item.price.toFixed(2)} ₺</Text>
                  <Ionicons name="add-circle" size={26} color={Colors.primary} />
                </View>
              </TouchableOpacity>
            )}
          />
        )}

        {/* Toast */}
        {toast && (
          <Animated.View style={[styles.toast, styles[`toast_${toast.type}`], { opacity: toastOpacity }]}>
            <Text style={styles.toastText}>{toast.msg}</Text>
          </Animated.View>
        )}
      </View>
    );
  }

  // Waiting for permission
  if (!permission) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.message}>Requesting camera permission...</Text>
      </View>
    );
  }

  // Camera scanner
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

      {/* Header overlay */}
      <View style={styles.headerScanner}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitleWhite}>Scan Barcode</Text>
        <TouchableOpacity onPress={() => setShowList(true)} style={styles.headerBtn}>
          <Ionicons name="list" size={24} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {/* Scan frame */}
      <View style={styles.overlay}>
        <View style={styles.scanArea}>
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
        </View>
      </View>

      {/* Instructions */}
      <View style={styles.instructionContainer}>
        {!scanned && (
          <Text style={styles.instruction}>Align the barcode within the frame</Text>
        )}
        {scanned && !toast && (
          <TouchableOpacity style={styles.rescanButton} onPress={() => setScanned(false)}>
            <Ionicons name="refresh" size={20} color={Colors.white} />
            <Text style={styles.rescanText}>Scan Again</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Toast overlay */}
      {toast && (
        <Animated.View style={[styles.toast, styles[`toast_${toast.type}`], { opacity: toastOpacity }]}>
          <Text style={styles.toastText}>{toast.msg}</Text>
        </Animated.View>
      )}
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
    paddingTop: Platform.OS === 'android' ? 48 : 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  headerScanner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 48 : 56,
    paddingBottom: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  headerTitleWhite: { fontSize: 18, fontWeight: '700', color: Colors.white },
  permissionBanner: {
    flexDirection: 'row',
    backgroundColor: `${Colors.primary}15`,
    padding: 14,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: `${Colors.primary}30`,
  },
  permissionText: { flex: 1, fontSize: 14, color: Colors.text, fontWeight: '500' },
  message: { fontSize: 16, color: Colors.text, textAlign: 'center' },
  list: { padding: 16 },
  emptyList: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  emptyText: { fontSize: 16, color: Colors.textSecondary },
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
  productRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
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
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 12,
  },
  instruction: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.white,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    overflow: 'hidden',
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
  toast: {
    position: 'absolute',
    bottom: 60,
    left: 24,
    right: 24,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    alignItems: 'center',
    zIndex: 100,
  },
  toast_success: { backgroundColor: Colors.success },
  toast_error: { backgroundColor: Colors.error },
  toast_info: { backgroundColor: Colors.primary },
  toastText: { fontSize: 15, fontWeight: '600', color: Colors.white, textAlign: 'center' },
});
