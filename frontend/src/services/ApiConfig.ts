import AsyncStorage from '@react-native-async-storage/async-storage';

// Change to your server IP when running on a physical device
// e.g. 'http://192.168.1.100:8001/api'
export const API_BASE_URL = 'https://quicktill-backend.onrender.com/api';

export async function authFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = await AsyncStorage.getItem('@qt_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return fetch(`${API_BASE_URL}${path}`, { ...options, headers });
}
