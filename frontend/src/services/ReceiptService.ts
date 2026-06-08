import { Receipt } from '../models/Receipt';
import { CartItem } from '../models/CartItem';
import { authFetch } from './ApiConfig';

export class ReceiptService {
  static async getReceipts(): Promise<Receipt[]> {
    try {
      const res = await authFetch('/receipts');
      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  }

  static async deleteReceipt(receiptId: string): Promise<void> {
    const res = await authFetch(`/receipts/${receiptId}`, { method: 'DELETE' });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.detail || 'Fiş silinemedi');
    }
  }

  static async generateReceipt(
    cartItems: CartItem[],
    paymentMethod: 'NFC' | 'Simulated' | 'Pi'
  ): Promise<Receipt> {
    const now = new Date();
    // Sunucu tarafında UUID atanır; geçici ID olarak timestamp kullan
    const tempId = Date.now().toString();
    const receiptId = `#RCP-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${tempId.slice(-4)}`;

    const items = cartItems.map(item => ({
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.price / item.quantity,
      subtotal: item.price,
      weight: item.weight,
    }));

    const payload = {
      receiptId,
      date: now.toLocaleDateString('tr-TR'),
      time: now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
      items,
      total: cartItems.reduce((sum, i) => sum + i.price, 0),
      itemCount: cartItems.reduce((sum, i) => sum + i.quantity, 0),
      paymentMethod,
    };

    const res = await authFetch('/receipts', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.detail || 'Fiş kaydedilemedi');
    }

    const saved = await res.json();
    return { ...payload, id: saved.id } as Receipt;
  }
}
