import AsyncStorage from '@react-native-async-storage/async-storage';
import { Receipt, ReceiptItem } from '../models/Receipt';
import { CartItem } from '../models/CartItem';

const RECEIPTS_KEY = '@cartpay_receipts';
const RECEIPT_COUNTER_KEY = '@cartpay_receipt_counter';

export class ReceiptService {
  static async getReceipts(): Promise<Receipt[]> {
    try {
      const data = await AsyncStorage.getItem(RECEIPTS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading receipts:', error);
      return [];
    }
  }

  static async saveReceipt(receipt: Receipt): Promise<void> {
    try {
      const receipts = await this.getReceipts();
      receipts.unshift(receipt);
      await AsyncStorage.setItem(RECEIPTS_KEY, JSON.stringify(receipts));
    } catch (error) {
      console.error('Error saving receipt:', error);
    }
  }

  static async deleteReceipt(receiptId: string): Promise<void> {
    try {
      let receipts = await this.getReceipts();
      receipts = receipts.filter(r => r.id !== receiptId);
      await AsyncStorage.setItem(RECEIPTS_KEY, JSON.stringify(receipts));
    } catch (error) {
      console.error('Error deleting receipt:', error);
    }
  }

  static async generateReceipt(
    cartItems: CartItem[],
    paymentMethod: 'NFC' | 'Simulated'
  ): Promise<Receipt> {
    const counter = await this.getNextReceiptNumber();
    const now = new Date();
    
    const receiptItems: ReceiptItem[] = cartItems.map(item => ({
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.price / item.quantity,
      subtotal: item.price,
      weight: item.weight,
    }));

    const receipt: Receipt = {
      id: Date.now().toString(),
      receiptId: `#RCP-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(counter).padStart(3, '0')}`,
      date: now.toLocaleDateString('tr-TR'),
      time: now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
      items: receiptItems,
      total: cartItems.reduce((sum, item) => sum + item.price, 0),
      itemCount: cartItems.reduce((sum, item) => sum + item.quantity, 0),
      paymentMethod,
    };

    await this.saveReceipt(receipt);
    return receipt;
  }

  private static async getNextReceiptNumber(): Promise<number> {
    try {
      const counterStr = await AsyncStorage.getItem(RECEIPT_COUNTER_KEY);
      const counter = counterStr ? parseInt(counterStr, 10) : 0;
      const nextCounter = counter + 1;
      await AsyncStorage.setItem(RECEIPT_COUNTER_KEY, nextCounter.toString());
      return nextCounter;
    } catch (error) {
      console.error('Error getting receipt number:', error);
      return 1;
    }
  }
}
