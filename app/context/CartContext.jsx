'use client';

import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const { user, isAuthenticated } = useAuth();
  const saveTimerRef = useRef(null);
  const lastSyncedRef = useRef(null);

  // Load cart on login
  useEffect(() => {
    if (!user?.phone || !isAuthenticated) {
      try {
        const saved = localStorage.getItem('bazrush_cart');
        if (saved) setCartItems(JSON.parse(saved));
      } catch {}
      return;
    }
    loadCartFromServer(user.phone);
  }, [user?.phone, isAuthenticated]);

  // Always persist to localStorage
  useEffect(() => {
    localStorage.setItem('bazrush_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  // Poll server cart every 3s
  useEffect(() => {
    if (!user?.phone || !isAuthenticated) return;
    const interval = setInterval(() => loadCartFromServer(user.phone), 3000);
    return () => clearInterval(interval);
  }, [user?.phone, isAuthenticated]);

  const loadCartFromServer = async (phone) => {
    try {
      const res = await fetch(`/api/cart?phone=${encodeURIComponent(phone)}`);
      if (!res.ok) return;
      const { cart: serverCart } = await res.json();
      const serverStr = JSON.stringify(serverCart);
      if (serverStr === lastSyncedRef.current) return;
      lastSyncedRef.current = serverStr;

      setCartItems(prev => {
        const merged = [...serverCart];
        prev.forEach(localItem => {
          if (!merged.find(s => s.key === localItem.key)) merged.push(localItem);
        });
        return merged;
      });
    } catch (e) {
      console.log('Cart load failed:', e);
    }
  };

  const saveCartToServer = (newCart) => {
    if (!user?.phone) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      try {
        await fetch('/api/cart', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: user.phone, cart: newCart }),
        });
        lastSyncedRef.current = JSON.stringify(newCart);
      } catch (e) {
        console.error('Cart save failed:', e);
      }
    }, 400);
  };

  const addToCart = (product, selectedColor, selectedSize) => {
    const key = `${product.id}-${selectedColor || 'default'}-${selectedSize || 'default'}`;
    setCartItems(prev => {
      const existing = prev.find(i => i.key === key);
      const newCart = existing
        ? prev.map(i => i.key === key ? { ...i, quantity: i.quantity + 1 } : i)
        : [...prev, { key, product, selectedColor, selectedSize, quantity: 1 }];
      saveCartToServer(newCart);
      return newCart;
    });
  };

  const removeFromCart = (key) => {
    setCartItems(prev => {
      const newCart = prev.filter(i => i.key !== key);
      saveCartToServer(newCart);
      return newCart;
    });
  };

  const updateQuantity = (key, delta) => {
    setCartItems(prev => {
      const newCart = prev.map(i =>
        i.key === key ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i
      );
      saveCartToServer(newCart);
      return newCart;
    });
  };

  const clearCart = () => {
    setCartItems([]);
    saveCartToServer([]);
  };

  const totalCount = cartItems.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = cartItems.reduce((sum, i) => sum + i.product.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{
      cartItems, addToCart, removeFromCart,
      updateQuantity, clearCart, totalCount, totalPrice,
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};