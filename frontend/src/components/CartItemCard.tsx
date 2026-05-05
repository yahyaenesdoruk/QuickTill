import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CartItem } from '../models/CartItem';
import { Colors } from '../constants/Colors';

interface Props {
  item: CartItem;
  onIncrement: () => void;
  onDecrement: () => void;
  onDelete: () => void;
}

export const CartItemCard: React.FC<Props> = ({
  item,
  onIncrement,
  onDecrement,
  onDelete,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.info}>
          <Text style={styles.name}>{item.name}</Text>
          {item.weight && (
            <Text style={styles.weight}>
              {item.weight} gr
            </Text>
          )}
        </View>

        <View style={styles.controls}>
          <View style={styles.quantityControl}>
            <TouchableOpacity
              style={styles.button}
              onPress={onDecrement}
              disabled={item.quantity <= 1}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name="remove"
                size={20}
                color={item.quantity <= 1 ? Colors.textSecondary : Colors.primary}
              />
            </TouchableOpacity>
            <Text style={styles.quantity}>{item.quantity}</Text>
            <TouchableOpacity
              style={styles.button}
              onPress={onIncrement}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="add" size={20} color={Colors.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.priceContainer}>
            <Text style={styles.price}>
              {item.price.toFixed(2)} ₺
            </Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={styles.deleteButton}
        onPress={onDelete}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        activeOpacity={0.6}
      >
        <Ionicons name="trash-outline" size={24} color={Colors.error} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  info: {
    marginBottom: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  weight: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    paddingHorizontal: 4,
  },
  button: {
    padding: 8,
    minWidth: 36,
    minHeight: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantity: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginHorizontal: 12,
    minWidth: 30,
    textAlign: 'center',
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
  },
  deleteButton: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 12,
    paddingVertical: 8,
    minWidth: 44,
    minHeight: 44,
  },
});
