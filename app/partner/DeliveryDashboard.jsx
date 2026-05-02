"use client";

import { useState, useEffect } from "react";
import { useDeliveryPartner } from "../context/DeliveryPartnerContext";
import DeliveryOrders from "./DeliveryOrders";

const VEHICLE_ICONS = { bike: "🛵", bicycle: "🚲", car: "🚗", foot: "🚶" };

// ── Profile Edit ──────────────────────────────────────────────────────────────
function ProfileEdit({ partner, onUpdate, onClose }) {
  const [name, setName] = useState(partner.name || "");
  const [vehicleType, setVehicleType] = useState(partner.vehicleType || "bike");
  const [vehicleNumber, setVehicleNumber] = useState(partner.vehicleNumber || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSave = async () => {
    setError("");
    if (!name.trim()) { setError("Name is required"); return; }
    if (!vehicleNumber.trim()) { setError("Vehicle number is required"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/delivery-partners", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: partner.phoneNumber,
          name: name.trim(),
          vehicleType,
          vehicleNumber: vehicleNumber.trim().toUpperCase(),
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Update failed"); setLoading(false); return; }
      onUpdate(data.partner);
      setSuccess(true);
      setTimeout(() => { setSuccess(false); onClose(); }, 1200);
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-5 py-4 flex items-center justify-between">
          <h2 className="font-black text-white text-lg">Edit Profile</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-white/20 hover:bg-white/30 text-white font-black flex items-center justify-center transition-all">✕</button>
        </div>

        <div className="p-5 space-y-4">
          {/* Phone — read only */}
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Phone Number</label>
            <div className="flex items-center bg-gray-100 border border-gray-200 rounded-xl overflow-hidden">
              <span className="px-4 py-3 text-sm font-black text-gray-400 bg-gray-100 border-r border-gray-200 select-none">+91</span>
              <span className="flex-1 px-4 py-3 text-sm font-medium text-gray-400">{partner.phoneNumber.replace("+91", "")}</span>
              <span className="px-3 py-1 mr-2 bg-gray-200 text-gray-400 text-[10px] font-black rounded-lg">Locked</span>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Full Name</label>
            <input
              type="text" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Ravi Kumar"
              className="w-full bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-300 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all"
            />
          </div>

          {/* Vehicle type */}
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Vehicle Type</label>
            <div className="grid grid-cols-4 gap-2">
              {Object.entries(VEHICLE_ICONS).map(([key, icon]) => (
                <button
                  key={key} onClick={() => setVehicleType(key)}
                  className={`py-3 rounded-xl text-xl transition-all border ${
                    vehicleType === key
                      ? "bg-purple-50 border-purple-400 shadow-md shadow-purple-100"
                      : "bg-gray-50 border-gray-200 hover:border-gray-300"
                  }`}
                >{icon}</button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-1 capitalize">{vehicleType} selected</p>
          </div>

          {/* Vehicle number — required */}
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">
              Vehicle Number <span className="text-red-400 normal-case font-black">*required</span>
            </label>
            <input
              type="text" value={vehicleNumber}
              onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
              placeholder="HR 05 AB 1234"
              className={`w-full bg-gray-50 border text-gray-900 placeholder-gray-300 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all ${
                !vehicleNumber.trim() ? "border-red-200" : "border-gray-200"
              }`}
            />
            {!vehicleNumber.trim() && (
              <p className="text-[10px] text-red-400 font-bold mt-1">Vehicle number is mandatory</p>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-500 text-sm font-medium">
              ⚠️ {error}
            </div>
          )}

          {success && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-emerald-600 text-sm font-black text-center">
              ✅ Profile updated!
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 font-black text-sm rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSave} disabled={loading}
              className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-black text-sm rounded-xl shadow-lg shadow-purple-200 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function DeliveryDashboard() {
  const { partner: ctxPartner, loginPartner, logoutPartner } = useDeliveryPartner();
  const [partner, setPartner] = useState(ctxPartner);
  const [showProfile, setShowProfile] = useState(false);

  const handlePartnerUpdate = (updated) => {
    setPartner(updated);
    loginPartner(updated);
  };

  useEffect(() => {
    if (!partner?.phoneNumber) return;
    navigator.geolocation?.getCurrentPosition(async (pos) => {
      try {
        await fetch("/api/delivery-partners", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phoneNumber: partner.phoneNumber, lat: pos.coords.latitude, lng: pos.coords.longitude }),
        });
        setPartner(prev => ({ ...prev, lat: pos.coords.latitude, lng: pos.coords.longitude }));
      } catch {}
    });
  }, []);

  const toggleOnline = async () => {
    try {
      const res = await fetch("/api/delivery-partners", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: partner.phoneNumber, isOnline: !partner.isOnline }),
      });
      const data = await res.json();
      if (data.partner) {
        setPartner(prev => ({ ...prev, isOnline: data.partner.isOnline }));
        loginPartner({ ...data.partner, lat: partner.lat, lng: partner.lng });
      }
    } catch {}
  };

  if (!partner) return null;

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Profile modal */}
      {showProfile && (
        <ProfileEdit
          partner={partner}
          onUpdate={handlePartnerUpdate}
          onClose={() => setShowProfile(false)}
        />
      )}

      {/* Sticky header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowProfile(true)}
              className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-600 to-purple-700 flex items-center justify-center text-xl shadow-md shadow-purple-100 hover:scale-105 transition-all"
              title="Edit Profile"
            >
              {VEHICLE_ICONS[partner.vehicleType] || "🛵"}
            </button>
            <div>
              <div className="flex items-center gap-1.5">
                <p className="font-black text-gray-900 text-sm">{partner.name}</p>
                <button
                  onClick={() => setShowProfile(true)}
                  className="text-[10px] text-purple-500 font-bold hover:underline"
                >
                  Edit
                </button>
              </div>
              <p className="text-[11px] text-gray-400">{partner.phoneNumber}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleOnline}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-xs border transition-all ${
                partner.isOnline
                  ? "bg-emerald-50 border-emerald-200 text-emerald-600"
                  : "bg-gray-100 border-gray-200 text-gray-500 hover:bg-gray-200"
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${partner.isOnline ? "bg-emerald-500 animate-pulse" : "bg-gray-400"}`} />
              {partner.isOnline ? "Online" : "Offline"}
            </button>
            <button
              onClick={logoutPartner}
              className="px-3 py-2 bg-gray-100 hover:bg-red-50 hover:text-red-500 hover:border-red-200 border border-transparent text-gray-500 font-bold text-xs rounded-xl transition-all"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5 space-y-5">

        {/* Stats cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl p-4 text-white shadow-lg shadow-purple-100">
            <p className="text-2xl font-black">{partner.totalDeliveries || 0}</p>
            <p className="text-purple-200 text-[11px] font-semibold mt-0.5">Deliveries</p>
            <p className="text-xl mt-1">📦</p>
          </div>
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-4 text-white shadow-lg shadow-emerald-100">
            <p className="text-2xl font-black">₹{partner.totalEarnings || 0}</p>
            <p className="text-emerald-100 text-[11px] font-semibold mt-0.5">Earnings</p>
            <p className="text-xl mt-1">💰</p>
          </div>
          <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl p-4 text-white shadow-lg shadow-amber-100">
            <p className="text-2xl">{VEHICLE_ICONS[partner.vehicleType] || "🛵"}</p>
            <p className="text-amber-100 text-[11px] font-semibold mt-0.5 capitalize">{partner.vehicleType || "Bike"}</p>
            <p className="text-white font-black text-[10px] mt-1 tracking-wider">
              {partner.vehicleNumber || "—"}
            </p>
          </div>
        </div>

        {/* Profile quick card */}
        <div className="bg-white border border-gray-100 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-xl">
            {VEHICLE_ICONS[partner.vehicleType] || "🛵"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-black text-gray-800 text-sm">{partner.name}</p>
            <p className="text-[11px] text-gray-400">{partner.vehicleNumber} · {partner.vehicleType}</p>
          </div>
          <button
            onClick={() => setShowProfile(true)}
            className="px-3 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-black text-xs rounded-xl shadow-md shadow-purple-100 hover:scale-105 transition-all"
          >
            ✏️ Edit Profile
          </button>
        </div>

        {/* Offline warning */}
        {!partner.isOnline && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div className="flex-1">
              <p className="font-black text-amber-700 text-sm">You are offline</p>
              <p className="text-amber-500 text-xs">Go online to start accepting orders</p>
            </div>
            <button
              onClick={toggleOnline}
              className="px-3 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black text-xs rounded-xl hover:scale-105 transition-all shadow-md shadow-amber-100"
            >
              Go Online
            </button>
          </div>
        )}

        {/* ✅ FIX: Stable key using phoneNumber so DeliveryOrders never unmounts/remounts
            when the partner object reference changes due to context polling.
            Previously {partner.isOnline && <DeliveryOrders>} would unmount the component
            every time context set a new partner object, causing a fresh DB fetch that
            raced the PATCH and flashed the order back to "available". */}
        {partner.isOnline ? (
          <DeliveryOrders
            key={partner.phoneNumber}
            partner={partner}
            onPartnerUpdate={handlePartnerUpdate}
          />
        ) : (
          <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-gray-100 shadow-sm text-center px-6">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center text-4xl mb-4">🔴</div>
            <h3 className="text-xl font-black text-gray-800 mb-1">You are Offline</h3>
            <p className="text-gray-400 text-sm mb-6">Go online to start seeing and accepting delivery orders</p>
            <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-gray-300" />
              Orders are hidden while offline
            </div>
          </div>
        )}
      </div>
    </div>
  );
}