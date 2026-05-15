'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "./AuthContext";

const WishlistContext = createContext(null);

export const WishlistProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const lastFetchedPhone = useRef(null); // prevent duplicate fetches

  // user.phone is what your navbar uses — matches phoneNumber in DB
  // Try all possible field names your AuthContext might use
  const phone = user?.phone || user?.phoneNumber || user?.mobile || null;

  useEffect(() => {
    // Not logged in — clear wishlist
    if (!isAuthenticated || !phone) {
      setWishlistItems([]);
      lastFetchedPhone.current = null;
      return;
    }

    // Already fetched for this phone on this session — skip
    if (lastFetchedPhone.current === phone) return;

    const fetchWishlist = async () => {
      setLoading(true);
      lastFetchedPhone.current = phone;
      try {
        const res = await fetch(`/api/wishlist?phone=${encodeURIComponent(phone)}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setWishlistItems(data.wishlist || []);
      } catch (err) {
        console.error('[Wishlist] Failed to fetch:', err);
        lastFetchedPhone.current = null; // allow retry
      } finally {
        setLoading(false);
      }
    };

    fetchWishlist();
  }, [isAuthenticated, phone]); // re-runs whenever auth state resolves

  const addToWishlist = useCallback(async (product) => {
    if (!phone) return;
    setWishlistItems((prev) =>
      prev.find((p) => p.id === product.id) ? prev : [...prev, product]
    );
    try {
      const res = await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, product }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch (err) {
      console.error('[Wishlist] Failed to add:', err);
      setWishlistItems((prev) => prev.filter((p) => p.id !== product.id)); // rollback
    }
  }, [phone]);

  const removeFromWishlist = useCallback(async (productId) => {
    if (!phone) return;
    setWishlistItems((prev) => prev.filter((p) => p.id !== productId));
    try {
      const res = await fetch('/api/wishlist', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, productId }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch (err) {
      console.error('[Wishlist] Failed to remove:', err);
    }
  }, [phone]);

  const isInWishlist = useCallback(
    (productId) => wishlistItems.some((p) => p.id === productId),
    [wishlistItems]
  );

  return (
    <WishlistContext.Provider value={{ wishlistItems, addToWishlist, removeFromWishlist, isInWishlist, loading }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider');
  return ctx;
};