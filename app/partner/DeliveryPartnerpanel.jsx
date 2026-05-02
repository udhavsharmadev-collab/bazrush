"use client";

import { useState } from "react";
import { useDeliveryPartner } from "../context/DeliveryPartnerContext";
import DeliveryDashboard from "./DeliveryDashboard";

const VEHICLE_ICONS = { bike: "🛵", bicycle: "🚲", car: "🚗", foot: "🚶" };

export default function DeliveryPartnerPanel() {
  const { isPartnerAuthenticated, loginPartner } = useDeliveryPartner();
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [vehicle, setVehicle] = useState("bike");
  const [vehicleNum, setVehicleNum] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fullPhone = "+91" + phone;

  const handleSubmit = async () => {
    setError("");
    if (!phone || phone.length < 10) { setError("Enter a valid 10-digit phone number"); return; }
    if (isRegister) {
      if (!name.trim()) { setError("Name is required"); return; }
      if (!vehicleNum.trim()) { setError("Vehicle number is required"); return; }
    }
    setLoading(true);
    try {
      if (isRegister) {
        const res = await fetch("/api/delivery-partners", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phoneNumber: fullPhone, name, vehicleType: vehicle, vehicleNumber: vehicleNum }),
        });
        const data = await res.json();
        if (!res.ok) { setError(data.error || "Registration failed"); setLoading(false); return; }
        loginPartner(data.partner);
      } else {
        const res = await fetch(`/api/delivery-partners?phoneNumber=${encodeURIComponent(fullPhone)}`);
        const data = await res.json();
        if (!res.ok) { setError("Partner not found. Please register first."); setLoading(false); return; }
        loginPartner(data.partner);
      }
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

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
                onClick={() => { setIsRegister(tab === "Register"); setError(""); }}
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

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-500 text-sm font-medium">
                ⚠️ {error}
              </div>
            )}

            <button
              onClick={handleSubmit} disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-black rounded-xl text-sm shadow-lg shadow-purple-200 hover:shadow-purple-300 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100"
            >
              {loading ? "Please wait..." : isRegister ? "Create Account 🚀" : "Enter Dashboard →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}