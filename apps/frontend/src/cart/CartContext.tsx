import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Cart } from "@qai-shop/shared";
import * as api from "../api/client";
import { useAuth } from "../auth/AuthContext";

const EMPTY_CART: Cart = { items: [], totalItems: 0, totalPrice: 0, currency: "PLN" };

interface CartContextValue {
  cart: Cart;
  loading: boolean;
  refresh: () => Promise<void>;
  addToCart: (productId: string, quantity?: number) => Promise<void>;
  updateItem: (productId: string, quantity: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  clear: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState<Cart>(EMPTY_CART);
  const [loading, setLoading] = useState(false);
  const [mutationInFlight, setMutationInFlight] = useState(false);
  const mutationInFlightRef = useRef(false);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setCart(EMPTY_CART);
      return;
    }
    setLoading(true);
    try {
      setCart(await api.getCart());
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const runMutation = useCallback(async (loadCart: () => Promise<Cart>) => {
    if (mutationInFlightRef.current) return;
    mutationInFlightRef.current = true;
    setMutationInFlight(true);
    try {
      setCart(await loadCart());
    } finally {
      mutationInFlightRef.current = false;
      setMutationInFlight(false);
    }
  }, []);

  const addToCart = useCallback(
    async (productId: string, quantity = 1) => {
      await runMutation(() => api.addToCart(productId, quantity));
    },
    [runMutation],
  );

  const updateItem = useCallback(
    async (productId: string, quantity: number) => {
      await runMutation(() => api.updateCartItem(productId, quantity));
    },
    [runMutation],
  );

  const removeItem = useCallback(
    async (productId: string) => {
      await runMutation(() => api.removeCartItem(productId));
    },
    [runMutation],
  );

  const clear = useCallback(async () => {
    await runMutation(() => api.clearCart());
  }, [runMutation]);

  const value = useMemo<CartContextValue>(
    () => ({
      cart,
      loading: loading || mutationInFlight,
      refresh,
      addToCart,
      updateItem,
      removeItem,
      clear,
    }),
    [cart, loading, mutationInFlight, refresh, addToCart, updateItem, removeItem, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart musi być użyty wewnątrz <CartProvider>");
  return ctx;
}
