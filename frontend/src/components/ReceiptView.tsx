import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Receipt } from '../models/Receipt';
import { Colors } from '../constants/Colors';
import { Texts } from '../constants/Texts';

interface Props {
  receipt: Receipt;
}

export const ReceiptView: React.FC<Props> = ({ receipt }) => {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>{Texts.appName}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>{Texts.receipt.receiptId}:</Text>
          <Text style={styles.infoValue}>{receipt.receiptId}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>{Texts.receipt.date}:</Text>
          <Text style={styles.infoValue}>{receipt.date}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>{Texts.receipt.time}:</Text>
          <Text style={styles.infoValue}>{receipt.time}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.itemsContainer}>
        <Text style={styles.sectionTitle}>{Texts.receipt.items}</Text>
        {receipt.items.map((item, index) => (
          <View key={index} style={styles.itemRow}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.name}</Text>
              {item.weight && (
                <Text style={styles.itemWeight}>
                  ({item.weight} {Texts.common.gram})
                </Text>
              )}
              <Text style={styles.itemDetails}>
                {item.quantity} x {item.unitPrice.toFixed(2)} {Texts.common.tl}
              </Text>
            </View>
            <Text style={styles.itemPrice}>
              {item.subtotal.toFixed(2)} {Texts.common.tl}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.divider} />

      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>{Texts.payment.total}</Text>
        <Text style={styles.totalValue}>
          {receipt.total.toFixed(2)} {Texts.common.tl}
        </Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.paymentRow}>
        <Text style={styles.paymentLabel}>{Texts.receipt.paymentMethod}:</Text>
        <Text style={styles.paymentValue}>
          {receipt.paymentMethod === 'NFC'
            ? Texts.receipt.nfcPayment
            : Texts.receipt.simulatedPayment}
        </Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.thanksText}>{Texts.receipt.thanksMessage}</Text>
        <Text style={styles.ecoText}>{Texts.receipt.ecoNote}</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  content: {
    padding: 20,
  },
  header: {
    marginBottom: 16,
  },
  logo: {
    backgroundColor: Colors.primary,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  logoText: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.white,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '600',
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    borderStyle: 'dashed',
    marginVertical: 16,
  },
  itemsContainer: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surface,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  itemWeight: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  itemDetails: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  totalValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.primary,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  paymentValue: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '600',
  },
  footer: {
    marginTop: 24,
    alignItems: 'center',
  },
  thanksText: {
    fontSize: 14,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  ecoText: {
    fontSize: 12,
    color: Colors.primary,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
