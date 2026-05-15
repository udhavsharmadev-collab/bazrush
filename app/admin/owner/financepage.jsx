"use client";

import { useState, useEffect, useCallback } from "react";

const VEHICLE_ICONS = { bike: "🛵", bicycle: "🚲", car: "🚗", foot: "🚶" };
const fmtRupee = (n) => `₹${(n ?? 0).toLocaleString("en-IN")}`;
const isCod = (method) => {
  if (!method) return false;
  const m = method.toLowerCase();
  return m === "cod" || m === "cash" || m.includes("cash");
};

// ── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({ name }) {
  const letters = (name || "?").split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
  const palettes = [
    "from-purple-500 to-fuchsia-500",
    "from-violet-500 to-purple-600",
    "from-indigo-500 to-purple-500",
    "from-fuchsia-500 to-pink-500",
  ];
  const grad = palettes[letters.charCodeAt(0) % palettes.length];
  return (
    <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${grad} flex items-center justify-center font-black text-white text-sm flex-shrink-0`}>
      {letters}
    </div>
  );
}

// ── Partner Card ──────────────────────────────────────────────────────────────
function PartnerCard({ partner, cashCollected, rank, onConfirmPayment }) {
  const { name, phoneNumber, vehicleType, vehicleNumber, totalDeliveries, totalEarnings, isOnline, settlementPending, settlementAmount } = partner;
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed]   = useState(false);

  const handleConfirm = async () => {
    if (!cashCollected && !settlementPending) return;
    setConfirming(true);
    try {
      // 1. Update partner: set lastSettledAt = now, clear settlementPending
      const res = await fetch("/api/delivery-partners", {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    phoneNumber,
    action: "confirmPayment",   // ✅ hits the dedicated handler
  }),
});
      if (res.ok) {
        setConfirmed(true);
        setTimeout(() => {
          setConfirmed(false);
          onConfirmPayment?.();
        }, 2000);
      }
    } catch {}
    finally { setConfirming(false); }
  };

  return (
    <div className={`bg-white rounded-2xl shadow-lg border transition-all overflow-hidden ${
      settlementPending
        ? "border-orange-300 shadow-orange-100 ring-2 ring-orange-200"
        : "border-purple-100 hover:border-purple-300 hover:shadow-purple-100"
    }`}>
      {/* Pending banner */}
      {settlementPending && (
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-2 flex items-center gap-2">
          <span className="text-white text-xs font-black">⏳ Partner claims payment sent</span>
          {settlementAmount > 0 && (
            <span className="ml-auto text-white text-xs font-black bg-white/20 px-2 py-0.5 rounded-lg">
              {fmtRupee(settlementAmount)}
            </span>
          )}
        </div>
      )}

      {/* Top section */}
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className="relative flex-shrink-0">
            <Avatar name={name} />
            {rank <= 3 && (
              <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center text-white text-[9px] font-black">
                {rank}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-black text-gray-900 text-base leading-tight truncate">{name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{phoneNumber}</p>
              </div>
              <span className={`flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider border ${
                isOnline
                  ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                  : "bg-gray-100 text-gray-400 border-gray-200"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? "bg-emerald-500 animate-pulse" : "bg-gray-300"}`} />
                {isOnline ? "Online" : "Offline"}
              </span>
            </div>

            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm">{VEHICLE_ICONS[vehicleType] || "🛵"}</span>
              <span className="text-xs text-gray-500 font-semibold capitalize">{vehicleType}</span>
              {vehicleNumber && (
                <>
                  <span className="text-gray-200">·</span>
                  <span className="text-xs text-purple-500 font-black bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-100">
                    {vehicleNumber}
                  </span>
                </>
              )}
              <span className="ml-auto text-[10px] text-gray-400 font-semibold">{totalDeliveries || 0} deliveries</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 border-t border-purple-50">
        <div className="px-5 py-4 border-r border-purple-50">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Cash Collected</p>
          <p className="text-xl font-black text-amber-500">{fmtRupee(cashCollected)}</p>
          <p className="text-[10px] text-gray-300 mt-0.5">COD orders</p>
        </div>
        <div className="px-5 py-4">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Earnings</p>
          <p className="text-xl font-black text-emerald-500">{fmtRupee(totalEarnings)}</p>
          <p className="text-[10px] text-gray-300 mt-0.5">Platform paid</p>
        </div>
      </div>

      {/* Confirm Payment button — show if there's cash OR pending flag */}
      {(cashCollected > 0 || settlementPending) && (
        <div className="px-5 pb-5 pt-2">
          <button
            type="button"
            onClick={handleConfirm}
            disabled={confirming || confirmed}
            className={`w-full py-2.5 rounded-xl text-sm font-black transition-all border flex items-center justify-center gap-2 ${
              confirmed
                ? "bg-emerald-50 border-emerald-300 text-emerald-600"
                : settlementPending
                ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border-transparent shadow-md shadow-emerald-200 hover:from-emerald-600 hover:to-emerald-700"
                : "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
            }`}
          >
            {confirming ? "⏳ Confirming..." : confirmed ? "✅ Confirmed! Cash Reset." : "✅ Confirm Payment Received"}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Finance Tab ───────────────────────────────────────────────────────────────
export default function FinanceTab() {
  const [partners, setPartners]         = useState([]);
  const [codByPartner, setCodByPartner] = useState({});
  const [loading, setLoading]           = useState(true);
  const [refreshing, setRefreshing]     = useState(false);
  const [error, setError]               = useState("");
  const [filter, setFilter]             = useState("all");

  const loadData = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    try {
      const [partnerRes, orderRes] = await Promise.all([
        fetch("/api/delivery-partners"),
        fetch("/api/orders?all=true"),
      ]);
      const partnerData = await partnerRes.json();
      const orderData   = await orderRes.json();

      const arr    = Array.isArray(partnerData) ? partnerData : Object.values(partnerData);
      const orders = Array.isArray(orderData)   ? orderData   : [];

      // ── Build COD map — respect lastSettledAt per partner ────────────────
      const partnerMap = {};
      for (const p of arr) partnerMap[p.phoneNumber] = p;

      const codMap = {};
      for (const o of orders) {
        if (o.status !== "delivered" || !isCod(o.paymentMethod) || !o.assignedPartner) continue;
        const p = partnerMap[o.assignedPartner];
        const settledAt = p?.lastSettledAt ? new Date(p.lastSettledAt) : null;
        if (settledAt && o.placedAt && new Date(o.placedAt) <= settledAt) continue;
        codMap[o.assignedPartner] = (codMap[o.assignedPartner] || 0) + (o.totalPrice ?? 0);
      }

      setPartners(arr);
      setCodByPartner(codMap);
      setError("");
    } catch {
      setError("Failed to load finance data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => {
    const id = setInterval(() => loadData(true), 15_000);
    return () => clearInterval(id);
  }, [loadData]);

  const totalCash       = Object.values(codByPartner).reduce((s, v) => s + v, 0);
  const totalEarnings   = partners.reduce((s, p) => s + (p.totalEarnings ?? 0), 0);
  const onlinePartners  = partners.filter(p => p.isOnline).length;
  const pendingCount    = partners.filter(p => p.settlementPending).length;

  const filtered = partners.filter(p => {
    if (filter === "online")  return p.isOnline;
    if (filter === "offline") return !p.isOnline;
    if (filter === "cod")     return (codByPartner[p.phoneNumber] ?? 0) > 0;
    if (filter === "pending") return p.settlementPending;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    // Pending first, then by cash desc
    if (b.settlementPending && !a.settlementPending) return 1;
    if (a.settlementPending && !b.settlementPending) return -1;
    return (codByPartner[b.phoneNumber] ?? 0) - (codByPartner[a.phoneNumber] ?? 0);
  });

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-32 gap-4">
      <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
      <p className="text-gray-400 font-semibold">Loading finance data...</p>
    </div>
  );

  return (
    <div className="space-y-6">

      {/* Heading row */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Finance 💰</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            Delivery partner earnings & COD cash · auto-refreshes every 15s
            {refreshing && <span className="ml-2 text-purple-400 font-black">↻</span>}
          </p>
        </div>
        <button
          type="button"
          onClick={() => loadData(true)}
          disabled={refreshing}
          className="px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-600 rounded-xl font-bold text-sm border border-purple-200 transition-all disabled:opacity-50"
        >
          {refreshing ? "⏳ Loading..." : "🔄 Refresh"}
        </button>
      </div>

      {/* Pending payments alert */}
      {pendingCount > 0 && (
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-2xl px-5 py-4 flex items-center gap-3">
          <span className="text-2xl">⏳</span>
          <div>
            <p className="font-black text-orange-700 text-sm">
              {pendingCount} partner{pendingCount > 1 ? "s" : ""} claim{pendingCount === 1 ? "s" : ""} to have paid
            </p>
            <p className="text-xs text-orange-500 mt-0.5">Review and confirm to clear their cash balance</p>
          </div>
          <button
            type="button"
            onClick={() => setFilter("pending")}
            className="ml-auto px-3 py-1.5 bg-orange-500 text-white text-xs font-black rounded-xl hover:bg-orange-600 transition-all"
          >
            View
          </button>
        </div>
      )}

      {/* Summary stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-purple-100">
          <div className="flex items-center justify-between mb-3">
            <p className="text-gray-500 text-sm font-medium">Total Partners</p>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center text-lg">🛵</div>
          </div>
          <h3 className="text-3xl font-black bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent">
            {partners.length}
          </h3>
          <p className="text-xs mt-2 font-semibold text-emerald-500">
            {onlinePartners} online now
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border border-amber-100">
          <div className="flex items-center justify-between mb-3">
            <p className="text-gray-500 text-sm font-medium">Total COD Cash</p>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center text-lg">💵</div>
          </div>
          <h3 className="text-3xl font-black text-amber-500">{fmtRupee(totalCash)}</h3>
          <p className="text-xs mt-2 font-semibold text-gray-400">Unsettled COD orders</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border border-emerald-100">
          <div className="flex items-center justify-between mb-3">
            <p className="text-gray-500 text-sm font-medium">Total Earnings</p>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center text-lg">📈</div>
          </div>
          <h3 className="text-3xl font-black text-emerald-500">{fmtRupee(totalEarnings)}</h3>
          <p className="text-xs mt-2 font-semibold text-gray-400">Paid out to all partners</p>
        </div>
      </div>

      {/* Revenue progress bar */}
      {totalCash > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-purple-100">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-black text-gray-700">COD vs Earnings ratio</p>
            <span className="text-xs text-gray-400 font-semibold">
              {totalEarnings > 0 ? Math.round((totalCash / (totalCash + totalEarnings)) * 100) : 100}% is cash
            </span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden flex">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-700"
              style={{ width: `${totalCash + totalEarnings > 0 ? (totalCash / (totalCash + totalEarnings)) * 100 : 0}%` }}
            />
            <div
              className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-700"
              style={{ width: `${totalCash + totalEarnings > 0 ? (totalEarnings / (totalCash + totalEarnings)) * 100 : 0}%` }}
            />
          </div>
          <div className="flex gap-4 mt-2">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span className="text-[11px] text-gray-400 font-semibold">COD Cash</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span className="text-[11px] text-gray-400 font-semibold">Platform Earnings</span>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600 font-semibold">
          ⚠️ {error}
        </div>
      )}

      {/* Filter pills */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-gray-400 font-semibold mr-1">Filter:</span>
        {[
          { id: "all",     label: "All Partners" },
          { id: "online",  label: "🟢 Online" },
          { id: "offline", label: "⚫ Offline" },
          { id: "cod",     label: "💵 Has COD Cash" },
          { id: "pending", label: `⏳ Pending${pendingCount > 0 ? ` (${pendingCount})` : ""}` },
        ].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filter === f.id
                ? "bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-md shadow-purple-200"
                : f.id === "pending" && pendingCount > 0
                ? "bg-orange-50 border border-orange-300 text-orange-600 hover:border-orange-400"
                : "bg-white border border-purple-200 text-gray-500 hover:border-purple-400"
            }`}>
            {f.label}
          </button>
        ))}
        <span className="ml-auto text-xs text-gray-400 font-semibold">{sorted.length} partners</span>
      </div>

      {/* Partner cards */}
      {sorted.length === 0 ? (
        <div className="text-center py-16 text-gray-300 font-semibold bg-white rounded-2xl border border-purple-100">
          No partners match this filter
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sorted.map((p, i) => (
            <PartnerCard
              key={p.phoneNumber}
              partner={p}
              cashCollected={codByPartner[p.phoneNumber] ?? 0}
              rank={i + 1}
              onConfirmPayment={() => loadData(true)}
            />
          ))}
        </div>
      )}
    </div>
  );
}