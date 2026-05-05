import React, { useState, useRef, useEffect } from 'react';
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
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AuthService } from '../../src/services/AuthService';
import { useAuth } from '../../src/context/AuthContext';
import { Colors } from '../../src/constants/Colors';

// mode: 'register' | 'login' | 'forgot'
export default function VerifyScreen() {
  const router = useRouter();
  const { setUser } = useAuth();
  const { email, mode } = useLocalSearchParams<{
    email: string;
    mode: 'register' | 'login' | 'forgot';
  }>();

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);

  // For forgot password: extra fields
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState<'otp' | 'newpw'>(mode === 'forgot' ? 'otp' : 'otp');

  const inputs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [countdown]);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste
      const digits = value.replace(/\D/g, '').slice(0, 6).split('');
      const newOtp = [...otp];
      digits.forEach((d, i) => {
        if (index + i < 6) newOtp[index + i] = d;
      });
      setOtp(newOtp);
      const next = Math.min(index + digits.length, 5);
      inputs.current[next]?.focus();
      return;
    }
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) inputs.current[index + 1]?.focus();
  };

  const handleBackspace = (index: number) => {
    if (!otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const code = otp.join('');

  const handleVerify = async () => {
    if (code.length < 6) {
      Alert.alert('Hata', '6 haneli kodu eksiksiz girin');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'register') {
        const user = await AuthService.verifyRegister(email, code);
        setUser(user);
        router.replace('/(tabs)/');
      } else if (mode === 'login') {
        const user = await AuthService.verifyLogin(email, code);
        setUser(user);
        router.replace('/(tabs)/');
      } else if (mode === 'forgot') {
        // First step verified → go to new password step
        setStep('newpw');
        setLoading(false);
        return;
      }
    } catch (e: any) {
      Alert.alert('Hata', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (newPassword !== confirmPassword) {
      Alert.alert('Hata', 'Şifreler eşleşmiyor');
      return;
    }
    setLoading(true);
    try {
      await AuthService.resetPassword(email, code, newPassword);
      Alert.alert('Başarılı', 'Şifreniz değiştirildi. Giriş yapabilirsiniz.', [
        { text: 'Tamam', onPress: () => router.replace('/(auth)/login') },
      ]);
    } catch (e: any) {
      Alert.alert('Hata', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    try {
      if (mode === 'register') {
        // Re-trigger would need the full form data, just show info
        Alert.alert('Bilgi', 'Kodu almak için tekrar kayıt olma ekranına dönün.');
      } else if (mode === 'login' || mode === 'forgot') {
        if (mode === 'login') {
          Alert.alert('Bilgi', 'Yeni kod için giriş ekranına dönüp tekrar deneyin.');
        } else {
          await AuthService.forgotPassword(email);
          Alert.alert('Gönderildi', 'Yeni kod e-postanıza gönderildi.');
        }
      }
      setCountdown(60);
    } catch (e: any) {
      Alert.alert('Hata', e.message);
    } finally {
      setResendLoading(false);
    }
  };

  const titles: Record<string, string> = {
    register: 'E-posta Doğrulama',
    login: 'Giriş Doğrulama',
    forgot: 'Şifre Sıfırlama',
  };

  if (step === 'newpw') {
    return (
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: Colors.surface }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.container}>
          <TouchableOpacity style={styles.backBtn} onPress={() => setStep('otp')}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <View style={styles.iconWrap}>
            <Ionicons name="lock-open-outline" size={56} color={Colors.primary} />
          </View>
          <Text style={styles.title}>Yeni Şifre Belirle</Text>
          <View style={styles.pwForm}>
            <TextInput
              style={styles.pwInput}
              placeholder="Yeni şifre"
              placeholderTextColor={Colors.textSecondary}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
            />
            <TextInput
              style={styles.pwInput}
              placeholder="Yeni şifre tekrar"
              placeholderTextColor={Colors.textSecondary}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleResetPassword}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.buttonText}>Şifreyi Güncelle</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.surface }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>

        <View style={styles.iconWrap}>
          <Ionicons name="mail-open-outline" size={56} color={Colors.primary} />
        </View>
        <Text style={styles.title}>{titles[mode] ?? 'Doğrulama'}</Text>
        <Text style={styles.desc}>
          <Text style={{ color: Colors.primary }}>{email}</Text> adresine{'\n'}
          6 haneli kod gönderildi
        </Text>

        <View style={styles.otpRow}>
          {otp.map((digit, i) => (
            <TextInput
              key={i}
              ref={(r) => { inputs.current[i] = r; }}
              style={[styles.otpBox, digit ? styles.otpBoxFilled : null]}
              value={digit}
              onChangeText={(v) => handleOtpChange(i, v)}
              onKeyPress={({ nativeEvent }) => {
                if (nativeEvent.key === 'Backspace') handleBackspace(i);
              }}
              keyboardType="number-pad"
              maxLength={6}
              selectTextOnFocus
            />
          ))}
        </View>

        <TouchableOpacity
          style={[styles.button, (loading || code.length < 6) && styles.buttonDisabled]}
          onPress={handleVerify}
          disabled={loading || code.length < 6}
        >
          {loading ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.buttonText}>
              {mode === 'forgot' ? 'Devam Et' : 'Doğrula'}
            </Text>
          )}
        </TouchableOpacity>

        <View style={styles.resendRow}>
          {countdown > 0 ? (
            <Text style={styles.resendHint}>
              Yeniden gönder ({countdown}s)
            </Text>
          ) : (
            <TouchableOpacity onPress={handleResend} disabled={resendLoading}>
              <Text style={styles.resendBtn}>
                {resendLoading ? 'Gönderiliyor...' : 'Kodu Yeniden Gönder'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    padding: 24,
    paddingTop: 60,
  },
  backBtn: { alignSelf: 'flex-start', marginBottom: 16 },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: `${Colors.primary}18`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: { fontSize: 24, fontWeight: '700', color: Colors.text, marginBottom: 8 },
  desc: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
  },
  otpRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 32,
  },
  otpBox: {
    width: 46,
    height: 56,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    color: Colors.text,
  },
  otpBoxFilled: { borderColor: Colors.primary },
  button: {
    width: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { fontSize: 16, fontWeight: '700', color: Colors.white },
  resendRow: { marginTop: 20 },
  resendHint: { fontSize: 13, color: Colors.textSecondary },
  resendBtn: { fontSize: 13, color: Colors.primary, fontWeight: '600' },
  pwForm: { width: '100%', gap: 14, marginTop: 16 },
  pwInput: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    fontSize: 15,
    color: Colors.text,
  },
});
