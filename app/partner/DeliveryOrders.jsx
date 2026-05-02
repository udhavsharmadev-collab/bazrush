"use client";

import { useState, useEffect, useRef } from "react";
import { OrderCard, DeliveredCard } from "./Orderscard";

export default function DeliveryOrders({ partner, onPartnerUpdate }) {
  const [orders, setOrders]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [tab, setTab]             = useState("available");
  const [toast, setToast]         = useState("");
  const [lastCount, setLastCount] = useState(0);
  const [pulse, setPulse]         = useState(false);
  const pollRef                   = useRef(null);

  const ordersRef = useRef([]);
  const syncOrders = (updated) => {
    ordersRef.current = updated;
    setOrders(updated);
  };

  // FIX 1 — Key by partner phone so different partners don't share rejected set
  const REJECTED_KEY = `rejected_orders_${partner.phoneNumber}`;

  const [rejected, setRejected] = useState(() => {
    try {
      const stored = sessionStorage.getItem(`rejected_orders_${partner.phoneNumber}`);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch { return new Set(); }
  });

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3500); };

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders?all=true");
      return await res.json();
    } catch { return null; }
  };

  // ── Initial load ───────────────────────────────────────────────────────────
  useEffect(() => {
    fetchOrders().then((all) => {
      if (Array.isArray(all)) {
        syncOrders(all);
        setLastCount(
          all.filter(o =>
            !o.assignedPartner && (o.status === "confirmed" || o.status === "preparing")
          ).length
        );
      }
      setLoading(false);
    });
  }, []);

  // ── 5s polling — smart merge with FIX 2: don't revert optimistic accepts ──
  useEffect(() => {
    pollRef.current = setInterval(async () => {
      const remote = await fetchOrders();
      if (!Array.isArray(remote)) return;

      const current = ordersRef.current;
      const prevMap = new Map(current.map(o => [o.id, o]));

      let changed = false;
      const merged = remote.map(fo => {
        const existing = prevMap.get(fo.id);
        if (!existing) {
          // Brand new order not seen before
          changed = true;
          return fo;
        }

        // FIX 2 — If we locally assigned this order but server hasn't saved yet,
        // keep our optimistic local state instead of reverting to "available"
        const weJustAssigned =
          existing.assignedPartner === partner.phoneNumber &&
          fo.assignedPartner !== partner.phoneNumber;
        if (weJustAssigned) return existing;

        // Swap in fresh data if any meaningful field changed
        if (
          existing.status              !== fo.status              ||
          existing.assignedPartner     !== fo.assignedPartner     ||
          existing.assignedPartnerName !== fo.assignedPartnerName ||
          existing.deliveryOtp         !== fo.deliveryOtp         ||
          existing.deliveredAt         !== fo.deliveredAt         ||
          existing.partnerEarning      !== fo.partnerEarning
        ) {
          changed = true;
          return fo;
        }
        return existing; // same reference = no re-render for this card
      });

      // Edge case: an order was removed remotely
      if (!changed && merged.length !== current.length) changed = true;

      const availCount = remote.filter(o =>
        !o.assignedPartner && (o.status === "confirmed" || o.status === "preparing")
      ).length;

      if (availCount > lastCount) {
        setPulse(true);
        setTimeout(() => setPulse(false), 2000);
        showToast(`🔔 ${availCount - lastCount} new order${availCount - lastCount > 1 ? "s" : ""} arrived!`);
      }
      setLastCount(availCount);

      if (changed) syncOrders(merged);
    }, 5000);

    return () => clearInterval(pollRef.current);
  }, [lastCount]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const patchOrder = (customerPhone, orderId, patch) =>
    fetch("/api/orders", {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ customerPhone, orderId, ...patch }),
    });

  // ── Handlers — update local state immediately, PATCH in background ─────────
  const handleAccept = async (order) => {
    const updated = ordersRef.current.map(o =>
      o.id === order.id
        ? { ...o, assignedPartner: partner.phoneNumber, assignedPartnerName: partner.name }
        : o
    );
    syncOrders(updated);
    setTab("active");
    showToast("✅ Accepted! Head to shop 🏪");
    await patchOrder(order.customerPhone, order.id, {
      assignedPartner:     partner.phoneNumber,
      assignedPartnerName: partner.name,
      assignedAt:          new Date().toISOString(),
    });
  };

  // FIX 1 — Use partner-keyed storage key
  const handleReject = (order) => {
    setRejected(prev => {
      const updated = new Set([...prev, order.id]);
      try { sessionStorage.setItem(REJECTED_KEY, JSON.stringify([...updated])); } catch {}
      return updated;
    });
    showToast("❌ Order rejected");
  };

  const handleOutForDelivery = async (order, otp) => {
    const updated = ordersRef.current.map(o =>
      o.id === order.id ? { ...o, status: "out_for_delivery", deliveryOtp: otp } : o
    );
    syncOrders(updated);
    showToast("🛵 On the way! OTP sent to customer.");
    await patchOrder(order.customerPhone, order.id, {
      status:      "out_for_delivery",
      pickedUpAt:  new Date().toISOString(),
      deliveryOtp: otp,
    });
  };

  const handleDeliver = async (order, distKm) => {
    const km      = distKm ?? 0;
    const earning = Math.max(20, 20 + Math.round(5 * km));

    const updated = ordersRef.current.map(o =>
      o.id === order.id
        ? { ...o, status: "delivered", deliveryDistanceKm: km, partnerEarning: earning }
        : o
    );
    syncOrders(updated);
    setTab("delivered");
    showToast(`🎉 Delivered! +₹${earning} earned`);

    await patchOrder(order.customerPhone, order.id, {
      status:             "delivered",
      deliveredAt:        new Date().toISOString(),
      deliveryDistanceKm: km,
      partnerEarning:     earning,
    });

    const updRes  = await fetch("/api/delivery-partners", {
      method:  "PUT",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        phoneNumber:     partner.phoneNumber,
        totalDeliveries: (partner.totalDeliveries || 0) + 1,
        totalEarnings:   (partner.totalEarnings   || 0) + earning,
      }),
    });
    const updData = await updRes.json();
    if (updData.partner) onPartnerUpdate(updData.partner);
  };

  // ── Derived lists ──────────────────────────────────────────────────────────
  const available = orders.filter(o =>
    !o.assignedPartner && !rejected.has(o.id) &&
    (o.status === "confirmed" || o.status === "preparing")
  );
  const myActive = orders.filter(o =>
    o.assignedPartner === partner.phoneNumber && o.status !== "delivered"
  );
  const delivered = orders.filter(o =>
    o.assignedPartner === partner.phoneNumber && o.status === "delivered"
  );

  const tabs = [
    { key: "available", label: "Available", count: available.length, icon: "📋" },
    { key: "active",    label: "Active",    count: myActive.length,  icon: "🛵" },
    { key: "delivered", label: "Delivered", count: delivered.length, icon: "✅" },
  ];

  const shown = tab === "available" ? available : tab === "active" ? myActive : delivered;

  return (
    <div className="space-y-4">

      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white px-5 py-3 rounded-2xl font-bold text-sm shadow-2xl">
          {toast}
        </div>
      )}

      <div className="flex gap-2 items-center">
        <div className="flex-1 flex gap-1 bg-gray-100 rounded-2xl p-1">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 py-2.5 rounded-xl text-[11px] font-black transition-all flex items-center justify-center gap-1 ${
                tab === t.key
                  ? "bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-md"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              {t.icon} {t.label}
              {t.count > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black ${
                  tab === t.key ? "bg-white/25" : "bg-purple-100 text-purple-600"
                } ${t.key === "available" && pulse ? "animate-bounce bg-red-100 text-red-600" : ""}`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black border transition-all ${
          pulse ? "bg-red-50 border-red-200 text-red-500" : "bg-emerald-50 border-emerald-200 text-emerald-600"
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${pulse ? "bg-red-500 animate-ping" : "bg-emerald-500 animate-pulse"}`} />
          {pulse ? "New!" : "Live"}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-10 h-10 border-4 border-purple-100 border-t-purple-600 rounded-full animate-spin" />
          <p className="text-gray-400 text-sm font-semibold">Loading orders...</p>
        </div>
      ) : shown.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="text-5xl mb-3">{tab === "available" ? "📭" : tab === "active" ? "🛵" : "📦"}</div>
          <p className="font-black text-gray-700 text-lg">
            {tab === "available" ? "No new orders" : tab === "active" ? "No active orders" : "No deliveries yet"}
          </p>
          <p className="text-gray-400 text-sm mt-1">
            {tab === "available" ? "Checking every 5 seconds..." : tab === "active" ? "Accept an order to start" : "Completed deliveries show here"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {tab === "delivered"
            ? shown.map(o => <DeliveredCard key={o.id} order={o} />)
            : shown.map(o => (
              <OrderCard
                key={o.id}
                order={o}
                partner={partner}
                onAccept={handleAccept}
                onOutForDelivery={handleOutForDelivery}
                onDeliver={handleDeliver}
                onReject={handleReject}
              />
            ))
          }
        </div>
      )}
    </div>
  );
}