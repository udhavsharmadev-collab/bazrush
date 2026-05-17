"use client";

import { useState, useEffect, useCallback } from "react";

function fmt(n) { return Number(n || 0).toLocaleString("en-IN"); }
function fmtRupee(n) { return `₹${fmt(n)}`; }
function timeAgo(dateStr) {
  if (!dateStr) return "—";
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ── Shared UI primitives ──────────────────────────────────────────────────────
export const StatCard = ({ label, value, sub, subColor, icon, gradient }) => (
  <div className="bg-white rounded-2xl p-6 shadow-lg border border-purple-100">
    <div className="flex items-center justify-between mb-3">
      <p className="text-gray-500 text-sm font-medium">{label}</p>
      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center text-lg">
        {icon}
      </div>
    </div>
    <h3 className={`text-3xl font-black ${gradient ? "bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent" : "text-gray-900"}`}>
      {value}
    </h3>
    <p className={`text-xs mt-2 font-semibold ${subColor || "text-gray-400"}`}>{sub}</p>
  </div>
);

export const Card = ({ title, children, action, badge }) => (
  <div className="bg-white rounded-2xl shadow-lg border border-purple-100 overflow-hidden">
    <div className="flex items-center justify-between px-6 py-4 border-b border-purple-50">
      <div className="flex items-center gap-2">
        <h3 className="text-base font-black text-gray-900">{title}</h3>
        {badge !== undefined && (
          <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700">{badge}</span>
        )}
      </div>
      {action}
    </div>
    <div className="p-6">{children}</div>
  </div>
);

export const Avatar = ({ name, size = "sm" }) => {
  const letters = (name || "?").split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
  const palettes = ["from-purple-500 to-fuchsia-500", "from-violet-500 to-purple-600", "from-indigo-500 to-purple-500", "from-fuchsia-500 to-pink-500"];
  const grad = palettes[letters.charCodeAt(0) % palettes.length];
  const sz = size === "lg" ? "w-10 h-10 text-sm" : "w-8 h-8 text-xs";
  return (
    <div className={`${sz} rounded-full bg-gradient-to-br ${grad} flex items-center justify-center font-black text-white flex-shrink-0`}>
      {letters}
    </div>
  );
};

export const StatusBadge = ({ children, type = "purple" }) => {
  const styles = {
    purple: "bg-purple-100 text-purple-700",
    green:  "bg-emerald-100 text-emerald-700",
    amber:  "bg-amber-100 text-amber-700",
    red:    "bg-red-100 text-red-700",
    blue:   "bg-blue-100 text-blue-700",
    gray:   "bg-gray-100 text-gray-500",
  };
  return (
    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide ${styles[type]}`}>
      {children}
    </span>
  );
};

export const Empty = ({ text }) => (
  <div className="text-center py-10 text-gray-300 text-sm font-semibold">{text}</div>
);

export const Spinner = () => (
  <div className="flex flex-col items-center justify-center py-32 gap-4">
    <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
    <p className="text-gray-400 font-semibold">Loading owner panel...</p>
  </div>
);

// ── Overview Tab ──────────────────────────────────────────────────────────────
const STATUS_STYLE = { confirmed: "green", preparing: "amber", out_for_delivery: "blue", delivered: "purple" };
const STATUS_EMOJI = { confirmed: "✅", preparing: "👨‍🍳", out_for_delivery: "🛵", delivered: "🎉" };

function getLast7Days() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return { label: d.toLocaleDateString("en-IN", { weekday: "short" }), dateStr: d.toISOString().split("T")[0] };
  });
}

export default function OverviewTab({ data, onRefresh, refreshing }) {
  const { users, sellers, partners, allOrders } = data;

  const userCount    = Object.keys(users).length;
  const sellerCount  = sellers.length;
  const partnerCount = Object.keys(partners).length;
  const totalShops   = sellers.reduce((s, sel) => s + (sel.shops?.length || 0), 0);

  const activePartners = Object.values(partners).filter(p => p.isOnline).length;

  // Revenue: sum shop subtotals across all orders
  const totalRevenue    = allOrders.reduce((s, o) => s + (o.shops || []).reduce((ss, sh) => ss + (sh.subtotal || 0), 0) + (o.deliveryFee || 0), 0);

  // ✅ Total delivery fees ever collected — never resets
  const totalDeliveryFees = allOrders.reduce((s, o) => s + (o.deliveryFee || 0), 0);

  const totalOrders     = allOrders.length;
  const deliveredOrders = allOrders.filter(o => o.status === "delivered").length;
  const pendingOrders   = totalOrders - deliveredOrders;

  // Last 7 days revenue
  const days7 = getLast7Days();
  const revenueByDay = days7.map(({ label, dateStr }) => ({
    label,
    revenue: allOrders
      .filter(o => o.placedAt?.startsWith(dateStr))
      .reduce((s, o) => s + (o.shops || []).reduce((ss, sh) => ss + (sh.subtotal || 0), 0), 0),
  }));
  const maxDayRev = Math.max(...revenueByDay.map(d => d.revenue), 1);

  // Top sellers by shop count
  const topSellers = [...sellers].sort((a, b) => (b.shops?.length || 0) - (a.shops?.length || 0)).slice(0, 5);

  // Fleet breakdown
  const vehicleMap = {};
  Object.values(partners).forEach(p => { const v = p.vehicleType || "bike"; vehicleMap[v] = (vehicleMap[v] || 0) + 1; });
  const vehicleIcons = { bike: "🏍️", cycle: "🚲", car: "🚗", scooter: "🛵" };

  // Recent orders (last 5)
  const recentOrders = [...allOrders]
    .sort((a, b) => new Date(b.placedAt) - new Date(a.placedAt))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Platform Overview 👑</h2>
          <p className="text-sm text-gray-400 mt-0.5">Everything happening across Classy right now</p>
        </div>
        <button type="button" onClick={onRefresh} disabled={refreshing}
          className="px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-600 rounded-xl font-bold text-sm border border-purple-200 transition-all disabled:opacity-50">
          {refreshing ? "⏳ Loading..." : "🔄 Refresh"}
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Users"       value={fmt(userCount)}    icon="👥" sub="All registered customers"        subColor="text-blue-500"    gradient />
        <StatCard label="Total Shops"       value={fmt(totalShops)}   icon="🏪" sub={`Across ${sellerCount} sellers`} subColor="text-purple-500"  gradient />
        <StatCard label="Delivery Partners" value={fmt(partnerCount)} icon="🛵" sub={`${activePartners} online now`}  subColor="text-emerald-500" gradient />
        <StatCard label="Total Orders"      value={fmt(totalOrders)}  icon="📦" sub={`${pendingOrders} pending`}      subColor="text-amber-500"   gradient />
      </div>

      {/* Revenue hero */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-2xl p-6 shadow-xl shadow-purple-200">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-purple-200 text-sm font-semibold mb-1">Total Platform Revenue</p>
            <h2 className="text-5xl font-black text-white">{fmtRupee(totalRevenue)}</h2>
            <p className="text-purple-200 text-xs mt-2 font-semibold">
              {deliveredOrders} delivered · {pendingOrders} pending
            </p>
          </div>
          {/* ✅ 3 cards: Delivered, Pending, Delivery Fees */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/10 rounded-xl px-4 py-3 text-center">
              <p className="text-2xl font-black text-white">{fmt(deliveredOrders)}</p>
              <p className="text-purple-200 text-[10px] font-bold uppercase tracking-wider mt-0.5">Delivered</p>
            </div>
            <div className="bg-white/10 rounded-xl px-4 py-3 text-center">
              <p className="text-2xl font-black text-white">{fmt(pendingOrders)}</p>
              <p className="text-purple-200 text-[10px] font-bold uppercase tracking-wider mt-0.5">Pending</p>
            </div>
            <div className="bg-white/10 rounded-xl px-4 py-3 text-center">
              <p className="text-2xl font-black text-amber-300">{fmtRupee(totalDeliveryFees)}</p>
              <p className="text-purple-200 text-[10px] font-bold uppercase tracking-wider mt-0.5">Delivery Fees</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Revenue bar chart */}
        <Card title="Revenue — Last 7 Days">
          {revenueByDay.every(d => d.revenue === 0) ? (
            <Empty text="No revenue this week yet" />
          ) : (
            <>
              <div className="flex items-end gap-2 h-40">
                {revenueByDay.map((day, i) => {
                  const heightPct = (day.revenue / maxDayRev) * 100;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                      {day.revenue > 0 && (
                        <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                          ₹{fmt(day.revenue)}
                        </div>
                      )}
                      <div
                        className="w-full bg-gradient-to-t from-purple-600 to-purple-400 rounded-t-lg transition-all duration-500 hover:from-fuchsia-600 hover:to-fuchsia-400 cursor-pointer"
                        style={{ height: `${Math.max(heightPct * 1.6, day.revenue > 0 ? 8 : 2)}px` }}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between text-[11px] text-gray-400 font-semibold mt-3">
                {revenueByDay.map((d, i) => <span key={i}>{d.label}</span>)}
              </div>
            </>
          )}
        </Card>

        {/* Fleet breakdown */}
        <Card title="Fleet Breakdown" badge={partnerCount}>
          {Object.keys(vehicleMap).length === 0 ? <Empty text="No partners yet" /> : (
            <div className="space-y-4">
              {Object.entries(vehicleMap).map(([type, count], i) => {
                const pct = Math.round((count / partnerCount) * 100);
                return (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-purple-600 to-purple-400" />
                        <span className="text-sm font-semibold text-gray-700 capitalize">
                          {vehicleIcons[type] || "🚗"} {type}
                        </span>
                      </div>
                      <span className="font-black text-gray-900 text-sm">{count}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-purple-600 to-fuchsia-500 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
              <div className="pt-3 border-t border-purple-50 flex justify-between text-xs font-semibold">
                <span className="text-gray-400">Online now</span>
                <span className="text-emerald-600 font-black">{activePartners} / {partnerCount}</span>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent orders */}
        <Card title="Recent Orders" badge={totalOrders}>
          {recentOrders.length === 0 ? <Empty text="No orders yet" /> : (
            <div className="space-y-3">
              {recentOrders.map((o, i) => {
                const orderRevenue = (o.shops || []).reduce((s, sh) => s + (sh.subtotal || 0), 0);
                return (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center text-base flex-shrink-0">
                      {STATUS_EMOJI[o.status] || "📦"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-gray-800 truncate">{o.customer?.name || "Customer"}</p>
                      <p className="text-[10px] text-gray-400 font-mono truncate">{o.id}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-black text-purple-700">{fmtRupee(orderRevenue)}</p>
                      <StatusBadge type={STATUS_STYLE[o.status] || "gray"}>
                        {o.status?.replace(/_/g, " ")}
                      </StatusBadge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Top sellers */}
        <Card title="Top Sellers" badge={sellerCount}>
          {topSellers.length === 0 ? <Empty text="No sellers yet" /> : (
            <div className="space-y-3">
              {topSellers.map((s, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center text-white text-[10px] font-black flex-shrink-0">
                    {i + 1}
                  </div>
                  <Avatar name={s.name} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-gray-800 truncate">{s.name}</p>
                    <p className="text-[10px] text-gray-400 truncate">{s.phoneNumber}</p>
                  </div>
                  <StatusBadge type="purple">{s.shops?.length || 0} shops</StatusBadge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}