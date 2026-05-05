import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AuthService } from '../../src/services/AuthService';
import { Colors } from '../../src/constants/Colors';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Hata', 'E-posta ve şifre gerekli');
      return;
    }
    setLoading(true);
    try {
      await AuthService.login(email.trim(), password);
      router.push({
        pathname: '/(auth)/verify',
        params: { email: email.trim(), mode: 'login' },
      });
    } catch (e: any) {
      Alert.alert('Giriş Başarısız', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View style={styles.logoCircle}>
            <Ionicons name="cart" size={40} color={Colors.white} />
          </View>
          <Text style={styles.appName}>QuickTill</Text>
          <Text style={styles.subtitle}>Hesabına Giriş Yap</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputRow}>
            <Ionicons name="mail-outline" size={20} color={Colors.textSecondary} style={styles.icon} />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="E-posta"
              placeholderTextColor={Colors.textSecondary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          </View>

          <View style={styles.inputRow}>
            <Ionicons name="lock-closed-outline" size={20} color={Colors.textSecondary} style={styles.icon} />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Şifre"
              placeholderTextColor={Colors.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={Colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.forgotBtn}
            onPress={() =>
              router.push({
                pathname: '/(auth)/verify',
                params: { email: email.trim(), mode: 'forgot' },
              })
            }
          >
            <Text style={styles.forgotText}>Şifremi Unuttum</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.buttonText}>Giriş Yap</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.link}
            onPress={() => router.replace('/(auth)/register')}
          >
            <Text style={styles.linkText}>
              Hesabın yok mu?{' '}
              <Text style={styles.linkBold}>Kayıt Ol</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  content: { padding: 24, paddingTop: 80 },
  header: { alignItems: 'center', marginBottom: 48 },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  appName: { fontSize: 28, fontWeight: '800', color: Colors.primary },
  subtitle: { fontSize: 16, color: Colors.textSecondary, marginTop: 4 },
  form: { gap: 14 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  icon: { marginRight: 10 },
  input: { fontSize: 15, color: Colors.text },
  forgotBtn: { alignSelf: 'flex-end' },
  forgotText: { fontSize: 13, color: Colors.primary, fontWeight: '600' },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { fontSize: 16, fontWeight: '700', color: Colors.white },
  link: { alignItems: 'center', marginTop: 8 },
  linkText: { fontSize: 14, color: Colors.textSecondary },
  linkBold: { color: Colors.primary, fontWeight: '700' },
});
