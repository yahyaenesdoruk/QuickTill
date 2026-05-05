import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { CampaignService } from '../../src/services/CampaignService';
import { Campaign } from '../../src/models/Campaign';
import { Colors } from '../../src/constants/Colors';

export default function CampaignsScreen() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await CampaignService.getCampaigns();
      setCampaigns(data);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, []);

  const handleToggle = async (id: string) => {
    try {
      const { is_active } = await CampaignService.toggleCampaign(id);
      setCampaigns((prev) =>
        prev.map((c) => (c.id === id ? { ...c, is_active } : c))
      );
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleDelete = (id: string, title: string) => {
    Alert.alert('Delete Campaign', `Delete "${title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await CampaignService.deleteCampaign(id);
            setCampaigns((prev) => prev.filter((c) => c.id !== id));
          } catch (e: any) {
            Alert.alert('Error', e.message);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Deals</Text>
        {isAdmin && (
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setShowCreate(true)}
          >
            <Ionicons name="add" size={24} color={Colors.white} />
          </TouchableOpacity>
        )}
      </View>

      {campaigns.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="pricetag-outline" size={64} color={Colors.textSecondary} />
          <Text style={styles.emptyText}>
            {isAdmin ? 'No campaigns yet' : 'No active campaigns'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={campaigns}
          keyExtractor={(c) => c.id}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); load(); }}
              colors={[Colors.primary]}
            />
          }
          renderItem={({ item }) => (
            <CampaignCard
              campaign={item}
              isAdmin={isAdmin}
              onToggle={() => handleToggle(item.id)}
              onDelete={() => handleDelete(item.id, item.title)}
            />
          )}
        />
      )}

      {isAdmin && (
        <CreateCampaignModal
          visible={showCreate}
          onClose={() => setShowCreate(false)}
          onCreated={(c) => {
            setCampaigns((prev) => [c, ...prev]);
            setShowCreate(false);
          }}
        />
      )}
    </View>
  );
}

function CampaignCard({
  campaign,
  isAdmin,
  onToggle,
  onDelete,
}: {
  campaign: Campaign;
  isAdmin: boolean;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const discountLabel =
    campaign.discount_type === 'percent'
      ? `${campaign.discount_value}% Off`
      : `${campaign.discount_value} ₺ Off`;

  const isExpired = new Date(campaign.end_date) < new Date();

  return (
    <View style={[styles.card, !campaign.is_active && styles.cardInactive]}>
      <View style={styles.cardTop}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{campaign.title}</Text>
          <Text style={styles.cardDesc}>{campaign.description}</Text>
        </View>
        <View style={styles.discountBadge}>
          <Text style={styles.discountText}>{discountLabel}</Text>
        </View>
      </View>
      <View style={styles.cardBottom}>
        <View style={styles.dateRow}>
          <Ionicons name="calendar-outline" size={14} color={Colors.textSecondary} />
          <Text style={styles.dateText}>
            {campaign.start_date} → {campaign.end_date}
          </Text>
        </View>
        <View style={styles.statusRow}>
          {isExpired ? (
            <View style={[styles.badge, styles.badgeExpired]}>
              <Text style={styles.badgeText}>Expired</Text>
            </View>
          ) : campaign.is_active ? (
            <View style={[styles.badge, styles.badgeActive]}>
              <Text style={styles.badgeText}>Active</Text>
            </View>
          ) : (
            <View style={[styles.badge, styles.badgePaused]}>
              <Text style={styles.badgeText}>Paused</Text>
            </View>
          )}
          {campaign.target_emails.length === 0 && (
            <View style={[styles.badge, styles.badgeAll]}>
              <Text style={styles.badgeText}>Everyone</Text>
            </View>
          )}
        </View>
      </View>
      {isAdmin && (
        <View style={styles.adminActions}>
          <TouchableOpacity style={styles.iconBtn} onPress={onToggle}>
            <Ionicons
              name={campaign.is_active ? 'pause-circle-outline' : 'play-circle-outline'}
              size={22}
              color={campaign.is_active ? Colors.textSecondary : Colors.primary}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={onDelete}>
            <Ionicons name="trash-outline" size={22} color={Colors.error} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

function CreateCampaignModal({
  visible,
  onClose,
  onCreated,
}: {
  visible: boolean;
  onClose: () => void;
  onCreated: (c: Campaign) => void;
}) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    discount_type: 'percent' as 'percent' | 'fixed',
    discount_value: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    target_emails_str: '',
  });
  const [saving, setSaving] = useState(false);

  const update = (field: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleCreate = async () => {
    if (!form.title || !form.discount_value || !form.end_date) {
      Alert.alert('Error', 'Title, discount value and end date are required');
      return;
    }
    setSaving(true);
    try {
      const emails = form.target_emails_str
        .split(',')
        .map((e) => e.trim())
        .filter(Boolean);
      const c = await CampaignService.createCampaign({
        title: form.title,
        description: form.description,
        discount_type: form.discount_type,
        discount_value: parseFloat(form.discount_value),
        start_date: form.start_date,
        end_date: form.end_date,
        target_emails: emails,
      });
      onCreated(c);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>New Campaign</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={Colors.text} />
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.modalContent}>
          <Label text="Title *" />
          <TextInput style={styles.input} value={form.title} onChangeText={(v) => update('title', v)} placeholder="Campaign name" placeholderTextColor={Colors.textSecondary} />

          <Label text="Description" />
          <TextInput style={[styles.input, { height: 80 }]} value={form.description} onChangeText={(v) => update('description', v)} placeholder="Campaign description" placeholderTextColor={Colors.textSecondary} multiline />

          <Label text="Discount Type" />
          <View style={styles.typeRow}>
            {(['percent', 'fixed'] as const).map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.typeBtn, form.discount_type === t && styles.typeBtnActive]}
                onPress={() => update('discount_type', t)}
              >
                <Text style={[styles.typeBtnText, form.discount_type === t && styles.typeBtnTextActive]}>
                  {t === 'percent' ? '% Percent' : '₺ Fixed'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Label text={`Discount Value (${form.discount_type === 'percent' ? '%' : '₺'}) *`} />
          <TextInput style={styles.input} value={form.discount_value} onChangeText={(v) => update('discount_value', v)} placeholder="e.g. 10" placeholderTextColor={Colors.textSecondary} keyboardType="decimal-pad" />

          <Label text="Start Date *" />
          <TextInput style={styles.input} value={form.start_date} onChangeText={(v) => update('start_date', v)} placeholder="YYYY-MM-DD" placeholderTextColor={Colors.textSecondary} />

          <Label text="End Date *" />
          <TextInput style={styles.input} value={form.end_date} onChangeText={(v) => update('end_date', v)} placeholder="YYYY-MM-DD" placeholderTextColor={Colors.textSecondary} />

          <Label text="Target Emails (empty = everyone)" />
          <TextInput style={styles.input} value={form.target_emails_str} onChangeText={(v) => update('target_emails_str', v)} placeholder="a@b.com, c@d.com" placeholderTextColor={Colors.textSecondary} autoCapitalize="none" />

          <TouchableOpacity
            style={[styles.createBtn, saving && { opacity: 0.6 }]}
            onPress={handleCreate}
            disabled={saving}
          >
            {saving ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.createBtnText}>Create</Text>}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

function Label({ text }: { text: string }) {
  return <Text style={styles.label}>{text}</Text>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: 24, fontWeight: '700', color: Colors.text },
  addBtn: {
    backgroundColor: Colors.primary,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  emptyText: { fontSize: 16, color: Colors.textSecondary, textAlign: 'center' },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  cardInactive: { opacity: 0.6 },
  cardTop: { flexDirection: 'row', gap: 12, marginBottom: 10 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  cardDesc: { fontSize: 13, color: Colors.textSecondary },
  discountBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  discountText: { fontSize: 13, fontWeight: '700', color: Colors.white },
  cardBottom: { gap: 6 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dateText: { fontSize: 12, color: Colors.textSecondary },
  statusRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: '600', color: Colors.white },
  badgeActive: { backgroundColor: Colors.success },
  badgePaused: { backgroundColor: Colors.textSecondary },
  badgeExpired: { backgroundColor: Colors.error },
  badgeAll: { backgroundColor: Colors.primaryLight },
  adminActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 8,
  },
  iconBtn: { padding: 6 },
  modalContainer: { flex: 1, backgroundColor: Colors.surface },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 56,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: { fontSize: 20, fontWeight: '700', color: Colors.text },
  modalContent: { padding: 16, gap: 4 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginTop: 12, marginBottom: 4 },
  input: {
    backgroundColor: Colors.white,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    fontSize: 14,
    color: Colors.text,
  },
  typeRow: { flexDirection: 'row', gap: 10 },
  typeBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  typeBtnActive: { borderColor: Colors.primary, backgroundColor: `${Colors.primary}15` },
  typeBtnText: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  typeBtnTextActive: { color: Colors.primary },
  createBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  createBtnText: { fontSize: 16, fontWeight: '700', color: Colors.white },
});
