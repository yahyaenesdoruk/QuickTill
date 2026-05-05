import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from '../src/context/AuthContext';
import { LanguageProvider } from '../src/context/LanguageContext';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <LanguageProvider>
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="payment" />
          <Stack.Screen name="scanner" />
          <Stack.Screen name="product-selector" />
          <Stack.Screen name="produce" />
          <Stack.Screen name="receipt-detail" />
          <Stack.Screen name="add-barcode-product" />
          <Stack.Screen name="add-manual-product" />
          <Stack.Screen name="product-management" />
          <Stack.Screen name="product-list" />
        </Stack>
      </AuthProvider>
      </LanguageProvider>
    </GestureHandlerRootView>
  );
}
