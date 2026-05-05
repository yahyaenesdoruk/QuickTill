import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ScrollView,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Modal,
  Pressable,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { RecipeService } from '../../src/services/RecipeService';
import { ShoppingListService } from '../../src/services/ShoppingListService';
import { Recipe } from '../../src/models/Recipe';
import { ShoppingList } from '../../src/models/ShoppingList';
import { Colors } from '../../src/constants/Colors';

const CATEGORIES = ['All', 'Breakfast', 'Soup', 'Main Course', 'Salad', 'Dessert', 'Drink', 'General'];

type Tab = 'recipes' | 'lists';

export default function BrowseScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('recipes');

  // Recipes state
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [recipesLoading, setRecipesLoading] = useState(true);
  const [refreshingRecipes, setRefreshingRecipes] = useState(false);

  // Lists state
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [refreshingLists, setRefreshingLists] = useState(false);

  const loadRecipes = useCallback(async (q = search, cat = category) => {
    try {
      const data = await RecipeService.getRecipes(q, cat);
      setRecipes(data);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setRecipesLoading(false);
      setRefreshingRecipes(false);
    }
  }, []);

  const loadLists = useCallback(async () => {
    const data = await ShoppingListService.getLists();
    setLists(data);
    setRefreshingLists(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadRecipes(search, category);
      loadLists();
    }, [])
  );

  const handleSearch = (text: string) => {
    setSearch(text);
    loadRecipes(text, category);
  };

  const handleCategory = (cat: string) => {
    setCategory(cat);
    loadRecipes(search, cat);
  };

  const handleDeleteList = (id: string, name: string) => {
    Alert.alert('Delete List', `Delete "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await ShoppingListService.deleteList(id);
          loadLists();
        },
      },
    ]);
  };

  const handleCreateList = async () => {
    if (!newListName.trim()) {
      Alert.alert('Error', 'List name cannot be empty');
      return;
    }
    await ShoppingListService.createList(newListName.trim());
    setNewListName('');
    setShowCreate(false);
    loadLists();
  };

  const getProgress = (list: ShoppingList) => {
    if (list.items.length === 0) return null;
    const done = list.items.filter((i) => i.checked).length;
    return { done, total: list.items.length };
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {tab === 'recipes' ? 'Recipes' : 'Shopping Lists'}
        </Text>
        {tab === 'recipes' ? (
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => router.push('/(tabs)/recipes/add')}
          >
            <Ionicons name="add" size={24} color={Colors.white} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setShowCreate(true)}
          >
            <Ionicons name="add" size={24} color={Colors.white} />
          </TouchableOpacity>
        )}
      </View>

      {/* Sub-tab switcher */}
      <View style={styles.subTabBar}>
        <TouchableOpacity
          style={[styles.subTab, tab === 'recipes' && styles.subTabActive]}
          onPress={() => setTab('recipes')}
        >
          <Ionicons
            name="restaurant-outline"
            size={16}
            color={tab === 'recipes' ? Colors.primary : Colors.textSecondary}
          />
          <Text style={[styles.subTabText, tab === 'recipes' && styles.subTabTextActive]}>
            Recipes
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.subTab, tab === 'lists' && styles.subTabActive]}
          onPress={() => setTab('lists')}
        >
          <Ionicons
            name="list-outline"
            size={16}
            color={tab === 'lists' ? Colors.primary : Colors.textSecondary}
          />
          <Text style={[styles.subTabText, tab === 'lists' && styles.subTabTextActive]}>
            My Lists
          </Text>
        </TouchableOpacity>
      </View>

      {/* Recipes Tab */}
      {tab === 'recipes' && (
        <View style={{ flex: 1 }}>
          <View style={styles.searchRow}>
            <Ionicons name="search-outline" size={18} color={Colors.textSecondary} style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search recipes or ingredients..."
              placeholderTextColor={Colors.textSecondary}
              value={search}
              onChangeText={handleSearch}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => handleSearch('')}>
                <Ionicons name="close-circle" size={18} color={Colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.chip, category === cat && styles.chipActive]}
                onPress={() => handleCategory(cat)}
              >
                <Text style={[styles.chipText, category === cat && styles.chipTextActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {recipesLoading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          ) : recipes.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="restaurant-outline" size={64} color={Colors.textSecondary} />
              <Text style={styles.emptyTitle}>No recipes found</Text>
              <TouchableOpacity
                style={styles.emptyAddBtn}
                onPress={() => router.push('/(tabs)/recipes/add')}
              >
                <Text style={styles.emptyAddText}>Add First Recipe</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={recipes}
              keyExtractor={(r) => r.id}
              contentContainerStyle={{ padding: 16, gap: 12 }}
              refreshControl={
                <RefreshControl
                  refreshing={refreshingRecipes}
                  onRefresh={() => { setRefreshingRecipes(true); loadRecipes(search, category); }}
                  colors={[Colors.primary]}
                />
              }
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.recipeCard}
                  onPress={() => router.push(`/(tabs)/recipes/${item.id}`)}
                >
                  <View style={styles.cardTop}>
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryBadgeText}>{item.category}</Text>
                    </View>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    {item.description ? (
                      <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
                    ) : null}
                  </View>
                  <View style={styles.cardBottom}>
                    <View style={styles.metaItem}>
                      <Ionicons name="person-outline" size={13} color={Colors.textSecondary} />
                      <Text style={styles.metaText}>{item.author_name}</Text>
                    </View>
                    {item.prep_time ? (
                      <View style={styles.metaItem}>
                        <Ionicons name="time-outline" size={13} color={Colors.textSecondary} />
                        <Text style={styles.metaText}>{item.prep_time} min</Text>
                      </View>
                    ) : null}
                    {item.servings ? (
                      <View style={styles.metaItem}>
                        <Ionicons name="people-outline" size={13} color={Colors.textSecondary} />
                        <Text style={styles.metaText}>{item.servings} servings</Text>
                      </View>
                    ) : null}
                    <View style={[styles.metaItem, { marginLeft: 'auto' }]}>
                      <Ionicons name="chatbubble-outline" size={13} color={Colors.textSecondary} />
                      <Text style={styles.metaText}>{item.comment_count}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      )}

      {/* Lists Tab */}
      {tab === 'lists' && (
        lists.length === 0 ? (
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
                refreshing={refreshingLists}
                onRefresh={() => { setRefreshingLists(true); loadLists(); }}
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
                          <Text style={styles.listMeta}>{progress.done}/{progress.total} completed</Text>
                          <View style={styles.progressBg}>
                            <View style={[styles.progressFill, { width: `${(progress.done / progress.total) * 100}%` }]} />
                          </View>
                        </>
                      ) : (
                        <Text style={styles.listMeta}>Empty list</Text>
                      )}
                    </View>
                  </Pressable>
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => handleDeleteList(item.id, item.name)}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    activeOpacity={0.6}
                  >
                    <Ionicons name="trash-outline" size={20} color={Colors.error} />
                  </TouchableOpacity>
                </View>
              );
            }}
          />
        )
      )}

      {/* Create list modal */}
      <Modal visible={showCreate} transparent animationType="slide" onRequestClose={() => setShowCreate(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>New List</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="List name"
              placeholderTextColor={Colors.textSecondary}
              value={newListName}
              onChangeText={setNewListName}
              autoFocus
              onSubmitEditing={handleCreateList}
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => { setShowCreate(false); setNewListName(''); }}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalCreateBtn} onPress={handleCreateList}>
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
  subTabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  subTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  subTabActive: { borderBottomColor: Colors.primary },
  subTabText: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  subTabTextActive: { color: Colors.primary },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 12,
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: { flex: 1, fontSize: 14, color: Colors.text },
  chips: { paddingHorizontal: 12, paddingBottom: 8, gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  chipTextActive: { color: Colors.white },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, padding: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: Colors.text },
  emptyDesc: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },
  emptyAddBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  emptyAddText: { fontSize: 15, fontWeight: '600', color: Colors.white },
  recipeCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  cardTop: { gap: 6, marginBottom: 12 },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: `${Colors.primary}18`,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  categoryBadgeText: { fontSize: 11, fontWeight: '600', color: Colors.primary },
  cardTitle: { fontSize: 17, fontWeight: '700', color: Colors.text },
  cardDesc: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },
  cardBottom: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: Colors.textSecondary },
  listCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 14,
    elevation: 1,
    shadowColor: '#000',
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
  progressBg: { height: 4, borderRadius: 2, backgroundColor: Colors.border, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 2 },
  deleteBtn: {
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 44,
    minHeight: 44,
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
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
