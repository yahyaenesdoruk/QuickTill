import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AuthService } from '../../src/services/AuthService';
import { Colors } from '../../src/constants/Colors';

export default function RegisterScreen() {
  const router = useRouter();
  const [form, setForm] = useState({
    email: '',
    name: '',
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const update = (field: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleRegister = async () => {
    const { email, name, username, password, confirmPassword } = form;
    if (!email || !name || !username || !password) {
      Alert.alert('Hata', 'Tüm alanları doldurun');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    if (username.length < 3) {
      Alert.alert('Error', 'Username must be at least 3 characters');
      return;
    }
    if (!/^[a-z0-9_]+$/i.test(username)) {
      Alert.alert('Error', 'Username can only contain letters, numbers and _');
      return;
    }
    setLoading(true);
    try {
      await AuthService.register(email.trim(), name.trim(), username.trim(), password);
      router.push({
        pathname: '/(auth)/verify',
        params: { email: email.trim(), mode: 'register' },
      });
    } catch (e: any) {
      Alert.alert('Hata', e.message);
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
          <Text style={styles.subtitle}>Create Account</Text>
        </View>

        <View style={styles.form}>
          <InputField
            icon="person-outline"
            placeholder="Ad Soyad"
            value={form.name}
            onChangeText={(v) => update('name', v)}
          />
          <InputField
            icon="at-outline"
            placeholder="Username"
            value={form.username}
            onChangeText={(v) => update('username', v.toLowerCase().replace(/\s/g, ''))}
            autoCapitalize="none"
          />
          <InputField
            icon="mail-outline"
            placeholder="Email"
            value={form.email}
            onChangeText={(v) => update('email', v)}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <View style={styles.inputRow}>
            <Ionicons name="lock-closed-outline" size={20} color={Colors.textSecondary} style={styles.icon} />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Şifre (en az 6 karakter)"
              placeholderTextColor={Colors.textSecondary}
              value={form.password}
              onChangeText={(v) => update('password', v)}
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
          <InputField
            icon="lock-closed-outline"
            placeholder="Confirm Password"
            value={form.confirmPassword}
            onChangeText={(v) => update('confirmPassword', v)}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.buttonText}>Sign Up</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.link}
            onPress={() => router.replace('/(auth)/login')}
          >
            <Text style={styles.linkText}>
              Already have an account?{' '}
              <Text style={styles.linkBold}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function InputField({
  icon,
  secureTextEntry,
  ...props
}: {
  icon: string;
  placeholder: string;
  value: string;
  onChangeText: (v: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: any;
  autoCapitalize?: any;
}) {
  return (
    <View style={styles.inputRow}>
      <Ionicons
        name={icon as any}
        size={20}
        color={Colors.textSecondary}
        style={styles.icon}
      />
      <TextInput
        style={[styles.input, { flex: 1 }]}
        placeholderTextColor={Colors.textSecondary}
        secureTextEntry={secureTextEntry}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  content: { padding: 24, paddingTop: 60 },
  header: { alignItems: 'center', marginBottom: 40 },
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
