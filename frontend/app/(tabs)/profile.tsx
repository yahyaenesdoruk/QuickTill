import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  FlatList,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { AuthService } from '../../src/services/AuthService';
import { ReceiptService } from '../../src/services/ReceiptService';
import { Receipt } from '../../src/models/Receipt';
import { Colors } from '../../src/constants/Colors';

type Tab = 'profile' | 'receipts';

export default function ProfileScreen() {
  const { user, logout, refreshUser } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('profile');

  // Profile edit
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(user?.name ?? '');
  const [savingName, setSavingName] = useState(false);

  // Password change
  const [showPwForm, setShowPwForm] = useState(false);
  const [oldPw, setOldPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [savingPw, setSavingPw] = useState(false);

  // Receipts
  const [receipts, setReceipts] = useState<Receipt[]>([]);

  useEffect(() => {
    if (tab === 'receipts') loadReceipts();
  }, [tab]);

  useEffect(() => {
    setNewName(user?.name ?? '');
  }, [user?.name]);

  const loadReceipts = async () => {
    const data = await ReceiptService.getReceipts();
    setReceipts(data);
  };

  const handleSaveName = async () => {
    if (!newName.trim()) {
      Alert.alert('Hata', 'İsim boş olamaz');
      return;
    }
    setSavingName(true);
    try {
      await AuthService.updateName(newName.trim());
      await refreshUser();
      setEditingName(false);
    } catch (e: any) {
      Alert.alert('Hata', e.message);
    } finally {
      setSavingName(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPw !== confirmPw) {
      Alert.alert('Hata', 'Şifreler eşleşmiyor');
      return;
    }
    setSavingPw(true);
    try {
      await AuthService.changePassword(oldPw, newPw);
      Alert.alert('Başarılı', 'Şifreniz değiştirildi');
      setShowPwForm(false);
      setOldPw('');
      setNewPw('');
      setConfirmPw('');
    } catch (e: any) {
      Alert.alert('Hata', e.message);
    } finally {
      setSavingPw(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Çıkış Yap', 'Hesabından çıkmak istediğine emin misin?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Çıkış Yap',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const handleDeleteReceipt = (receipt: Receipt) => {
    Alert.alert('Fişi Sil', `${receipt.receiptId} silinsin mi?`, [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          await ReceiptService.deleteReceipt(receipt.id);
          loadReceipts();
        },
      },
    ]);
  };

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profilim</Text>
      </View>

      {/* Tab switcher */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'profile' && styles.tabBtnActive]}
          onPress={() => setTab('profile')}
        >
          <Text style={[styles.tabBtnText, tab === 'profile' && styles.tabBtnTextActive]}>
            Profil
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'receipts' && styles.tabBtnActive]}
          onPress={() => setTab('receipts')}
        >
          <Text style={[styles.tabBtnText, tab === 'receipts' && styles.tabBtnTextActive]}>
            Fişlerim
          </Text>
        </TouchableOpacity>
      </View>

      {tab === 'profile' ? (
        <ScrollView contentContainerStyle={styles.content}>
          {/* Avatar */}
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <Text style={styles.avatarName}>{user?.name}</Text>
            <Text style={styles.avatarUsername}>@{user?.username}</Text>
            {user?.role === 'admin' && (
              <View style={styles.adminBadge}>
                <Text style={styles.adminBadgeText}>Admin</Text>
              </View>
            )}
          </View>

          {/* Info card */}
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Ionicons name="mail-outline" size={18} color={Colors.textSecondary} />
              <Text style={styles.infoLabel}>E-posta</Text>
              <Text style={styles.infoValue}>{user?.email}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Ionicons name="at-outline" size={18} color={Colors.textSecondary} />
              <Text style={styles.infoLabel}>Kullanıcı Adı</Text>
              <Text style={styles.infoValue}>@{user?.username}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Ionicons name="person-outline" size={18} color={Colors.textSecondary} />
              <Text style={styles.infoLabel}>İsim</Text>
              {editingName ? (
                <View style={styles.editRow}>
                  <TextInput
                    style={styles.editInput}
                    value={newName}
                    onChangeText={setNewName}
                    autoFocus
                  />
                  <TouchableOpacity onPress={handleSaveName} disabled={savingName}>
                    {savingName ? (
                      <ActivityIndicator size="small" color={Colors.primary} />
                    ) : (
                      <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => { setEditingName(false); setNewName(user?.name ?? ''); }}>
                    <Ionicons name="close-circle" size={24} color={Colors.error} />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.editRow}>
                  <Text style={styles.infoValue}>{user?.name}</Text>
                  <TouchableOpacity onPress={() => setEditingName(true)}>
                    <Ionicons name="pencil-outline" size={18} color={Colors.primary} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>

          {/* Password change */}
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => setShowPwForm(!showPwForm)}
          >
            <Ionicons name="lock-closed-outline" size={20} color={Colors.primary} />
            <Text style={styles.actionBtnText}>Şifre Değiştir</Text>
            <Ionicons
              name={showPwForm ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={Colors.textSecondary}
            />
          </TouchableOpacity>

          {showPwForm && (
            <View style={styles.card}>
              <TextInput
                style={styles.pwInput}
                placeholder="Mevcut şifre"
                placeholderTextColor={Colors.textSecondary}
                value={oldPw}
                onChangeText={setOldPw}
                secureTextEntry
              />
              <TextInput
                style={styles.pwInput}
                placeholder="Yeni şifre"
                placeholderTextColor={Colors.textSecondary}
                value={newPw}
                onChangeText={setNewPw}
                secureTextEntry
              />
              <TextInput
                style={styles.pwInput}
                placeholder="Yeni şifre tekrar"
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
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <Text style={styles.saveBtnText}>Kaydet</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Logout */}
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color={Colors.error} />
            <Text style={styles.logoutText}>Çıkış Yap</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        /* Receipts tab */
        receipts.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="receipt-outline" size={64} color={Colors.textSecondary} />
            <Text style={styles.emptyText}>Henüz fiş bulunmuyor</Text>
          </View>
        ) : (
          <FlatList
            data={receipts}
            keyExtractor={(r) => r.id}
            contentContainerStyle={{ padding: 16 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.receiptCard}
                onPress={() =>
                  router.push({ pathname: '/receipt-detail', params: { receiptId: item.id } })
                }
              >
                <View style={styles.receiptLeft}>
                  <Ionicons name="receipt" size={24} color={Colors.primary} />
                  <View style={{ marginLeft: 12 }}>
                    <Text style={styles.receiptId}>{item.receiptId}</Text>
                    <Text style={styles.receiptDate}>{item.date} - {item.time}</Text>
                  </View>
                </View>
                <View style={styles.receiptRight}>
                  <Text style={styles.receiptTotal}>{item.total.toFixed(2)} ₺</Text>
                  <TouchableOpacity
                    onPress={(e) => { e.stopPropagation(); handleDeleteReceipt(item); }}
                    style={{ padding: 4 }}
                  >
                    <Ionicons name="trash-outline" size={18} color={Colors.error} />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            )}
          />
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: 24, fontWeight: '700', color: Colors.text },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: { borderBottomColor: Colors.primary },
  tabBtnText: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  tabBtnTextActive: { color: Colors.primary },
  content: { padding: 16, gap: 12 },
  avatarWrap: { alignItems: 'center', paddingVertical: 24 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: { fontSize: 28, fontWeight: '700', color: Colors.white },
  avatarName: { fontSize: 20, fontWeight: '700', color: Colors.text },
  avatarUsername: { fontSize: 14, color: Colors.textSecondary, marginTop: 2 },
  adminBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  adminBadgeText: { fontSize: 12, fontWeight: '700', color: Colors.white },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    gap: 4,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  infoLabel: { fontSize: 13, color: Colors.textSecondary, width: 90 },
  infoValue: { flex: 1, fontSize: 14, fontWeight: '600', color: Colors.text },
  divider: { height: 1, backgroundColor: Colors.border },
  editRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  editInput: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: Colors.primary,
    fontSize: 14,
    color: Colors.text,
    paddingVertical: 2,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
  },
  actionBtnText: { flex: 1, fontSize: 14, fontWeight: '600', color: Colors.text },
  pwInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.text,
    marginBottom: 8,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  saveBtnText: { fontSize: 14, fontWeight: '700', color: Colors.white },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  logoutText: { fontSize: 14, fontWeight: '600', color: Colors.error },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  emptyText: { fontSize: 16, color: Colors.textSecondary },
  receiptCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    elevation: 1,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  receiptLeft: { flexDirection: 'row', alignItems: 'center' },
  receiptId: { fontSize: 14, fontWeight: '700', color: Colors.text },
  receiptDate: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  receiptRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  receiptTotal: { fontSize: 16, fontWeight: '700', color: Colors.primary },
});
