import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem } from '../types';

interface CartContextType {
  cart: CartItem[];
  addItem: (item: Omit<CartItem, 'id'>) => void;
  removeItem: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, delta: number) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('aurelia_customer_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('aurelia_customer_cart', JSON.stringify(cart));
  }, [cart]);

  const addItem = (item: Omit<CartItem, 'id'>) => {
    // Generate unique signature based on item + variant + addons
    const addonIds = item.addons.map(a => a.addon_id).sort().join(',');
    const signature = `${item.menu_item_id}|${item.variant_name || 'default'}|${addonIds}|${item.notes || ''}`;

    setCart(prev => {
      const existingIdx = prev.findIndex(ci => ci.id === signature);
      if (existingIdx > -1) {
        const next = [...prev];
        next[existingIdx].quantity += item.quantity;
        return next;
      } else {
        return [...prev, { ...item, id: signature }];
      }
    });
  };

  const removeItem = (cartItemId: string) => {
    setCart(prev => prev.filter(item => item.id !== cartItemId));
  };

  const updateQuantity = (cartItemId: string, delta: number) => {
    setCart(prev => {
      return prev
        .map(item => {
          if (item.id === cartItemId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const clearCart = () => {
    setCart([]);
  };

  const itemCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = cart.reduce((acc, item) => acc + (item.unit_price * item.quantity), 0);

  return (
    <CartContext.Provider value={{ cart, addItem, removeItem, updateQuantity, clearCart, itemCount, subtotal }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
