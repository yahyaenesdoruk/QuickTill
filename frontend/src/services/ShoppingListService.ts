import AsyncStorage from '@react-native-async-storage/async-storage';
import { ShoppingList, ShoppingListItem } from '../models/ShoppingList';

const KEY = '@qt_shopping_lists';

export class ShoppingListService {
  static async getLists(): Promise<ShoppingList[]> {
    try {
      const data = await AsyncStorage.getItem(KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private static async _save(lists: ShoppingList[]): Promise<void> {
    await AsyncStorage.setItem(KEY, JSON.stringify(lists));
  }

  static async createList(name: string): Promise<ShoppingList> {
    const lists = await this.getLists();
    const newList: ShoppingList = {
      id: Date.now().toString(),
      name: name.trim(),
      items: [],
      createdAt: new Date().toISOString(),
    };
    lists.unshift(newList);
    await this._save(lists);
    return newList;
  }

  static async renameList(listId: string, name: string): Promise<void> {
    const lists = await this.getLists();
    const list = lists.find((l) => l.id === listId);
    if (list) list.name = name.trim();
    await this._save(lists);
  }

  static async deleteList(listId: string): Promise<void> {
    const lists = await this.getLists();
    await this._save(lists.filter((l) => l.id !== listId));
  }

  static async getList(listId: string): Promise<ShoppingList | null> {
    const lists = await this.getLists();
    return lists.find((l) => l.id === listId) ?? null;
  }

  static async addItem(
    listId: string,
    name: string,
    quantity: string
  ): Promise<void> {
    const lists = await this.getLists();
    const list = lists.find((l) => l.id === listId);
    if (!list) return;
    list.items.push({
      id: Date.now().toString(),
      name: name.trim(),
      quantity: quantity.trim(),
      checked: false,
    });
    await this._save(lists);
  }

  static async toggleItem(listId: string, itemId: string): Promise<void> {
    const lists = await this.getLists();
    const list = lists.find((l) => l.id === listId);
    if (!list) return;
    const item = list.items.find((i) => i.id === itemId);
    if (item) item.checked = !item.checked;
    await this._save(lists);
  }

  static async deleteItem(listId: string, itemId: string): Promise<void> {
    const lists = await this.getLists();
    const list = lists.find((l) => l.id === listId);
    if (!list) return;
    list.items = list.items.filter((i) => i.id !== itemId);
    await this._save(lists);
  }
}
