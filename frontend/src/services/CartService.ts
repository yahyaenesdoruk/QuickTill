import AsyncStorage from '@react-native-async-storage/async-storage';
import { CartItem } from '../models/CartItem';
import { Product, ProduceItem } from '../models/Product';

const CART_KEY = '@cartpay_cart';

export class CartService {
  static async getCart(): Promise<CartItem[]> {
    try {
      const data = await AsyncStorage.getItem(CART_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading cart:', error);
      return [];
    }
  }

  static async saveCart(cart: CartItem[]): Promise<void> {
    try {
      await AsyncStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch (error) {
      console.error('Error saving cart:', error);
    }
  }

  static async addProduct(product: Product): Promise<CartItem[]> {
    const cart = await this.getCart();
    const existingIndex = cart.findIndex(item => item.productId === product.id);
    
    if (existingIndex >= 0) {
      cart[existingIndex].quantity += 1;
      cart[existingIndex].price = product.price * cart[existingIndex].quantity;
    } else {
      cart.push({
        id: Date.now().toString(),
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
      });
    }
    
    await this.saveCart(cart);
    return cart;
  }

  static async addProduceItem(
    item: ProduceItem,
    quantity: number,
    weight?: number
  ): Promise<CartItem[]> {
    const cart = await this.getCart();
    
    let price = 0;
    if (item.soldBy === 'weight' && weight && item.pricePerKg) {
      price = (item.pricePerKg * weight) / 1000;
    } else if (item.soldBy === 'unit' && item.pricePerUnit) {
      price = item.pricePerUnit * quantity;
    }
    
    cart.push({
      id: Date.now().toString(),
      productId: item.id,
      name: item.name,
      price: price,
      quantity: quantity,
      weight: weight,
    });
    
    await this.saveCart(cart);
    return cart;
  }

  static async updateQuantity(itemId: string, quantity: number): Promise<CartItem[]> {
    const cart = await this.getCart();
    const item = cart.find(i => i.id === itemId);
    
    if (item) {
      const unitPrice = item.price / item.quantity;
      item.quantity = quantity;
      item.price = unitPrice * quantity;
    }
    
    await this.saveCart(cart);
    return cart;
  }

  static async removeItem(itemId: string): Promise<CartItem[]> {
    let cart = await this.getCart();
    cart = cart.filter(item => item.id !== itemId);
    await this.saveCart(cart);
    return cart;
  }

  static async clearCart(): Promise<void> {
    await AsyncStorage.removeItem(CART_KEY);
  }

  static calculateTotal(cart: CartItem[]): number {
    return cart.reduce((sum, item) => sum + item.price, 0);
  }

  static getItemCount(cart: CartItem[]): number {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }
}
