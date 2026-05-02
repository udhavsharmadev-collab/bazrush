'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const DeliveryPartnerContext = createContext(null);

export function DeliveryPartnerProvider({ children }) {
  const [partner, setPartner] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('bazrushPartner');
      if (saved) setPartner(JSON.parse(saved));
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!partner?.phoneNumber) return;
    const fetchLatest = async () => {
      try {
        const res = await fetch(`/api/delivery-partners/${encodeURIComponent(partner.phoneNumber)}`);
        if (!res.ok) return;
        const data = await res.json();
        const latest = data?.partner;
        if (!latest) return;

        const changed =
          latest.totalDeliveries !== partner.totalDeliveries ||
          latest.totalEarnings   !== partner.totalEarnings   ||
          latest.isOnline        !== partner.isOnline        ||
          latest.name            !== partner.name            ||
          latest.vehicleType     !== partner.vehicleType     ||
          latest.vehicleNumber   !== partner.vehicleNumber;

        if (changed) {
          setPartner(latest);
          localStorage.setItem('bazrushPartner', JSON.stringify(latest));
        }
      } catch {}
    };
    fetchLatest();
    const interval = setInterval(fetchLatest, 5000);
    return () => clearInterval(interval);
  }, [partner?.phoneNumber]);

  const loginPartner = (partnerData) => {
    localStorage.setItem('bazrushPartner', JSON.stringify(partnerData));
    setPartner(partnerData);
  };

  const registerPartner = async (partnerData) => {
    try {
      const res = await fetch('/api/delivery-partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(partnerData),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Registration failed');
      }
      const data = await res.json();
      loginPartner(data.partner);
      return { success: true, data: data.partner };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logoutPartner = () => {
    localStorage.removeItem('bazrushPartner');
    setPartner(null);
    if (typeof window !== 'undefined') window.location.href = '/';
  };

  const updatePartnerProfile = async (updatedData) => {
    if (!partner) return { success: false, error: 'No partner found' };
    try {
      const res = await fetch(`/api/delivery-partners/${encodeURIComponent(partner.phoneNumber)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Update failed');
      }
      const data = await res.json();
      if (!data.partner) throw new Error('No partner data in response');
      loginPartner(data.partner);
      return { success: true, data: data.partner };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  return (
    <DeliveryPartnerContext.Provider value={{
      partner,
      isPartnerAuthenticated: !!partner,
      loading,
      loginPartner,
      registerPartner,
      logoutPartner,
      updatePartnerProfile,
    }}>
      {children}
    </DeliveryPartnerContext.Provider>
  );
}

export function useDeliveryPartner() {
  const ctx = useContext(DeliveryPartnerContext);
  if (!ctx) throw new Error('useDeliveryPartner must be used within DeliveryPartnerProvider');
  return ctx;
}