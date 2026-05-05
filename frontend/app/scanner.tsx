import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Platform,
  Animated,
  TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { ProductService } from '../src/services/ProductService';
import { CartService } from '../src/services/CartService';
import { Colors } from '../src/constants/Colors';

type Tab = 'scan' | 'manual' | 'list';

export default function ScannerScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [activeTab, setActiveTab] = useState<Tab>('scan');
  const [scanned, setScanned] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [manualCode, setManualCode] = useState('');
  const [searching, setSearching] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const toastOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    const data = await ProductService.getProducts();
    setProducts(data);
  };

  const showToast = (msg: string, type: 'success' | 'error', duration = 1800) => {
    setToast({ msg, type });
    Animated.sequence([
      Animated.timing(toastOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(duration),
      Animated.timing(toastOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setToast(null));
  };

  const addAndGoBack = async (product: any) => {
    await CartService.addProduct(product);
    showToast(`✓ ${product.name} added to cart`, 'success', 1200);
    setTimeout(() => router.back(), 1400);
  };

  // Camera barcode scan
  const handleBarCodeScanned = async (result: BarcodeScanningResult) => {
    if (scanned) return;
    setScanned(true);
    const product = await ProductService.findProductByBarcode(result.data);
    if (product) {
      await addAndGoBack(product);
    } else {
      showToast(`Not found: ${result.data}`, 'error', 2000);
      setTimeout(() => setScanned(false), 2200);
    }
  };

  // Manual barcode input
  const handleManualSearch = async () => {
    const code = manualCode.trim();
    if (!code) return;
    setSearching(true);
    const product = await ProductService.findProductByBarcode(code);
    setSearching(false);
    if (product) {
      await addAndGoBack(product);
    } else {
      showToast(`No product found for: ${code}`, 'error', 2200);
    }
  };

  // Product list select
  const handleProductSelect = async (product: any) => {
    await addAndGoBack(product);
  };

  const tabItems: { key: Tab; label: string; icon: string }[] = [
    { key: 'scan', label: 'Camera', icon: 'camera-outline' },
    { key: 'manual', label: 'Enter Code', icon: 'keypad-outline' },
    { key: 'list', label: 'Product List', icon: 'list-outline' },
  ];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add to Cart</Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Tab bar */}
      <View style={styles.tabBar}>
        {tabItems.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tab, activeTab === t.key && styles.tabActive]}
            onPress={() => setActiveTab(t.key)}
          >
            <Ionicons
              name={t.icon as any}
              size={18}
              color={activeTab === t.key ? Colors.primary : Colors.textSecondary}
            />
            <Text style={[styles.tabText, activeTab === t.key && styles.tabTextActive]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── CAMERA TAB ── */}
      {activeTab === 'scan' && (
        <View style={{ flex: 1 }}>
          {!permission ? (
            <View style={styles.centered}>
              <Text style={styles.message}>Requesting camera permission...</Text>
            </View>
          ) : !permission.granted ? (
            <View style={styles.centered}>
              <Ionicons name="camera-off-outline" size={64} color={Colors.textSecondary} />
              <Text style={styles.message}>Camera permission required</Text>
              <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
                <Text style={styles.permBtnText}>Grant Permission</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setActiveTab('manual')} style={styles.switchLink}>
                <Text style={styles.switchLinkText}>Or enter barcode manually →</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <CameraView
                style={StyleSheet.absoluteFillObject}
                facing="back"
                barcodeScannerSettings={{
                  barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39', 'qr'],
                }}
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
              />
              {/* Scan frame */}
              <View style={styles.overlay}>
                <View style={styles.scanArea}>
                  <View style={[styles.corner, styles.topLeft]} />
                  <View style={[styles.corner, styles.topRight]} />
                  <View style={[styles.corner, styles.bottomLeft]} />
                  <View style={[styles.corner, styles.bottomRight]} />
                </View>
              </View>
              {/* Instruction */}
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
            </>
          )}
        </View>
      )}

      {/* ── MANUAL ENTRY TAB ── */}
      {activeTab === 'manual' && (
        <View style={styles.manualContainer}>
          <View style={styles.manualCard}>
            <Ionicons name="barcode-outline" size={48} color={Colors.primary} />
            <Text style={styles.manualTitle}>Enter Barcode Number</Text>
            <Text style={styles.manualDesc}>
              Type the digits printed below the barcode
            </Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.manualInput}
                placeholder="e.g. 8690123456789"
                placeholderTextColor={Colors.textSecondary}
                value={manualCode}
                onChangeText={setManualCode}
                keyboardType="number-pad"
                autoFocus
                onSubmitEditing={handleManualSearch}
                returnKeyType="search"
              />
              <TouchableOpacity
                style={[styles.searchBtn, (!manualCode.trim() || searching) && { opacity: 0.5 }]}
                onPress={handleManualSearch}
                disabled={!manualCode.trim() || searching}
              >
                <Ionicons name="search" size={22} color={Colors.white} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Recently added hint */}
          <TouchableOpacity onPress={() => setActiveTab('list')} style={styles.switchLink}>
            <Ionicons name="list-outline" size={16} color={Colors.primary} />
            <Text style={styles.switchLinkText}>Browse all products →</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── PRODUCT LIST TAB ── */}
      {activeTab === 'list' && (
        products.length === 0 ? (
          <View style={styles.centered}>
            <Ionicons name="cube-outline" size={56} color={Colors.textSecondary} />
            <Text style={styles.message}>No products in database</Text>
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
                  <Ionicons name="add-circle" size={28} color={Colors.primary} />
                </View>
              </TouchableOpacity>
            )}
          />
        )
      )}

      {/* Toast */}
      {toast && (
        <Animated.View
          style={[
            styles.toast,
            toast.type === 'success' ? styles.toastSuccess : styles.toastError,
            { opacity: toastOpacity },
          ]}
        >
          <Text style={styles.toastText}>{toast.msg}</Text>
        </Animated.View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16, padding: 32 },
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
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 5,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: Colors.primary },
  tabText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  tabTextActive: { color: Colors.primary },
  // Camera
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  scanArea: { width: 260, height: 200, position: 'relative' },
  corner: { position: 'absolute', width: 36, height: 36, borderColor: Colors.primary },
  topLeft: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4 },
  topRight: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4 },
  bottomLeft: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4 },
  bottomRight: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4 },
  instructionContainer: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 12,
  },
  instruction: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 20,
    paddingVertical: 10,
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
  // Permission
  message: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center' },
  permBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  permBtnText: { fontSize: 15, fontWeight: '700', color: Colors.white },
  switchLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    padding: 8,
  },
  switchLinkText: { fontSize: 14, color: Colors.primary, fontWeight: '600' },
  // Manual
  manualContainer: { flex: 1, padding: 24, gap: 16, alignItems: 'center' },
  manualCard: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  manualTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  manualDesc: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center' },
  inputRow: { flexDirection: 'row', gap: 10, width: '100%', marginTop: 6 },
  manualInput: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.text,
    letterSpacing: 1,
  },
  searchBtn: {
    backgroundColor: Colors.primary,
    width: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Product list
  list: { padding: 16 },
  productCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    padding: 16,
    marginBottom: 10,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  productInfo: { flex: 1 },
  productName: { fontSize: 15, fontWeight: '600', color: Colors.text },
  productBarcode: { fontSize: 12, color: Colors.textSecondary, marginTop: 3 },
  productRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  productPrice: { fontSize: 17, fontWeight: '700', color: Colors.primary },
  // Toast
  toast: {
    position: 'absolute',
    bottom: 40,
    left: 24,
    right: 24,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    alignItems: 'center',
    zIndex: 100,
  },
  toastSuccess: { backgroundColor: Colors.success },
  toastError: { backgroundColor: Colors.error },
  toastText: { fontSize: 15, fontWeight: '600', color: Colors.white, textAlign: 'center' },
});
