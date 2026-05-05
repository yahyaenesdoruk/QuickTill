export interface ShoppingListItem {
  id: string;
  name: string;
  quantity: string;
  checked: boolean;
}

export interface ShoppingList {
  id: string;
  name: string;
  items: ShoppingListItem[];
  createdAt: string;
}
