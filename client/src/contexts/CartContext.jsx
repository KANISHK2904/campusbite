import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from './AuthContext';

const STORAGE_KEY = 'campusbite_cart';
export const MAX_PER_ITEM = 20;
const EMPTY = { placeId: null, placeName: '', lines: [] };

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (saved && Array.isArray(saved.lines)) return saved;
  } catch { /* ignore a corrupt cart */ }
  return EMPTY;
}

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user, loading } = useAuth();
  const [cart, setCart] = useState(load);
  const cartRef = useRef(cart);
  cartRef.current = cart;

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cart)); } catch { /* storage full/blocked */ }
  }, [cart]);

  // Signed out (or token expired): never keep a cart around for the next person
  useEffect(() => {
    if (!loading && !user) setCart(EMPTY);
  }, [user, loading]);

  // Add a NEW item (qty 1). A cart holds items from one place only.
  const addItem = useCallback((item, place) => {
    if (!item || item.quantity <= 0) return;
    const cur = cartRef.current;
    if (cur.lines.length && cur.placeId !== place.id) {
      const ok = window.confirm(
        `Your cart has items from ${cur.placeName}. Clear it and start a new cart from ${place.name}?`
      );
      if (!ok) return;
    }
    setCart((prev) => {
      const base = prev.placeId === place.id ? prev : { placeId: place.id, placeName: place.name, lines: [] };
      if (base.lines.some((l) => l.id === item.id)) return base;
      return {
        ...base,
        lines: [
          ...base.lines,
          { id: item.id, name: item.name, price: item.price, image_url: item.image_url, stock: item.quantity, quantity: 1 },
        ],
      };
    });
  }, []);

  const increment = useCallback((id) => {
    setCart((prev) => ({
      ...prev,
      lines: prev.lines.map((l) =>
        l.id === id && l.quantity < Math.min(l.stock, MAX_PER_ITEM) ? { ...l, quantity: l.quantity + 1 } : l
      ),
    }));
  }, []);

  const removeItem = useCallback((id) => {
    setCart((prev) => {
      const lines = prev.lines.filter((l) => l.id !== id);
      return lines.length ? { ...prev, lines } : EMPTY;
    });
  }, []);

  const decrement = useCallback((id) => {
    setCart((prev) => {
      const lines = prev.lines
        .map((l) => (l.id === id ? { ...l, quantity: l.quantity - 1 } : l))
        .filter((l) => l.quantity > 0);
      return lines.length ? { ...prev, lines } : EMPTY;
    });
  }, []);

  const clearCart = useCallback(() => setCart(EMPTY), []);

  // Called whenever fresh stock arrives from the server: keep cart lines within real stock
  const syncStock = useCallback((placeId, items) => {
    setCart((prev) => {
      if (prev.placeId !== placeId) return prev;
      const stockById = new Map(items.map((i) => [i.id, i.quantity]));
      let changed = false;
      const lines = prev.lines.flatMap((l) => {
        const stock = stockById.get(l.id);
        if (stock === undefined || stock <= 0) { changed = true; return []; }
        const quantity = Math.min(l.quantity, stock, MAX_PER_ITEM);
        if (stock !== l.stock || quantity !== l.quantity) changed = true;
        return [{ ...l, stock, quantity }];
      });
      if (!changed) return prev;
      return lines.length ? { ...prev, lines } : EMPTY;
    });
  }, []);

  const quantityOf = useCallback(
    (id) => cart.lines.find((l) => l.id === id)?.quantity || 0,
    [cart]
  );

  const totals = useMemo(
    () => ({
      count: cart.lines.reduce((n, l) => n + l.quantity, 0),
      // work in paise to avoid 0.1 + 0.2 style rounding errors
      subtotal: cart.lines.reduce((s, l) => s + Math.round(l.price * 100) * l.quantity, 0) / 100,
    }),
    [cart]
  );

  const value = { ...cart, ...totals, addItem, increment, decrement, removeItem, clearCart, syncStock, quantityOf };
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);
