export interface Product {
  id: string;
  barcode: string;
  name: string;
  price: number;
  category: string;
  image?: string;
}

export interface ProduceItem {
  id: string;
  name: string;
  pricePerKg?: number;
  pricePerUnit?: number;
  category: string;
  soldBy: 'weight' | 'unit';
  image?: string;
}
