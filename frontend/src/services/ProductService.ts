import AsyncStorage from '@react-native-async-storage/async-storage';
import { Product, ProduceItem } from '../models/Product';
import { sampleProducts, produceItems } from '../data/sampleProducts';
import { API_BASE_URL, fetchWithTimeout } from './ApiConfig';

const PRODUCE_KEY = '@cartpay_produce';

export class ProductService {
  /** Fetch products from backend; fall back to local sample data on error. */
  static async getProducts(): Promise<Product[]> {
    try {
      const res = await fetchWithTimeout(`${API_BASE_URL}/products`, {}, 10000);
      if (res.ok) {
        const data = await res.json();
        // Backend returns a flat array
        const list: any[] = Array.isArray(data) ? data : (data.products ?? []);
        return list.map((p: any) => ({
          id: p.id ?? p._id,
          name: p.name,
          price: p.price,
          barcode: p.barcode ?? '',
          category: p.category ?? '',
          image: p.image,
        }));
      }
    } catch (_) {
      // network error — fall through to local data
    }
    return sampleProducts;
  }

  /** No-op kept for API compatibility (products now live on the backend). */
  static async saveProducts(_products: Product[]): Promise<void> {}

  /** No-op kept for API compatibility. */
  static async addProduct(_product: Product): Promise<void> {}

  static async getProduceItems(): Promise<ProduceItem[]> {
    try {
      const data = await AsyncStorage.getItem(PRODUCE_KEY);
      if (data) {
        return JSON.parse(data);
      }
      await this.saveProduceItems(produceItems);
      return produceItems;
    } catch (error) {
      return produceItems;
    }
  }

  static async saveProduceItems(items: ProduceItem[]): Promise<void> {
    await AsyncStorage.setItem(PRODUCE_KEY, JSON.stringify(items));
  }

  static async addProduceItem(item: ProduceItem): Promise<void> {
    const items = await this.getProduceItems();
    items.push(item);
    await this.saveProduceItems(items);
  }

  static async findProductByBarcode(barcode: string): Promise<Product | undefined> {
    try {
      const res = await fetchWithTimeout(
        `${API_BASE_URL}/products/barcode/${encodeURIComponent(barcode)}`,
        {},
        10000
      );
      if (res.ok) {
        const p = await res.json();
        return {
          id: p.id ?? p._id,
          name: p.name,
          price: p.price,
          barcode: p.barcode ?? barcode,
          category: p.category ?? '',
          image: p.image,
        };
      }
    } catch (_) {}
    // Fall back to local search
    const products = await this.getProducts();
    return products.find(p => p.barcode === barcode);
  }
}
