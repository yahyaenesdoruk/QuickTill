import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { ProduceItemCard } from '../src/components/ProduceItemCard';
import { CartService } from '../src/services/CartService';
import { produceItems } from '../src/data/sampleProducts';
import { ProduceItem } from '../src/models/Product';
import { Colors } from '../src/constants/Colors';
import { Texts } from '../src/constants/Texts';

export default function ProduceScreen() {
  const [filter, setFilter] = useState<'all' | 'weight' | 'unit'>('all');

  const filteredItems = produceItems.filter((item) => {
    if (filter === 'all') return true;
    return item.soldBy === filter;
  });

  const handleAddItem = async (
    item: ProduceItem,
    quantity: number,
    weight?: number
  ) => {
    await CartService.addProduceItem(item, quantity, weight);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{Texts.produce.title}</Text>
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
            onPress={() => setFilter('all')}
          >
            <Text
              style={[
                styles.filterButtonText,
                filter === 'all' && styles.filterButtonTextActive,
              ]}
            >
              Tümü
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'weight' && styles.filterButtonActive]}
            onPress={() => setFilter('weight')}
          >
            <Text
              style={[
                styles.filterButtonText,
                filter === 'weight' && styles.filterButtonTextActive,
              ]}
            >
              {Texts.produce.weightBased}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'unit' && styles.filterButtonActive]}
            onPress={() => setFilter('unit')}
          >
            <Text
              style={[
                styles.filterButtonText,
                filter === 'unit' && styles.filterButtonTextActive,
              ]}
            >
              {Texts.produce.unitBased}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.id}
        numColumns={2}
        renderItem={({ item }) => (
          <View style={styles.itemContainer}>
            <ProduceItemCard item={item} onAdd={(q, w) => handleAddItem(item, q, w)} />
          </View>
        )}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surface,
  },
  filterButtonActive: {
    backgroundColor: Colors.primary,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  filterButtonTextActive: {
    color: Colors.white,
  },
  list: {
    padding: 12,
  },
  itemContainer: {
    flex: 1,
    padding: 6,
  },
});
