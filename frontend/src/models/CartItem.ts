export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  weight?: number;
  image?: string;
}
