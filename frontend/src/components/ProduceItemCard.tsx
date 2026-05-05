import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProduceItem } from '../models/Product';
import { Colors } from '../constants/Colors';
import { Texts } from '../constants/Texts';

interface Props {
  item: ProduceItem;
  onAdd: (quantity: number, weight?: number) => void;
}

export const ProduceItemCard: React.FC<Props> = ({ item, onAdd }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [weight, setWeight] = useState('');
  const [quantity, setQuantity] = useState(1);

  const handleAdd = () => {
    if (item.soldBy === 'weight') {
      const weightNum = parseFloat(weight);
      if (weightNum > 0) {
        onAdd(1, weightNum);
        setModalVisible(false);
        setWeight('');
      }
    } else {
      onAdd(quantity);
      setModalVisible(false);
      setQuantity(1);
    }
  };

  return (
    <>
      <TouchableOpacity
        style={styles.container}
        onPress={() => setModalVisible(true)}
      >
        <View style={styles.iconContainer}>
          <Ionicons
            name={item.category === 'Meyve' ? 'leaf' : item.category === 'Sebze' ? 'nutrition' : 'flower'}
            size={32}
            color={Colors.primary}
          />
        </View>
        <Text style={styles.name} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={styles.price}>
          {item.soldBy === 'weight'
            ? `${item.pricePerKg?.toFixed(2)} ${Texts.common.tl}${Texts.produce.perKg}`
            : `${item.pricePerUnit?.toFixed(2)} ${Texts.common.tl}${Texts.produce.perUnit}`}
        </Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setModalVisible(false)}
          />
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{item.name}</Text>
            <Text style={styles.modalPrice}>
              {item.soldBy === 'weight'
                ? `${item.pricePerKg?.toFixed(2)} ${Texts.common.tl} / kg`
                : `${item.pricePerUnit?.toFixed(2)} ${Texts.common.tl} / adet`}
            </Text>

            {item.soldBy === 'weight' ? (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>{Texts.produce.enterWeight}</Text>
                <TextInput
                  style={styles.input}
                  value={weight}
                  onChangeText={setWeight}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={Colors.textSecondary}
                />
                <Text style={styles.unit}>{Texts.common.gram}</Text>
              </View>
            ) : (
              <View style={styles.quantityContainer}>
                <Text style={styles.label}>{Texts.produce.selectQuantity}</Text>
                <View style={styles.quantityControl}>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                    <Ionicons name="remove" size={24} color={Colors.primary} />
                  </TouchableOpacity>
                  <Text style={styles.quantityText}>{quantity}</Text>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => setQuantity(quantity + 1)}
                  >
                    <Ionicons name="add" size={24} color={Colors.primary} />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>{Texts.common.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.addButton]}
                onPress={handleAdd}
                disabled={
                  item.soldBy === 'weight'
                    ? !weight || parseFloat(weight) <= 0
                    : quantity <= 0
                }
              >
                <Text style={styles.addButtonText}>{Texts.produce.addToCart}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
    minHeight: 36,
  },
  price: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  modalOverlay: {
    flex: 1,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 32,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalPrice: {
    fontSize: 18,
    color: Colors.primary,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  input: {
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    color: Colors.text,
    textAlign: 'center',
  },
  unit: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  quantityContainer: {
    marginBottom: 24,
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  quantityButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
    minWidth: 60,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: Colors.surface,
  },
  addButton: {
    backgroundColor: Colors.primary,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
});
