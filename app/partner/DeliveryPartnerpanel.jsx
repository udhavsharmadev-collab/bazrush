"use client";

import { useState } from "react";
import { useDeliveryPartner } from "../context/DeliveryPartnerContext";
import DeliveryDashboard from "./DeliveryDashboard";

const VEHICLE_ICONS = { bike: "🛵", bicycle: "🚲", car: "🚗", foot: "🚶" };

// ── Password Input ─────────────────────────────────────────────────────────────
function PasswordInput({ value, onChange, placeholder = "Enter password", label, hint }) {
  const [show, setShow] = useState(false);
  return (
    <div>
      {label && (
        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">
          {label}
        </label>
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

// ── Set Password Flow (for old partners who never set one) ─────────────────────
function SetPasswordFlow({ partner, onDone }) {
  const [password, setPassword]     = useState("");
  const [confirm, setConfirm]       = useState("");
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");
  const [success, setSuccess]       = useState(false);

  const handleSet = async () => {
    setError("");
    if (password.length < 6)         { setError("Password must be at least 6 characters"); return; }
    if (password !== confirm)         { setError("Passwords do not match"); return; }
    setLoading(true);
    try {
      const res  = await fetch("/api/delivery-partners", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: partner.phoneNumber, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to set password"); setLoading(false); return; }
      setSuccess(true);
      setTimeout(() => onDone(data.partner), 1000);
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-purple-600 to-purple-700 shadow-2xl shadow-purple-200 mb-4">
            <span className="text-4xl">🔐</span>
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Secure Your Account</h1>
          <p className="text-gray-400 text-sm mt-1 font-medium">
            Hey <span className="font-bold text-gray-600">{partner.name}</span>! Set a password to protect your account.
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-amber-700 text-xs font-medium">
            ⚠️ We've added password protection. Set your password now to keep logging in seamlessly.
          </div>

          <PasswordInput
            label="New Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min. 6 characters"
            hint="At least 6 characters"
          />
          <PasswordInput
            label="Confirm Password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Re-enter password"
          />

          {error   && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-500 text-sm font-medium">⚠️ {error}</div>}
          {success && <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-emerald-600 text-sm font-black text-center">✅ Password set! Logging you in…</div>}

          <button
            onClick={handleSet}
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-black rounded-xl text-sm shadow-lg shadow-purple-200 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100"
          >
            {loading ? "Setting password…" : "Set Password & Continue →"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Panel ─────────────────────────────────────────────────────────────────
export default function DeliveryPartnerPanel() {
  const { isPartnerAuthenticated, loginPartner } = useDeliveryPartner();

  const [phone, setPhone]         = useState("");
  const [name, setName]           = useState("");
  const [vehicle, setVehicle]     = useState("bike");
  const [vehicleNum, setVehicleNum] = useState("");
  const [password, setPassword]   = useState("");
  const [confirm, setConfirm]     = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");

  // When an existing partner has no password yet
  const [needsPassword, setNeedsPassword] = useState(false);
  const [pendingPartner, setPendingPartner] = useState(null);

  const fullPhone = "+91" + phone;

  const handleSubmit = async () => {
    setError("");
    if (!phone || phone.length < 10) { setError("Enter a valid 10-digit phone number"); return; }

    if (isRegister) {
      if (!name.trim())        { setError("Name is required"); return; }
      if (!vehicleNum.trim())  { setError("Vehicle number is required"); return; }
      if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
      if (password !== confirm) { setError("Passwords do not match"); return; }
    } else {
      // Login — password required only after we know they have one
      // We'll handle the no-password case below
    }

    setLoading(true);
    try {
      if (isRegister) {
        const res  = await fetch("/api/delivery-partners", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phoneNumber: fullPhone,
            name,
            vehicleType: vehicle,
            vehicleNumber: vehicleNum,
            password,
          }),
        });
        const data = await res.json();
        if (!res.ok) { setError(data.error || "Registration failed"); setLoading(false); return; }
        loginPartner(data.partner);
      } else {
        // LOGIN - phone sent in POST body to completely avoid +91 URL encoding issues
        const res = await fetch("/api/delivery-partners", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "lookup", phoneNumber: fullPhone }),
        });
        const data = await res.json();
        if (!res.ok) { setError("Partner not found. Please register first."); setLoading(false); return; }

        const found = data.partner;

        // If partner has no password yet -> show set-password flow
        if (!found.hasPassword) {
          setPendingPartner(found);
          setNeedsPassword(true);
          setLoading(false);
          return;
        }

        // Partner has a password -> validate it
        if (!password) { setError("Enter your password to continue"); setLoading(false); return; }

        const loginRes = await fetch("/api/delivery-partners", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "login", phoneNumber: fullPhone, password }),
        });
        const loginData = await loginRes.json();
        if (!loginRes.ok) { setError(loginData.error || "Incorrect password"); setLoading(false); return; }
        loginPartner(loginData.partner);
      }
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  // Old partner sets password for the first time
  if (needsPassword && pendingPartner) {
    return (
      <SetPasswordFlow
        partner={pendingPartner}
        onDone={(updatedPartner) => {
          setNeedsPassword(false);
          loginPartner(updatedPartner);
        }}
      />
    );
  }

  if (isPartnerAuthenticated) return <DeliveryDashboard />;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-purple-600 to-purple-700 shadow-2xl shadow-purple-200 mb-4">
            <span className="text-4xl">🛵</span>
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">
            Delivery<span className="bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent">Hub</span>
          </h1>
          <p className="text-gray-400 text-sm mt-1 font-medium">Partner Portal</p>
        </div>

        {/* Card */}
        <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-xl">

          {/* Tab switcher */}
          <div className="flex gap-1 bg-gray-100 rounded-2xl p-1 mb-6">
            {["Login", "Register"].map((tab) => (
              <button
                key={tab}
                onClick={() => { setIsRegister(tab === "Register"); setError(""); setPassword(""); setConfirm(""); }}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  (tab === "Register") === isRegister
                    ? "bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-md"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="space-y-4">

            {/* ── REGISTER FIELDS ── */}
            {isRegister && (
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Full Name</label>
                <input
                  type="text" value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="Ravi Kumar"
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-300 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all"
                />
              </div>
            )}

            {/* Phone with fixed +91 */}
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Phone Number</label>
              <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-purple-400 transition-all">
                <span className="px-4 py-3 text-sm font-black text-gray-500 bg-gray-100 border-r border-gray-200 select-none">+91</span>
                <input
                  type="tel" value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  placeholder="9876543210" maxLength={10}
                  className="flex-1 bg-transparent px-4 py-3 text-sm font-medium text-gray-900 placeholder-gray-300 focus:outline-none"
                />
              </div>
            </div>

            {/* ── REGISTER EXTRA FIELDS ── */}
            {isRegister && (
              <>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Vehicle Type</label>
                  <div className="grid grid-cols-4 gap-2">
                    {Object.entries(VEHICLE_ICONS).map(([key, icon]) => (
                      <button
                        key={key} onClick={() => setVehicle(key)}
                        className={`py-3 rounded-xl text-xl transition-all border ${
                          vehicle === key
                            ? "bg-purple-50 border-purple-400 shadow-md shadow-purple-100"
                            : "bg-gray-50 border-gray-200 hover:border-gray-300"
                        }`}
                      >{icon}</button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-1 capitalize">{vehicle} selected</p>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">
                    Vehicle Number <span className="text-red-400 normal-case font-black">*required</span>
                  </label>
                  <input
                    type="text" value={vehicleNum}
                    onChange={(e) => setVehicleNum(e.target.value.toUpperCase())}
                    placeholder="HR 05 AB 1234"
                    className={`w-full bg-gray-50 border text-gray-900 placeholder-gray-300 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all ${
                      !vehicleNum.trim() ? "border-red-200" : "border-gray-200"
                    }`}
                  />
                  {!vehicleNum.trim() && (
                    <p className="text-[10px] text-red-400 font-bold mt-1">Vehicle number is mandatory</p>
                  )}
                </div>
              </>
            )}

            {/* ── PASSWORD ── */}
            <PasswordInput
              label={isRegister ? "Create Password" : "Password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isRegister ? "Min. 6 characters" : "Enter your password"}
              hint={isRegister ? "At least 6 characters required" : undefined}
            />

            {/* ── CONFIRM PASSWORD (register only) ── */}
            {isRegister && (
              <PasswordInput
                label="Confirm Password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Re-enter password"
              />
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-500 text-sm font-medium">
                ⚠️ {error}
              </div>
            )}

            <button
              onClick={handleSubmit} disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-black rounded-xl text-sm shadow-lg shadow-purple-200 hover:shadow-purple-300 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100"
            >
              {loading ? "Please wait…" : isRegister ? "Create Account 🚀" : "Enter Dashboard →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}