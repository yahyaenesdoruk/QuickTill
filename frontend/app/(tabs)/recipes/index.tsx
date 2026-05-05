import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { RecipeService } from '../../../src/services/RecipeService';
import { Recipe } from '../../../src/models/Recipe';
import { Colors } from '../../../src/constants/Colors';

const CATEGORIES = ['Tümü', 'Kahvaltı', 'Çorba', 'Ana Yemek', 'Salata', 'Tatlı', 'İçecek', 'Genel'];

export default function RecipesScreen() {
  const router = useRouter();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Tümü');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (q = search, cat = category) => {
    try {
      const data = await RecipeService.getRecipes(q, cat);
      setRecipes(data);
    } catch (e: any) {
      Alert.alert('Hata', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load(search, category);
    }, [])
  );

  const handleSearch = (text: string) => {
    setSearch(text);
    load(text, category);
  };

  const handleCategory = (cat: string) => {
    setCategory(cat);
    load(search, cat);
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
        <Text style={styles.headerTitle}>Online Tarifler</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push('/(tabs)/recipes/add')}
        >
          <Ionicons name="add" size={24} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <Ionicons name="search-outline" size={18} color={Colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Tarif veya malzeme ara..."
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

      {/* Category chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
      >
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.chip, category === cat && styles.chipActive]}
            onPress={() => handleCategory(cat)}
          >
            <Text style={[styles.chipText, category === cat && styles.chipTextActive]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {recipes.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="restaurant-outline" size={64} color={Colors.textSecondary} />
          <Text style={styles.emptyTitle}>Tarif bulunamadı</Text>
          <TouchableOpacity
            style={styles.emptyAddBtn}
            onPress={() => router.push('/(tabs)/recipes/add')}
          >
            <Text style={styles.emptyAddText}>İlk Tarifi Ekle</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={recipes}
          keyExtractor={(r) => r.id}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load(search, category);
              }}
              colors={[Colors.primary]}
            />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push(`/(tabs)/recipes/${item.id}`)}
            >
              <View style={styles.cardTop}>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryBadgeText}>{item.category}</Text>
                </View>
                <Text style={styles.cardTitle}>{item.title}</Text>
                {item.description ? (
                  <Text style={styles.cardDesc} numberOfLines={2}>
                    {item.description}
                  </Text>
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
                    <Text style={styles.metaText}>{item.prep_time} dk</Text>
                  </View>
                ) : null}
                {item.servings ? (
                  <View style={styles.metaItem}>
                    <Ionicons name="people-outline" size={13} color={Colors.textSecondary} />
                    <Text style={styles.metaText}>{item.servings} kişi</Text>
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
  searchIcon: { marginRight: 8 },
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
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  emptyTitle: { fontSize: 16, color: Colors.textSecondary },
  emptyAddBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  emptyAddText: { fontSize: 15, fontWeight: '600', color: Colors.white },
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
});
