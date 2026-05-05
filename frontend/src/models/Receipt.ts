export interface ReceiptItem {
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  weight?: number;
}

export interface Receipt {
  id: string;
  receiptId: string;
  date: string;
  time: string;
  items: ReceiptItem[];
  total: number;
  itemCount: number;
  paymentMethod: 'NFC' | 'Simulated';
}
