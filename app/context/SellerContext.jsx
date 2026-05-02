'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const SellerContext = createContext();

export const useSeller = () => {
  const context = useContext(SellerContext);
  if (!context) throw new Error('useSeller must be used within SellerProvider');
  return context;
};

export const SellerProvider = ({ children }) => {
  const [seller, setSeller] = useState(null);
  const [isSellerAuthenticated, setIsSellerAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const savedSeller = localStorage.getItem('bazrushSeller');
    if (savedSeller) {
      const sellerData = JSON.parse(savedSeller);
      setSeller(sellerData);
      setIsSellerAuthenticated(true);
    }
    setLoading(false);
  }, []);

  // Poll latest seller data every 5s
  useEffect(() => {
    if (!seller?.phoneNumber) return;

    const fetchLatestSeller = async () => {
      try {
        const res = await fetch(`/api/sellers/${encodeURIComponent(seller.phoneNumber)}`);
        if (!res.ok) return;
        const data = await res.json();
        const latestSeller = data?.seller;
        if (latestSeller && JSON.stringify(latestSeller) !== JSON.stringify(seller)) {
          setSeller(latestSeller);
          localStorage.setItem('bazrushSeller', JSON.stringify(latestSeller));
        }
      } catch (error) {
        console.error('Error polling seller data:', error);
      }
    };

    fetchLatestSeller();
    const intervalId = setInterval(fetchLatestSeller, 5000);
    return () => clearInterval(intervalId);
  }, [seller?.phoneNumber]);

  // Sync across tabs
  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key !== 'bazrushSeller' || !event.newValue) return;
      try {
        const stored = JSON.parse(event.newValue);
        if (stored?.phoneNumber === seller?.phoneNumber) {
          setSeller(stored);
          setIsSellerAuthenticated(true);
        }
      } catch (error) {
        console.error('Error parsing stored seller data:', error);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [seller?.phoneNumber]);

  const registerSeller = async (sellerData) => {
    try {
      const res = await fetch('/api/sellers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sellerData),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Registration failed');
      }
      const data = await res.json();
      localStorage.setItem('bazrushSeller', JSON.stringify(data.seller));
      setSeller(data.seller);
      setIsSellerAuthenticated(true);
      return { success: true, data: data.seller };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const loginSeller = async (phoneOrEmail, password) => {
    try {
      const res = await fetch('/api/sellers/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneOrEmail, password }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Login failed');
      }
      const data = await res.json();
      localStorage.setItem('bazrushSeller', JSON.stringify(data.seller));
      setSeller(data.seller);
      setIsSellerAuthenticated(true);
      return { success: true, data: data.seller };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logoutSeller = () => {
    localStorage.removeItem('bazrushSeller');
    setSeller(null);
    setIsSellerAuthenticated(false);
    if (typeof window !== 'undefined') window.location.href = '/';
  };

  const updateSellerProfile = async (updatedData) => {
    if (!seller) return { success: false, error: 'No seller found' };
    try {
      const res = await fetch(`/api/sellers/${encodeURIComponent(seller.phoneNumber)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Update failed');
      }
      const data = await res.json();
      if (!data.seller) throw new Error('No seller data in response');
      localStorage.setItem('bazrushSeller', JSON.stringify(data.seller));
      setSeller(data.seller);
      return { success: true, data: data.seller };
    } catch (error) {
      console.error('Profile update error:', error);
      return { success: false, error: error.message };
    }
  };

  return (
    <SellerContext.Provider value={{
      seller, isSellerAuthenticated, loading,
      registerSeller, loginSeller, logoutSeller, updateSellerProfile,
    }}>
      {children}
    </SellerContext.Provider>
  );
};

export default SellerContext;