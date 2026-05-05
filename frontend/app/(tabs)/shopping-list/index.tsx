import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  RefreshControl,
  Pressable,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ShoppingListService } from '../../../src/services/ShoppingListService';
import { ShoppingList } from '../../../src/models/ShoppingList';
import { Colors } from '../../../src/constants/Colors';

export default function ShoppingListsScreen() {
  const router = useRouter();
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const data = await ShoppingListService.getLists();
    setLists(data);
    setRefreshing(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleCreate = async () => {
    if (!newListName.trim()) {
      Alert.alert('Error', 'List name cannot be empty');
      return;
    }
    await ShoppingListService.createList(newListName.trim());
    setNewListName('');
    setShowCreate(false);
    load();
  };

  const handleDelete = async (id: string) => {
    try {
      await ShoppingListService.deleteList(id);
      load();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const getProgress = (list: ShoppingList) => {
    if (list.items.length === 0) return null;
    const done = list.items.filter((i) => i.checked).length;
    return { done, total: list.items.length };
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Shopping Lists</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowCreate(true)}>
          <Ionicons name="add" size={24} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {lists.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="list-outline" size={64} color={Colors.textSecondary} />
          <Text style={styles.emptyTitle}>No lists yet</Text>
          <Text style={styles.emptyDesc}>Tap + to create a new list</Text>
        </View>
      ) : (
        <FlatList
          data={lists}
          keyExtractor={(l) => l.id}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); load(); }}
              colors={[Colors.primary]}
            />
          }
          renderItem={({ item }) => {
            const progress = getProgress(item);
            return (
              <View style={styles.listCard}>
                <Pressable
                  style={styles.listCardMain}
                  onPress={() => router.push(`/(tabs)/shopping-list/${item.id}`)}
                >
                  <View style={styles.listIcon}>
                    <Ionicons name="list" size={28} color={Colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.listName}>{item.name}</Text>
                    {progress ? (
                      <>
                        <Text style={styles.listMeta}>
                          {progress.done}/{progress.total} completed
                        </Text>
                        <View style={styles.progressBg}>
                          <View
                            style={[
                              styles.progressFill,
                              { width: `${(progress.done / progress.total) * 100}%` },
                            ]}
                          />
                        </View>
                      </>
                    ) : (
                      <Text style={styles.listMeta}>Empty list</Text>
                    )}
                  </View>
                </Pressable>
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDelete(item.id)}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  activeOpacity={0.6}
                >
                  <Ionicons name="trash-outline" size={20} color={Colors.error} />
                </TouchableOpacity>
              </View>
            );
          }}
        />
      )}

      <Modal visible={showCreate} transparent animationType="slide" onRequestClose={() => setShowCreate(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>New List</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="List name (e.g. Weekly, Picnic)"
              placeholderTextColor={Colors.textSecondary}
              value={newListName}
              onChangeText={setNewListName}
              autoFocus
              onSubmitEditing={handleCreate}
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => { setShowCreate(false); setNewListName(''); }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalCreateBtn} onPress={handleCreate}>
                <Text style={styles.modalCreateText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
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
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: Colors.text },
  emptyDesc: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },
  listCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 14,
    elevation: 1,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  listCardMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
  },
  listIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: `${Colors.primary}18`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listName: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  listMeta: { fontSize: 12, color: Colors.textSecondary, marginBottom: 6 },
  progressBg: {
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 2 },
  deleteBtn: {
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 44,
    minHeight: 44,
  },
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
    gap: 16,
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
