'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const savedUser = localStorage.getItem('bazrushUser');
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      setUser(userData);
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const normalizePhone = (phone) => {
    if (!phone) return phone;
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 10) return `+91${digits}`;
    if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
    return phone;
  };

  const login = async (phone) => {
    const phoneKey = normalizePhone(phone);
    let profile = { name: '', age: '', email: '', address: '', lat: 20.5937, lng: 78.9629 };

    try {
      // ✅ fetch just this one user, not the whole DB
      const res = await fetch(`/api/users/${encodeURIComponent(phoneKey)}`);

      if (res.ok) {
        const userData = await res.json();
        const { cart, orders, ...profileFields } = userData;
        profile = profileFields;
      } else {
        // New user — create them
        await fetch(`/api/users/${encodeURIComponent(phoneKey)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phoneNumber: phoneKey, ...profile, cart: [], orders: [] }),
        });
        console.log('✅ New user created:', phoneKey);
      }
    } catch (e) {
      console.error('Login fetch failed:', e);
    }

    const userData = { phone: phoneKey, verified: true, profile };
    localStorage.setItem('bazrushUser', JSON.stringify(userData));
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('bazrushUser');
    localStorage.removeItem('bazrushAddresses');
    localStorage.removeItem('bazrush_cart');
    setUser(null);
    setIsAuthenticated(false);
    setAddresses([]);
    if (typeof window !== 'undefined') window.location.href = '/';
  };

  const updateProfile = async (profileData) => {
    if (!user) return;
    const phoneKey = normalizePhone(user.phone);
    const mergedProfile = { ...user.profile, ...profileData };
    const updatedUser = { ...user, profile: mergedProfile };

    localStorage.setItem('bazrushUser', JSON.stringify(updatedUser));
    setUser(updatedUser);

    try {
      // ✅ PATCH only this user's fields
      const res = await fetch(`/api/users/${encodeURIComponent(phoneKey)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: mergedProfile.name,
          age: mergedProfile.age,
          email: mergedProfile.email,
          address: mergedProfile.address,
          lat: mergedProfile.lat,
          lng: mergedProfile.lng,
        }),
      });
      const result = await res.json();
      if (!result.success) throw new Error('Save failed');
      console.log('✅ Profile saved!');
    } catch (e) {
      console.error('❌ updateProfile failed:', e);
      throw e;
    }
  };

  const invalidateCache = () => {
    if (user) {
      localStorage.removeItem('bazrushUser');
      login(user.phone);
    }
  };

  const saveAddress = (address) => {
    const newAddresses = [...addresses, { id: Date.now(), ...address }];
    localStorage.setItem('bazrushAddresses', JSON.stringify(newAddresses));
    setAddresses(newAddresses);
  };

  const updateAddress = (id, updatedAddress) => {
    const newAddresses = addresses.map(addr =>
      addr.id === id ? { ...addr, ...updatedAddress } : addr
    );
    localStorage.setItem('bazrushAddresses', JSON.stringify(newAddresses));
    setAddresses(newAddresses);
  };

  const deleteAddress = (id) => {
    const newAddresses = addresses.filter(addr => addr.id !== id);
    localStorage.setItem('bazrushAddresses', JSON.stringify(newAddresses));
    setAddresses(newAddresses);
  };

  // ✅ Poll only this user's data every 5s
  useEffect(() => {
    if (!isAuthenticated || !user?.phone) return;
    const phoneKey = normalizePhone(user.phone);

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/users/${encodeURIComponent(phoneKey)}`);
        if (!res.ok) return;
        const remote = await res.json();

        const { cart, orders, ...remoteProfile } = remote;
        const updatedUser = { ...user, profile: remoteProfile };
        localStorage.setItem('bazrushUser', JSON.stringify(updatedUser));
        setUser(updatedUser);
      } catch (e) {
        console.log('Poll failed:', e);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isAuthenticated, user?.phone]);

  return (
    <AuthContext.Provider value={{
      user, addresses, isAuthenticated, loading,
      login, logout, updateProfile, invalidateCache,
      saveAddress, updateAddress, deleteAddress,
    }}>
      {children}
    </AuthContext.Provider>
  );
};