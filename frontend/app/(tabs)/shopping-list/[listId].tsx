import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  RefreshControl,
} from 'react-native';
import { useFocusEffect, useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ShoppingListService } from '../../../src/services/ShoppingListService';
import { ShoppingList, ShoppingListItem } from '../../../src/models/ShoppingList';
import { Colors } from '../../../src/constants/Colors';

export default function ShoppingListDetailScreen() {
  const router = useRouter();
  const { listId } = useLocalSearchParams<{ listId: string }>();
  const [list, setList] = useState<ShoppingList | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [itemName, setItemName] = useState('');
  const [itemQty, setItemQty] = useState('');

  const load = useCallback(async () => {
    const data = await ShoppingListService.getList(listId);
    setList(data);
    setRefreshing(false);
  }, [listId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleToggle = async (itemId: string) => {
    await ShoppingListService.toggleItem(listId, itemId);
    load();
  };

  const handleDeleteItem = (itemId: string, name: string) => {
    Alert.alert('Remove Item', `Remove "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          await ShoppingListService.deleteItem(listId, itemId);
          load();
        },
      },
    ]);
  };

  const handleAddItem = async () => {
    if (!itemName.trim()) {
      Alert.alert('Error', 'Item name cannot be empty');
      return;
    }
    await ShoppingListService.addItem(listId, itemName.trim(), itemQty.trim() || '1');
    setItemName('');
    setItemQty('');
    setShowAdd(false);
    load();
  };

  if (!list) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.surface }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const done = list.items.filter((i) => i.checked).length;
  const total = list.items.length;
  const progress = total > 0 ? done / total : 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{list.name}</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAdd(true)}>
          <Ionicons name="add" size={24} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {total > 0 && (
        <View style={styles.progressContainer}>
          <View style={styles.progressTop}>
            <Text style={styles.progressLabel}>
              {done}/{total} completed
            </Text>
            <Text style={styles.progressPercent}>
              {Math.round(progress * 100)}%
            </Text>
          </View>
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
        </View>
      )}

      {list.items.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="bag-outline" size={56} color={Colors.textSecondary} />
          <Text style={styles.emptyText}>List is empty</Text>
          <TouchableOpacity
            style={styles.emptyAddBtn}
            onPress={() => setShowAdd(true)}
          >
            <Text style={styles.emptyAddText}>Add Item</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={list.items}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ padding: 16, gap: 8 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); load(); }}
              colors={[Colors.primary]}
            />
          }
          renderItem={({ item }) => (
            <ItemRow
              item={item}
              onToggle={() => handleToggle(item.id)}
              onDelete={() => handleDeleteItem(item.id, item.name)}
            />
          )}
        />
      )}

      <Modal
        visible={showAdd}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAdd(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Add Item</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Item name (e.g. Milk)"
              placeholderTextColor={Colors.textSecondary}
              value={itemName}
              onChangeText={setItemName}
              autoFocus
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Quantity (e.g. 2 pcs, 500g)"
              placeholderTextColor={Colors.textSecondary}
              value={itemQty}
              onChangeText={setItemQty}
              onSubmitEditing={handleAddItem}
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => { setShowAdd(false); setItemName(''); setItemQty(''); }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalCreateBtn} onPress={handleAddItem}>
                <Text style={styles.modalCreateText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function ItemRow({
  item,
  onToggle,
  onDelete,
}: {
  item: ShoppingListItem;
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <View style={[styles.itemRow, item.checked && styles.itemRowDone]}>
      <TouchableOpacity
        style={styles.checkBtn}
        onPress={onToggle}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons
          name={item.checked ? 'checkmark-circle' : 'ellipse-outline'}
          size={26}
          color={item.checked ? Colors.primary : Colors.border}
        />
      </TouchableOpacity>
      <View style={{ flex: 1 }}>
        <Text style={[styles.itemName, item.checked && styles.itemNameDone]}>
          {item.name}
        </Text>
        {item.quantity ? (
          <Text style={styles.itemQty}>{item.quantity}</Text>
        ) : null}
      </View>
      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={onDelete}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        activeOpacity={0.6}
      >
        <Ionicons name="trash-outline" size={18} color={Colors.error} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  headerTitle: { flex: 1, fontSize: 20, fontWeight: '700', color: Colors.text },
  addBtn: {
    backgroundColor: Colors.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressContainer: {
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 6,
  },
  progressTop: { flexDirection: 'row', justifyContent: 'space-between' },
  progressLabel: { fontSize: 13, color: Colors.textSecondary },
  progressPercent: { fontSize: 13, fontWeight: '700', color: Colors.primary },
  progressBg: { height: 6, borderRadius: 3, backgroundColor: Colors.border },
  progressFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 3 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  emptyText: { fontSize: 16, color: Colors.textSecondary },
  emptyAddBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  emptyAddText: { fontSize: 15, fontWeight: '600', color: Colors.white },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 12,
  },
  itemRowDone: { backgroundColor: `${Colors.primary}0A` },
  checkBtn: {},
  itemName: { fontSize: 15, fontWeight: '600', color: Colors.text },
  itemNameDone: { textDecorationLine: 'line-through', color: Colors.textSecondary },
  itemQty: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  deleteBtn: { padding: 4, minWidth: 30, minHeight: 30, justifyContent: 'center', alignItems: 'center' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    gap: 14,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  modalInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.text,
  },
  modalBtns: { flexDirection: 'row', gap: 10 },
  modalCancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalCancelText: { fontSize: 15, fontWeight: '600', color: Colors.textSecondary },
  modalCreateBtn: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalCreateText: { fontSize: 15, fontWeight: '700', color: Colors.white },
});
