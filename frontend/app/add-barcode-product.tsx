import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  Platform,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCameraPermissions } from 'expo-camera';
import BarcodeCamera from '../src/components/BarcodeCamera';
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
  const [saving, setSaving] = useState(false);

  const toastOpacity = useRef(new Animated.Value(0)).current;
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    Animated.sequence([
      Animated.timing(toastOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(1200),
      Animated.timing(toastOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setToast(''));
  };

  const handleBarCodeScanned = (code: string) => {
    if (scanned) return;
    setScanned(true);
    setBarcode(code);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!barcode || !name || !price) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    setSaving(true);
    try {
      const product = {
        id: Date.now().toString(),
        barcode,
        name,
        price: parseFloat(price),
        category: category || 'General',
      };
      await ProductService.addProduct(product);
      showToast('✓ Product saved!');
      setTimeout(() => router.back(), 1500);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  };

  // Form view (after scan or manual entry)
  if (showForm) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Product</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView style={styles.form} keyboardShouldPersistTaps="handled">
          {scanned && barcode ? (
            <View style={styles.scannedInfo}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
              <Text style={styles.scannedText}>Barcode: {barcode}</Text>
            </View>
          ) : null}

          <Text style={styles.label}>Barcode *</Text>
          <TextInput
            style={styles.input}
            placeholder="Barcode number"
            placeholderTextColor={Colors.textSecondary}
            value={barcode}
            onChangeText={setBarcode}
            keyboardType="numeric"
          />

          <Text style={styles.label}>Product Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Milk 1L"
            placeholderTextColor={Colors.textSecondary}
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.label}>Price (₺) *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 24.90"
            placeholderTextColor={Colors.textSecondary}
            value={price}
            onChangeText={setPrice}
            keyboardType="numeric"
          />

          <Text style={styles.label}>Category</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Dairy, Drinks..."
            placeholderTextColor={Colors.textSecondary}
            value={category}
            onChangeText={setCategory}
          />

          <TouchableOpacity
            style={[styles.button, saving && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={saving}
          >
            <Ionicons name="save-outline" size={20} color={Colors.white} />
            <Text style={styles.buttonText}>{saving ? 'Saving...' : 'Save Product'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => { setScanned(false); setBarcode(''); setShowForm(false); }}
          >
            <Ionicons name="camera-outline" size={20} color={Colors.primary} />
            <Text style={styles.secondaryButtonText}>Scan Again</Text>
          </TouchableOpacity>
        </ScrollView>

        {toast ? (
          <Animated.View style={[styles.toast, { opacity: toastOpacity }]}>
            <Text style={styles.toastText}>{toast}</Text>
          </Animated.View>
        ) : null}
      </View>
    );
  }

  // Permission not granted (native only — on web, BarcodeCamera handles it)
  if (Platform.OS !== 'web' && permission && !permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Product</Text>
          <View style={{ width: 44 }} />
        </View>
        <View style={styles.centered}>
          <Ionicons name="camera-off-outline" size={64} color={Colors.textSecondary} />
          <Text style={styles.message}>Camera permission required</Text>
          <TouchableOpacity style={styles.button} onPress={requestPermission}>
            <Text style={styles.buttonText}>Grant Permission</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={() => setShowForm(true)}>
            <Ionicons name="create-outline" size={20} color={Colors.primary} />
            <Text style={styles.secondaryButtonText}>Enter Manually</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Camera scanner
  return (
    <View style={styles.container}>
      <BarcodeCamera
        onScanned={handleBarCodeScanned}
        active={!scanned}
      />

      {/* Header overlay */}
      <View style={styles.headerScanner}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitleWhite}>Scan Barcode</Text>
        <TouchableOpacity onPress={() => setShowForm(true)} style={styles.headerBtn}>
          <Ionicons name="create-outline" size={24} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {/* Scan frame */}
      <View style={styles.overlay} pointerEvents="none">
        <View style={styles.scanArea}>
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
        </View>
        <Text style={styles.scanText}>Align barcode within the frame</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16, padding: 32 },
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
    position: 'absolute',
    top: 0, left: 0, right: 0,
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
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
  },
  scanArea: { width: 260, height: 180, position: 'relative' },
  corner: { position: 'absolute', width: 36, height: 36, borderColor: Colors.primary },
  topLeft: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4 },
  topRight: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4 },
  bottomLeft: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4 },
  bottomRight: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4 },
  scanText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    overflow: 'hidden',
  },
  message: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center' },
  scannedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${Colors.success}18`,
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: `${Colors.success}40`,
  },
  scannedText: { fontSize: 14, fontWeight: '600', color: Colors.text },
  label: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginBottom: 6, marginTop: 4 },
  form: { flex: 1, padding: 16 },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 14,
    backgroundColor: Colors.white,
    color: Colors.text,
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
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    gap: 8,
  },
  secondaryButtonText: { fontSize: 15, fontWeight: '600', color: Colors.primary },
  toast: {
    position: 'absolute',
    bottom: 40,
    left: 24,
    right: 24,
    backgroundColor: Colors.success,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    alignItems: 'center',
    zIndex: 100,
  },
  toastText: { fontSize: 15, fontWeight: '600', color: Colors.white },
});
