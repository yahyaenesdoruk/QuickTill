import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { AuthService } from '../../src/services/AuthService';
import { Colors } from '../../src/constants/Colors';

export default function AdminScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [showPwForm, setShowPwForm] = useState(false);
  const [oldPw, setOldPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [savingPw, setSavingPw] = useState(false);

  if (user?.role !== 'admin') {
    return (
      <View style={styles.center}>
        <Text style={styles.noAccess}>Access denied</Text>
      </View>
    );
  }

  const handleChangePassword = async () => {
    if (newPw !== confirmPw) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    if (newPw.length < 6) {
      Alert.alert('Error', 'New password must be at least 6 characters');
      return;
    }
    setSavingPw(true);
    try {
      await AuthService.changePassword(oldPw, newPw);
      Alert.alert('Success', 'Admin password updated');
      setShowPwForm(false);
      setOldPw('');
      setNewPw('');
      setConfirmPw('');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSavingPw(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin Panel</Text>
        <View style={styles.adminBadge}>
          <Text style={styles.adminBadgeText}>Admin</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Product Management */}
        <Text style={styles.groupLabel}>Product Management</Text>
        <View style={styles.group}>
          <MenuRow
            icon="barcode-outline"
            iconColor={Colors.primary}
            title="Add Product with Barcode"
            subtitle="Scan barcode with camera and save"
            onPress={() => router.push('/add-barcode-product')}
          />
          <View style={styles.divider} />
          <MenuRow
            icon="create-outline"
            iconColor={Colors.primary}
            title="Add Product Manually"
            subtitle="Add product without barcode"
            onPress={() => router.push('/add-manual-product')}
          />
          <View style={styles.divider} />
          <MenuRow
            icon="list-outline"
            iconColor={Colors.error}
            title="Product List"
            subtitle="View and delete all products"
            onPress={() => router.push('/product-management')}
          />
        </View>

        {/* Campaign Management */}
        <Text style={styles.groupLabel}>Campaign Management</Text>
        <View style={styles.group}>
          <MenuRow
            icon="pricetag-outline"
            iconColor={Colors.primary}
            title="Campaigns"
            subtitle="Create and manage campaigns"
            onPress={() => router.push('/(tabs)/campaigns')}
          />
        </View>

        {/* Account */}
        <Text style={styles.groupLabel}>Account</Text>
        <View style={styles.group}>
          <MenuRow
            icon="lock-closed-outline"
            iconColor={Colors.textSecondary}
            title="Change Admin Password"
            subtitle="Update your account password"
            onPress={() => setShowPwForm(!showPwForm)}
            trailing={
              <Ionicons
                name={showPwForm ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={Colors.textSecondary}
              />
            }
          />
          {showPwForm && (
            <View style={styles.pwForm}>
              <TextInput
                style={styles.pwInput}
                placeholder="Current password"
                placeholderTextColor={Colors.textSecondary}
                value={oldPw}
                onChangeText={setOldPw}
                secureTextEntry
              />
              <TextInput
                style={styles.pwInput}
                placeholder="New password"
                placeholderTextColor={Colors.textSecondary}
                value={newPw}
                onChangeText={setNewPw}
                secureTextEntry
              />
              <TextInput
                style={styles.pwInput}
                placeholder="Confirm new password"
                placeholderTextColor={Colors.textSecondary}
                value={confirmPw}
                onChangeText={setConfirmPw}
                secureTextEntry
              />
              <TouchableOpacity
                style={[styles.saveBtn, savingPw && { opacity: 0.6 }]}
                onPress={handleChangePassword}
                disabled={savingPw}
              >
                {savingPw ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <Text style={styles.saveBtnText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
          <View style={styles.divider} />
          <MenuRow
            icon="log-out-outline"
            iconColor={Colors.error}
            title="Sign Out"
            subtitle="Sign out of your account"
            onPress={handleLogout}
            titleColor={Colors.error}
          />
        </View>
      </ScrollView>
    </View>
  );
}

function MenuRow({
  icon,
  iconColor,
  title,
  subtitle,
  onPress,
  titleColor,
  trailing,
}: {
  icon: string;
  iconColor: string;
  title: string;
  subtitle: string;
  onPress: () => void;
  titleColor?: string;
  trailing?: React.ReactNode;
}) {
  return (
    <TouchableOpacity style={styles.menuRow} onPress={onPress}>
      <View style={[styles.menuIcon, { backgroundColor: `${iconColor}18` }]}>
        <Ionicons name={icon as any} size={22} color={iconColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.menuTitle, titleColor ? { color: titleColor } : null]}>
          {title}
        </Text>
        <Text style={styles.menuSubtitle}>{subtitle}</Text>
      </View>
      {trailing ?? (
        <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  noAccess: { fontSize: 16, color: Colors.textSecondary },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: { flex: 1, fontSize: 24, fontWeight: '700', color: Colors.text },
  adminBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  adminBadgeText: { fontSize: 12, fontWeight: '700', color: Colors.white },
  content: { padding: 16, gap: 0 },
  groupLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 20,
    marginBottom: 8,
    marginLeft: 4,
  },
  group: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
  },
  menuIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuTitle: { fontSize: 15, fontWeight: '600', color: Colors.text, marginBottom: 2 },
  menuSubtitle: { fontSize: 12, color: Colors.textSecondary },
  divider: { height: 1, backgroundColor: Colors.border, marginLeft: 74 },
  pwForm: {
    padding: 16,
    paddingTop: 0,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  pwInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.text,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveBtnText: { fontSize: 14, fontWeight: '700', color: Colors.white },
});
