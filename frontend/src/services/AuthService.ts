import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../models/User';
import { API_BASE_URL, fetchWithTimeout } from './ApiConfig';

const TOKEN_KEY = '@qt_token';
const USER_KEY = '@qt_user';

export class AuthService {
  static async getToken(): Promise<string | null> {
    return AsyncStorage.getItem(TOKEN_KEY);
  }

  static async getUser(): Promise<User | null> {
    const data = await AsyncStorage.getItem(USER_KEY);
    return data ? JSON.parse(data) : null;
  }

  static async saveSession(token: string, user: User): Promise<void> {
    await AsyncStorage.setItem(TOKEN_KEY, token);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  static async clearSession(): Promise<void> {
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
  }

  static async updateLocalUser(updates: Partial<User>): Promise<void> {
    const user = await this.getUser();
    if (user) {
      await AsyncStorage.setItem(USER_KEY, JSON.stringify({ ...user, ...updates }));
    }
  }

  // ── API calls ──

  static async register(
    email: string,
    name: string,
    username: string,
    password: string
  ): Promise<string> {
    const res = await fetchWithTimeout(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, username, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Kayıt başarısız');
    return data.message;
  }

  static async verifyRegister(email: string, otp: string): Promise<User> {
    const res = await fetchWithTimeout(`${API_BASE_URL}/auth/verify-register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Doğrulama başarısız');
    await this.saveSession(data.token, data.user);
    return data.user;
  }

  static async login(email: string, password: string): Promise<string> {
    const res = await fetchWithTimeout(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Giriş başarısız');
    return data.message;
  }

  static async verifyLogin(email: string, otp: string): Promise<User> {
    const res = await fetchWithTimeout(`${API_BASE_URL}/auth/verify-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Doğrulama başarısız');
    await this.saveSession(data.token, data.user);
    return data.user;
  }

  static async forgotPassword(email: string): Promise<string> {
    const res = await fetchWithTimeout(`${API_BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Hata');
    return data.message;
  }

  static async resetPassword(
    email: string,
    otp: string,
    newPassword: string
  ): Promise<string> {
    const res = await fetchWithTimeout(`${API_BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp, new_password: newPassword }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Hata');
    return data.message;
  }

  static async updateName(name: string): Promise<void> {
    const token = await this.getToken();
    const res = await fetchWithTimeout(`${API_BASE_URL}/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Hata');
    await this.updateLocalUser({ name: data.name });
  }

  static async changePassword(
    oldPassword: string,
    newPassword: string
  ): Promise<void> {
    const token = await this.getToken();
    const res = await fetchWithTimeout(`${API_BASE_URL}/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        old_password: oldPassword,
        new_password: newPassword,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Hata');
  }

  /**
   * Pi'nin gösterdiği QR'ı (QTPI:{session_id}) telefon taradıktan sonra çağrılır.
   */
  static async claimPiSession(sessionId: string): Promise<void> {
    const token = await this.getToken();
    const res = await fetchWithTimeout(`${API_BASE_URL}/auth/claim-pi-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ session_id: sessionId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Oturum dogrulanamadi');
  }

  /**
   * Pi ekranında QR ile hızlı hesap girişi için 5 dakika geçerli token üretir.
   * Dönen token ile QR kod oluşturulur: QTLINK:{token}
   */
  static async createLinkToken(): Promise<string> {
    const token = await this.getToken();
    const res = await fetchWithTimeout(`${API_BASE_URL}/auth/link-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Token oluşturulamadı');
    return data.token;
  }

  /**
   * Pi'ye 6 haneli PIN ile giriş için kod üretir.
   * Pi tuş takımından girilir, 5 dakika geçerli.
   */
  static async createLinkCode(): Promise<string> {
    const token = await this.getToken();
    const res = await fetchWithTimeout(`${API_BASE_URL}/auth/link-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Kod oluşturulamadı');
    return data.code;
  }
}
