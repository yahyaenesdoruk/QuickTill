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
  Pressable,
  Modal,
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

  // Pi bağlama
  const [showPinModal, setShowPinModal] = useState(false);
  const [linkCode, setLinkCode]         = useState<string | null>(null);
  const [pinLoading, setPinLoading]     = useState(false);
  const [pinCountdown, setPinCountdown] = useState(300);

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
    if (!newName.trim()) { Alert.alert('Error', 'Name cannot be empty'); return; }
    setSavingName(true);
    try {
      await AuthService.updateName(newName.trim());
      await refreshUser();
      setEditingName(false);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSavingName(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPw !== confirmPw) { Alert.alert('Error', 'Passwords do not match'); return; }
    setSavingPw(true);
    try {
      await AuthService.changePassword(oldPw, newPw);
      Alert.alert('Success', 'Password changed successfully');
      setShowPwForm(false); setOldPw(''); setNewPw(''); setConfirmPw('');
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

  const handleDeleteReceipt = async (receipt: Receipt) => {
    try {
      await ReceiptService.deleteReceipt(receipt.id);
      loadReceipts();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  // ── Pi PIN bağlama ──────────────────────────────────────────────────────────
  const fetchPin = async () => {
    setPinLoading(true);
    try {
      const c = await AuthService.createLinkCode();
      setLinkCode(c);
      setPinCountdown(300);
    } catch (e: any) {
      Alert.alert('Hata', e.message);
    } finally {
      setPinLoading(false);
    }
  };

  const openPinModal = () => {
    setShowPinModal(true);
    fetchPin();
  };

  useEffect(() => {
    if (!showPinModal) return;
    const timer = setInterval(() => {
      setPinCountdown(prev => {
        if (prev <= 1) { fetchPin(); return 300; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [showPinModal]);

  const formatCountdown = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      {/* Tab switcher */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'profile' && styles.tabBtnActive]}
          onPress={() => setTab('profile')}
        >
          <Text style={[styles.tabBtnText, tab === 'profile' && styles.tabBtnTextActive]}>
            Profile
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'receipts' && styles.tabBtnActive]}
          onPress={() => setTab('receipts')}
        >
          <Text style={[styles.tabBtnText, tab === 'receipts' && styles.tabBtnTextActive]}>
            My Receipts
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
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{user?.email}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Ionicons name="at-outline" size={18} color={Colors.textSecondary} />
              <Text style={styles.infoLabel}>Username</Text>
              <Text style={styles.infoValue}>@{user?.username}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Ionicons name="person-outline" size={18} color={Colors.textSecondary} />
              <Text style={styles.infoLabel}>Name</Text>
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
            <Text style={styles.actionBtnText}>Change Password</Text>
            <Ionicons name={showPwForm ? 'chevron-up' : 'chevron-down'} size={18} color={Colors.textSecondary} />
          </TouchableOpacity>

          {showPwForm && (
            <View style={styles.card}>
              <TextInput style={styles.pwInput} placeholder="Current password" placeholderTextColor={Colors.textSecondary} value={oldPw} onChangeText={setOldPw} secureTextEntry />
              <TextInput style={styles.pwInput} placeholder="New password" placeholderTextColor={Colors.textSecondary} value={newPw} onChangeText={setNewPw} secureTextEntry />
              <TextInput style={styles.pwInput} placeholder="Confirm new password" placeholderTextColor={Colors.textSecondary} value={confirmPw} onChangeText={setConfirmPw} secureTextEntry />
              <TouchableOpacity style={[styles.saveBtn, savingPw && { opacity: 0.6 }]} onPress={handleChangePassword} disabled={savingPw}>
                {savingPw ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.saveBtnText}>Save</Text>}
              </TouchableOpacity>
            </View>
          )}

          {/* Pi bağlama butonu */}
          <TouchableOpacity style={styles.piLinkBtn} onPress={openPinModal}>
            <Ionicons name="keypad-outline" size={20} color={Colors.primary} />
            <Text style={styles.piLinkBtnText}>Pi'ye Bağlan</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />
          </TouchableOpacity>

          {/* Logout */}
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color={Colors.error} />
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        receipts.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="receipt-outline" size={64} color={Colors.textSecondary} />
            <Text style={styles.emptyText}>No receipts yet</Text>
          </View>
        ) : (
          <FlatList
            data={receipts}
            keyExtractor={r => r.id}
            contentContainerStyle={{ padding: 16 }}
            renderItem={({ item }) => (
              <View style={styles.receiptCard}>
                <Pressable
                  style={styles.receiptCardMain}
                  onPress={() => router.push({ pathname: '/receipt-detail', params: { receiptId: item.id } })}
                >
                  <View style={styles.receiptLeft}>
                    <Ionicons name="receipt" size={24} color={Colors.primary} />
                    <View style={{ marginLeft: 12 }}>
                      <Text style={styles.receiptId}>{item.receiptId}</Text>
                      <Text style={styles.receiptDate}>{item.date} - {item.time}</Text>
                    </View>
                  </View>
                  <Text style={styles.receiptTotal}>{item.total.toFixed(2)} ₺</Text>
                </Pressable>
                <TouchableOpacity
                  style={styles.receiptDeleteBtn}
                  onPress={() => handleDeleteReceipt(item)}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  activeOpacity={0.6}
                >
                  <Ionicons name="trash-outline" size={20} color={Colors.error} />
                </TouchableOpacity>
              </View>
            )}
          />
        )
      )}

      {/* PIN Modal */}
      <Modal
        visible={showPinModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPinModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Ionicons name="keypad" size={36} color={Colors.primary} />
            <Text style={styles.modalTitle}>Pi'ye Bağlan</Text>
            <Text style={styles.modalSubtitle}>
              Pi ekranında "Hesabimi Bagla"ya bas,{'\n'}aşağıdaki kodu tuş takımına gir.
            </Text>

            {pinLoading || !linkCode ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator color={Colors.primary} size="large" />
              </View>
            ) : (
              <View style={styles.pinBox}>
                <Text style={styles.pinCode}>{linkCode}</Text>
              </View>
            )}

            <Text style={styles.countdown}>
              {!pinLoading && linkCode ? `⏱ ${formatCountdown(pinCountdown)} sonra yenilenir` : ' '}
            </Text>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => { setShowPinModal(false); setLinkCode(null); }}
            >
              <Text style={styles.closeBtnText}>Kapat</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  header: { paddingHorizontal: 16, paddingVertical: 16, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerTitle: { fontSize: 24, fontWeight: '700', color: Colors.text },
  tabBar: { flexDirection: 'row', backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabBtnActive: { borderBottomColor: Colors.primary },
  tabBtnText: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  tabBtnTextActive: { color: Colors.primary },
  content: { padding: 16, gap: 12 },
  avatarWrap: { alignItems: 'center', paddingVertical: 24 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText: { fontSize: 28, fontWeight: '700', color: Colors.white },
  avatarName: { fontSize: 20, fontWeight: '700', color: Colors.text },
  avatarUsername: { fontSize: 14, color: Colors.textSecondary, marginTop: 2 },
  adminBadge: { backgroundColor: Colors.primaryLight, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginTop: 8 },
  adminBadgeText: { fontSize: 12, fontWeight: '700', color: Colors.white },
  card: { backgroundColor: Colors.white, borderRadius: 12, padding: 16, gap: 4 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  infoLabel: { fontSize: 13, color: Colors.textSecondary, width: 90 },
  infoValue: { flex: 1, fontSize: 14, fontWeight: '600', color: Colors.text },
  divider: { height: 1, backgroundColor: Colors.border },
  editRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  editInput: { flex: 1, borderBottomWidth: 1, borderBottomColor: Colors.primary, fontSize: 14, color: Colors.text, paddingVertical: 2 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.white, borderRadius: 12, padding: 16 },
  actionBtnText: { flex: 1, fontSize: 14, fontWeight: '600', color: Colors.text },
  pwInput: { borderWidth: 1, borderColor: Colors.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: Colors.text, marginBottom: 8 },
  saveBtn: { backgroundColor: Colors.primary, borderRadius: 8, paddingVertical: 12, alignItems: 'center', marginTop: 4 },
  saveBtnText: { fontSize: 14, fontWeight: '700', color: Colors.white },
  piLinkBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.white, borderRadius: 12, padding: 16, borderWidth: 1.5, borderColor: Colors.primary },
  piLinkBtnText: { flex: 1, fontSize: 14, fontWeight: '600', color: Colors.primary },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.white, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: Colors.error },
  logoutText: { fontSize: 14, fontWeight: '600', color: Colors.error },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  emptyText: { fontSize: 16, color: Colors.textSecondary },
  receiptCard: { backgroundColor: Colors.white, borderRadius: 12, flexDirection: 'row', alignItems: 'center', marginBottom: 10, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3 },
  receiptCardMain: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14 },
  receiptLeft: { flexDirection: 'row', alignItems: 'center' },
  receiptId: { fontSize: 14, fontWeight: '700', color: Colors.text },
  receiptDate: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  receiptTotal: { fontSize: 16, fontWeight: '700', color: Colors.primary },
  receiptDeleteBtn: { padding: 14, justifyContent: 'center', alignItems: 'center', minWidth: 44, minHeight: 44 },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { backgroundColor: Colors.white, borderRadius: 24, padding: 28, alignItems: 'center', width: 300, gap: 12, elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: Colors.text },
  modalSubtitle: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  loadingBox: { width: 180, height: 80, justifyContent: 'center', alignItems: 'center' },
  pinBox: { backgroundColor: Colors.surface, borderRadius: 16, paddingVertical: 20, paddingHorizontal: 32, borderWidth: 2, borderColor: Colors.primary },
  pinCode: { fontSize: 42, fontWeight: '800', letterSpacing: 10, color: Colors.primary, textAlign: 'center' },
  countdown: { fontSize: 12, color: Colors.textSecondary, minHeight: 18 },
  closeBtn: { backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 48, marginTop: 4 },
  closeBtnText: { fontSize: 15, fontWeight: '700', color: Colors.white },
});
