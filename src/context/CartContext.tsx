'use client';

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useState,
  ReactNode,
  Dispatch,
} from 'react';
import { Product } from '@/lib/products';

// ── Types ──────────────────────────────────────────────────────────────────

export interface CartItem {
  product: Product;
  qty: number;
}

interface CartState {
  items: CartItem[];
}

type CartAction =
  | { type: 'ADD'; product: Product }
  | { type: 'REMOVE'; id: string }
  | { type: 'SET_QTY'; id: string; qty: number }
  | { type: 'CLEAR' }
  | { type: 'HYDRATE'; items: CartItem[] };

// ── Reducer ────────────────────────────────────────────────────────────────

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD': {
      const existing = state.items.find((i) => i.product.id === action.product.id);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.product.id === action.product.id ? { ...i, qty: i.qty + 1 } : i
          ),
        };
      }
      return { items: [...state.items, { product: action.product, qty: 1 }] };
    }
    case 'REMOVE':
      return { items: state.items.filter((i) => i.product.id !== action.id) };
    case 'SET_QTY': {
      if (action.qty <= 0) {
        return { items: state.items.filter((i) => i.product.id !== action.id) };
      }
      return {
        items: state.items.map((i) =>
          i.product.id === action.id ? { ...i, qty: action.qty } : i
        ),
      };
    }
    case 'CLEAR':
      return { items: [] };
    case 'HYDRATE':
      return { items: action.items };
    default:
      return state;
  }
}

// ── Context ────────────────────────────────────────────────────────────────

interface CartContextValue {
  state: CartState;
  dispatch: Dispatch<CartAction>;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextValue>({
  state: { items: [] },
  dispatch: () => {},
  totalItems: 0,
  totalPrice: 0,
});

const STORAGE_KEY = 'bherty_cart';

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] });
  // Gate: only write to localStorage after the initial hydration has completed.
  // Without this, the save effect fires with [] on first render and wipes the
  // stored cart before the hydrate dispatch can take effect.
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage on mount (runs once, before the save effect)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const items: CartItem[] = JSON.parse(raw);
        if (Array.isArray(items) && items.length > 0) {
          dispatch({ type: 'HYDRATE', items });
        }
      }
    } catch {
      // ignore malformed storage
    }
    setHydrated(true);
  }, []);

  // Persist to localStorage — only after hydration is complete so we never
  // overwrite a stored cart with the empty initial state.
  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
  }, [state.items, hydrated]);

  const totalItems = state.items.reduce((sum, i) => sum + i.qty, 0);
  const totalPrice = state.items.reduce((sum, i) => sum + i.product.price * i.qty, 0);

  return (
    <CartContext.Provider value={{ state, dispatch, totalItems, totalPrice }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
