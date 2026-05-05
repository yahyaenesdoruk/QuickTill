import AsyncStorage from '@react-native-async-storage/async-storage';
import { Product, ProduceItem } from '../models/Product';
import { sampleProducts, produceItems } from '../data/sampleProducts';

const PRODUCTS_KEY = '@cartpay_products';
const PRODUCE_KEY = '@cartpay_produce';

export class ProductService {
  static async getProducts(): Promise<Product[]> {
    try {
      const data = await AsyncStorage.getItem(PRODUCTS_KEY);
      if (data) {
        return JSON.parse(data);
      }
      await this.saveProducts(sampleProducts);
      return sampleProducts;
    } catch (error) {
      return sampleProducts;
    }
  }

  static async saveProducts(products: Product[]): Promise<void> {
    await AsyncStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
  }

  static async addProduct(product: Product): Promise<void> {
    const products = await this.getProducts();
    products.push(product);
    await this.saveProducts(products);
  }

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
    const products = await this.getProducts();
    return products.find(p => p.barcode === barcode);
  }
}
