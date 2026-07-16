import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: number;        // id del ProductoItem
  sku: string;
  nombre: string;
  precio: number;
  imagen?: string;
  variante?: string;
  diseno?: string;
  qty: number;
}

interface CartState {
  items: CartItem[];
  carritoId: number | null;
  addItem: (item: CartItem) => void;
  removeItem: (id: number) => void;
  updateQty: (id: number, qty: number) => void;
  clear: () => void;
  setCarritoId: (id: number) => void;
  total: () => number;
  count: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      carritoId: null,

      addItem: (item) =>
        set((s) => ({
          items: s.items.find((i) => i.id === item.id)
            ? s.items.map((i) =>
                i.id === item.id ? { ...i, qty: i.qty + item.qty } : i,
              )
            : [...s.items, item],
        })),

      removeItem: (id) =>
        set((s) => ({ items: s.items.filter((i) => i.id !== id) })),

      updateQty: (id, qty) =>
        set((s) => ({
          items: qty <= 0
            ? s.items.filter((i) => i.id !== id)
            : s.items.map((i) => (i.id === id ? { ...i, qty } : i)),
        })),

      clear: () => set({ items: [], carritoId: null }),

      setCarritoId: (id) => set({ carritoId: id }),

      total: () =>
        get().items.reduce((acc, i) => acc + i.precio * i.qty, 0),

      count: () => get().items.reduce((acc, i) => acc + i.qty, 0),
    }),
    { name: 'dreamlife-cart' },
  ),
);
