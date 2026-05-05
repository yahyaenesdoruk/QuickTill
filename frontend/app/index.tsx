import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { Colors } from '../src/constants/Colors';

export default function IndexScreen() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        router.replace('/(tabs)/');
      } else {
        router.replace('/(auth)/login');
      }
    }
  }, [isLoading, user]);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.surface,
      }}
    >
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  );
}
