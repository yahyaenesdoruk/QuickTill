import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ReceiptView } from '../src/components/ReceiptView';
import { ReceiptService } from '../src/services/ReceiptService';
import { PdfService } from '../src/services/PdfService';
import { Receipt } from '../src/models/Receipt';
import { Colors } from '../src/constants/Colors';
import { Texts } from '../src/constants/Texts';

export default function ReceiptDetailScreen() {
  const router = useRouter();
  const { receiptId } = useLocalSearchParams<{ receiptId: string }>();
  const [receipt, setReceipt] = useState<Receipt | null>(null);

  useEffect(() => {
    loadReceipt();
  }, [receiptId]);

  const loadReceipt = async () => {
    const receipts = await ReceiptService.getReceipts();
    const found = receipts.find((r) => r.id === receiptId);
    setReceipt(found || null);
  };

  const handleDownloadPdf = async () => {
    if (!receipt) return;
    
    try {
      const path = await PdfService.downloadPdf(receipt);
      if (path) {
        Alert.alert(
          'PDF İndirildi',
          `Fiş PDF olarak kaydedildi.`,
          [{ text: Texts.common.confirm }]
        );
      }
    } catch (error) {
      Alert.alert('Hata', 'PDF oluşturulamadı');
    }
  };

  const handleSharePdf = async () => {
    if (!receipt) return;
    
    try {
      await PdfService.sharePdf(receipt);
    } catch (error) {
      Alert.alert('Hata', 'PDF paylaşılamadı');
    }
  };

  const handleDelete = () => {
    if (!receipt) return;
    
    Alert.alert(
      'Fişi Sil',
      `${receipt.receiptId} numaralı fişi silmek istediğinize emin misiniz?`,
      [
        { text: Texts.common.cancel, style: 'cancel' },
        {
          text: Texts.receipt.delete,
          style: 'destructive',
          onPress: async () => {
            await ReceiptService.deleteReceipt(receipt.id);
            router.back();
          },
        },
      ]
    );
  };

  if (!receipt) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{Texts.receipt.title}</Text>
          <View style={{ width: 44 }} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Yüklen iyor...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{receipt.receiptId}</Text>
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Ionicons name="trash-outline" size={24} color={Colors.error} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <ReceiptView receipt={receipt} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, styles.downloadButton]}
          onPress={handleDownloadPdf}
        >
          <Ionicons name="download-outline" size={22} color={Colors.white} />
          <Text style={styles.buttonText}>{Texts.receipt.downloadPdf}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.shareButton]}
          onPress={handleSharePdf}
        >
          <Ionicons name="share-outline" size={22} color={Colors.white} />
          <Text style={styles.buttonText}>{Texts.receipt.share}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
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
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  deleteButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  downloadButton: {
    backgroundColor: Colors.primary,
  },
  shareButton: {
    backgroundColor: Colors.primaryDark,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.white,
  },
});
