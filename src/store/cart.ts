import { create } from 'zustand';
export interface CartItem {
  menuItemId: string; name: string; price: number;
  quantity: number; customizations?: Record<string, string>;
}
interface CartState {
  restaurantId: string | null;
  items: CartItem[];
  addItem: (restaurantId: string, item: CartItem) => void;
  removeItem: (menuItemId: string) => void;
  updateQty: (menuItemId: string, qty: number) => void;
  clearCart: () => void;
  subtotal: () => number;
}
export const useCartStore = create<CartState>((set, get) => ({
  restaurantId: null,
  items: [],
  addItem: (restaurantId, item) => {
    if (get().restaurantId && get().restaurantId !== restaurantId) set({ items: [], restaurantId });
    set(s => ({ restaurantId, items: [...s.items.filter(i => i.menuItemId !== item.menuItemId), item] }));
  },
  removeItem: (menuItemId) => set(s => ({ items: s.items.filter(i => i.menuItemId !== menuItemId) })),
  updateQty: (menuItemId, qty) => set(s => ({
    items: qty <= 0 ? s.items.filter(i => i.menuItemId !== menuItemId)
                   : s.items.map(i => i.menuItemId === menuItemId ? { ...i, quantity: qty } : i)
  })),
  clearCart: () => set({ restaurantId: null, items: [] }),
  subtotal: () => get().items.reduce((s, i) => s + i.price * i.quantity, 0),
}));