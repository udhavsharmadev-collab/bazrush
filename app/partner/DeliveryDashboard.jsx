"use client";

import { useState, useEffect } from "react";
import { useDeliveryPartner } from "../context/DeliveryPartnerContext";
import DeliveryOrders from "./DeliveryOrders";
import FinancePanel from "./Finance";

const VEHICLE_ICONS = { bike: "🛵", bicycle: "🚲", car: "🚗", foot: "🚶" };

// ── Password Input ─────────────────────────────────────────────────────────────
function PasswordInput({ value, onChange, placeholder = "Enter password", label, hint }) {
  const [show, setShow] = useState(false);
  return (
    <div>
      {label && (
        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">{label}</label>
      )}
      <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-purple-400 transition-all">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="flex-1 bg-transparent px-4 py-3 text-sm font-medium text-gray-900 placeholder-gray-300 focus:outline-none"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="px-3 text-gray-300 hover:text-gray-500 transition-colors select-none"
          tabIndex={-1}
        >
          {show ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          )}
        </button>
      </div>
      {hint && <p className="text-[10px] text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

// ── Change Password Modal ──────────────────────────────────────────────────────
function ChangePasswordModal({ partner, onClose }) {
  const [current, setCurrent] = useState("");
  const [next, setNext]       = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange = async () => {
    setError("");
    if (!current)         { setError("Enter your current password"); return; }
    if (next.length < 6)  { setError("New password must be at least 6 characters"); return; }
    if (next !== confirm)  { setError("New passwords do not match"); return; }
    if (next === current)  { setError("New password must be different from current"); return; }
    setLoading(true);
    try {
      const res  = await fetch(`/api/delivery-partners/${partner.phoneNumber.replace('+91', '')}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "change-password", currentPassword: current, newPassword: next }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Password change failed"); setLoading(false); return; }
      setSuccess(true);
      setTimeout(() => onClose(), 1500);
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-5 py-4 flex items-center justify-between">
          <h2 className="font-black text-white text-lg">🔑 Change Password</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-white/20 hover:bg-white/30 text-white font-black flex items-center justify-center transition-all">✕</button>
        </div>
        <div className="p-5 space-y-4">
          <PasswordInput label="Current Password" value={current} onChange={(e) => setCurrent(e.target.value)} placeholder="Your current password" />
          <PasswordInput label="New Password" value={next} onChange={(e) => setNext(e.target.value)} placeholder="Min. 6 characters" hint="At least 6 characters" />
          <PasswordInput label="Confirm New Password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Re-enter new password" />
          {error   && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-500 text-sm font-medium">⚠️ {error}</div>}
          {success && <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-emerald-600 text-sm font-black text-center">✅ Password changed successfully!</div>}
          <div className="flex gap-2 pt-1">
            <button onClick={onClose} className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 font-black text-sm rounded-xl transition-all">Cancel</button>
            <button onClick={handleChange} disabled={loading}
              className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-black text-sm rounded-xl shadow-lg shadow-purple-200 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50">
              {loading ? "Saving…" : "Update Password"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Profile Edit ───────────────────────────────────────────────────────────────
function ProfileEdit({ partner, onUpdate, onClose }) {
  const [name, setName]                   = useState(partner.name || "");
  const [vehicleType, setVehicleType]     = useState(partner.vehicleType || "bike");
  const [vehicleNumber, setVehicleNumber] = useState(partner.vehicleNumber || "");
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState("");
  const [success, setSuccess]             = useState(false);
  const [showChangePw, setShowChangePw]   = useState(false);

  const handleSave = async () => {
    setError("");
    if (!name.trim())          { setError("Name is required"); return; }
    if (!vehicleNumber.trim()) { setError("Vehicle number is required"); return; }
    setLoading(true);
    try {
      const res  = await fetch("/api/delivery-partners", {
        method: "PUT", headers: { "Content-Type": "application/json" },
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
    } catch { setError("Something went wrong. Try again."); }
    finally   { setLoading(false); }
  };

  return (
    <>
      {showChangePw && <ChangePasswordModal partner={partner} onClose={() => setShowChangePw(false)} />}
      <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden max-h-[90vh] overflow-y-auto">
          <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-5 py-4 flex items-center justify-between">
            <h2 className="font-black text-white text-lg">Edit Profile</h2>
            <button onClick={onClose} className="w-8 h-8 rounded-xl bg-white/20 hover:bg-white/30 text-white font-black flex items-center justify-center transition-all">✕</button>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Phone Number</label>
              <div className="flex items-center bg-gray-100 border border-gray-200 rounded-xl overflow-hidden">
                <span className="px-4 py-3 text-sm font-black text-gray-400 bg-gray-100 border-r border-gray-200 select-none">+91</span>
                <span className="flex-1 px-4 py-3 text-sm font-medium text-gray-400">{partner.phoneNumber.replace("+91", "")}</span>
                <span className="px-3 py-1 mr-2 bg-gray-200 text-gray-400 text-[10px] font-black rounded-lg">Locked</span>
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Full Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ravi Kumar"
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-300 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Vehicle Type</label>
              <div className="grid grid-cols-4 gap-2">
                {Object.entries(VEHICLE_ICONS).map(([key, icon]) => (
                  <button key={key} onClick={() => setVehicleType(key)}
                    className={`py-3 rounded-xl text-xl transition-all border ${vehicleType === key ? "bg-purple-50 border-purple-400 shadow-md shadow-purple-100" : "bg-gray-50 border-gray-200 hover:border-gray-300"}`}>
                    {icon}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-1 capitalize">{vehicleType} selected</p>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">
                Vehicle Number <span className="text-red-400 normal-case font-black">*required</span>
              </label>
              <input type="text" value={vehicleNumber} onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())} placeholder="HR 05 AB 1234"
                className={`w-full bg-gray-50 border text-gray-900 placeholder-gray-300 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all ${!vehicleNumber.trim() ? "border-red-200" : "border-gray-200"}`} />
              {!vehicleNumber.trim() && <p className="text-[10px] text-red-400 font-bold mt-1">Vehicle number is mandatory</p>}
            </div>
            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Account Security</p>
              <button onClick={() => setShowChangePw(true)}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl hover:bg-purple-50 hover:border-purple-200 transition-all group">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🔑</span>
                  <div className="text-left">
                    <p className="text-sm font-bold text-gray-700 group-hover:text-purple-700">Change Password</p>
                    <p className="text-[10px] text-gray-400">Update your account password</p>
                  </div>
                </div>
                <span className="text-gray-300 group-hover:text-purple-400 font-bold">›</span>
              </button>
            </div>
            {error   && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-500 text-sm font-medium">⚠️ {error}</div>}
            {success && <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-emerald-600 text-sm font-black text-center">✅ Profile updated!</div>}
            <div className="flex gap-2 pt-1">
              <button onClick={onClose} className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 font-black text-sm rounded-xl transition-all">Cancel</button>
              <button onClick={handleSave} disabled={loading}
                className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-black text-sm rounded-xl shadow-lg shadow-purple-200 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50">
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────────
export default function DeliveryDashboard() {
  const { partner: ctxPartner, loginPartner, logoutPartner } = useDeliveryPartner();
  const [partner, setPartner]         = useState(ctxPartner);
  const [showProfile, setShowProfile] = useState(false);

  // ✅ Always accepts a fresh partner object and syncs everywhere
  const handlePartnerUpdate = (updated) => {
    if (!updated) return;
    setPartner(updated);
    loginPartner(updated);
  };

  // ── Poll MongoDB every 8s (reduced from 10s for faster settlement sync) ───
  useEffect(() => {
    if (!partner?.phoneNumber) return;
    const poll = async () => {
      try {
        const res  = await fetch(`/api/delivery-partners?phoneNumber=${partner.phoneNumber}`);
        const data = await res.json();
        if (data?.partner) {
          // ✅ Always update — this pushes new lastSettledAt into FinancePanel
          // which triggers COD recalc automatically
          setPartner(data.partner);
          loginPartner(data.partner);
        }
      } catch {}
    };
    // Run immediately on mount too
    poll();
    const id = setInterval(poll, 8_000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partner?.phoneNumber]);

  // Push geolocation on mount
  useEffect(() => {
    if (!partner?.phoneNumber) return;
    navigator.geolocation?.getCurrentPosition(async (pos) => {
      try {
        await fetch("/api/delivery-partners", {
          method: "PUT", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phoneNumber: partner.phoneNumber,
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          }),
        });
        setPartner(prev => ({ ...prev, lat: pos.coords.latitude, lng: pos.coords.longitude }));
      } catch {}
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleOnline = async () => {
    try {
      const res  = await fetch("/api/delivery-partners", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: partner.phoneNumber, isOnline: !partner.isOnline }),
      });
      const data = await res.json();
      if (data.partner) handlePartnerUpdate(data.partner);
    } catch {}
  };

  if (!partner) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {showProfile && (
        <ProfileEdit partner={partner} onUpdate={handlePartnerUpdate} onClose={() => setShowProfile(false)} />
      )}

      {/* Sticky header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setShowProfile(true)}
              className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-600 to-purple-700 flex items-center justify-center text-xl shadow-md shadow-purple-100 hover:scale-105 transition-all">
              {VEHICLE_ICONS[partner.vehicleType] || "🛵"}
            </button>
            <div>
              <div className="flex items-center gap-1.5">
                <p className="font-black text-gray-900 text-sm">{partner.name}</p>
                <button onClick={() => setShowProfile(true)} className="text-[10px] text-purple-500 font-bold hover:underline">Edit</button>
              </div>
              <p className="text-[11px] text-gray-400">{partner.phoneNumber}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggleOnline}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-xs border transition-all ${
                partner.isOnline
                  ? "bg-emerald-50 border-emerald-200 text-emerald-600"
                  : "bg-gray-100 border-gray-200 text-gray-500 hover:bg-gray-200"
              }`}>
              <span className={`w-2 h-2 rounded-full ${partner.isOnline ? "bg-emerald-500 animate-pulse" : "bg-gray-400"}`} />
              {partner.isOnline ? "Online" : "Offline"}
            </button>
            <button onClick={logoutPartner}
              className="px-3 py-2 bg-gray-100 hover:bg-red-50 hover:text-red-500 hover:border-red-200 border border-transparent text-gray-500 font-bold text-xs rounded-xl transition-all">
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
            <p className="text-2xl font-black">₹{(partner.totalEarnings || 0).toLocaleString("en-IN")}</p>
            <p className="text-emerald-100 text-[11px] font-semibold mt-0.5">Earnings</p>
            <p className="text-xl mt-1">💰</p>
          </div>
          <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl p-4 text-white shadow-lg shadow-amber-100">
            <p className="text-2xl">{VEHICLE_ICONS[partner.vehicleType] || "🛵"}</p>
            <p className="text-amber-100 text-[11px] font-semibold mt-0.5 capitalize">{partner.vehicleType || "Bike"}</p>
            <p className="text-white font-black text-[10px] mt-1 tracking-wider">{partner.vehicleNumber || "—"}</p>
          </div>
        </div>

        {/* ✅ Finance panel — receives live partner prop, auto-updates when
            lastSettledAt changes after admin confirms payment */}
        <FinancePanel
          partner={partner}
          onPartnerUpdate={onPartnerUpdate => {
            // FinancePanel calls this with no args (just to signal "I Paid")
            // We don't need to do anything extra — polling handles the rest
          }}
        />

        {/* Profile quick card */}
        <div className="bg-white border border-gray-100 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-xl">
            {VEHICLE_ICONS[partner.vehicleType] || "🛵"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-black text-gray-800 text-sm">{partner.name}</p>
            <p className="text-[11px] text-gray-400">{partner.vehicleNumber} · {partner.vehicleType}</p>
          </div>
          <button onClick={() => setShowProfile(true)}
            className="px-3 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-black text-xs rounded-xl shadow-md shadow-purple-100 hover:scale-105 transition-all">
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
            <button onClick={toggleOnline}
              className="px-3 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black text-xs rounded-xl hover:scale-105 transition-all shadow-md shadow-amber-100">
              Go Online
            </button>
          </div>
        )}

        {partner.isOnline ? (
          <DeliveryOrders key={partner.phoneNumber} partner={partner} onPartnerUpdate={handlePartnerUpdate} />
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