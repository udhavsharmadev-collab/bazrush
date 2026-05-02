"use client";

import { useState, useEffect, useCallback } from 'react';

function getMonthName(date) {
  return date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}

// Get last N months as { label, year, month }
function getLastMonths(n) {
  const months = [];
  const now = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ label: getMonthName(d), year: d.getFullYear(), month: d.getMonth() });
  }
  return months;
}

// Get last 7 days as { label, dateStr }
function getLast7Days() {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push({
      label: d.toLocaleDateString('en-IN', { weekday: 'short' }),
      dateStr: d.toISOString().split('T')[0],
    });
  }
  return days;
}

const StatCard = ({ label, value, sub, subColor, gradient }) => (
  <div className="bg-white rounded-2xl p-6 shadow-lg border border-purple-100">
    <p className="text-gray-500 text-sm font-medium mb-2">{label}</p>
    <h3 className={`text-3xl font-black ${gradient ? 'bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent' : 'text-gray-900'}`}>
      {value}
    </h3>
    <p className={`text-xs mt-2 font-semibold ${subColor}`}>{sub}</p>
  </div>
);

const DashboardTab = ({ seller }) => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    activeProducts: 0,
    lowStockProducts: 0,
    todayOrders: 0,
    last7Days: [],
    last3Months: [],
    recentOrders: [],
    topProducts: [],
  });

  // ✅ FIX: stable phone string as dependency — not the whole seller object
  // The seller object reference changes on every parent render, causing infinite re-fetches
  const sellerPhone = seller?.phoneNumber;

  const loadDashboard = useCallback(async () => {
    if (!sellerPhone) return;
    setLoading(true);
    try {
      // 1. Get seller's shopIds
      const sellerRes = await fetch(`/api/sellers?phoneNumber=${encodeURIComponent(sellerPhone)}`);
      const sellerData = await sellerRes.json();
      const shops = sellerData?.seller?.shops || [];
      const shopIds = new Set(shops.map(s => s.id));

      // 2. Get all users orders
      const usersRes = await fetch('/api/users');
      const users = await usersRes.json();

      // 3. Get products
      const productsRes = await fetch('/api/products');
      const productsData = await productsRes.json();
      const myProducts = (productsData.products || []).filter(p => p.sellerPhone === sellerPhone);
      const activeProducts = myProducts.length;
      const lowStock = myProducts.filter(p => p.stockStatus !== 'in_stock' || (p.stockQuantity !== undefined && p.stockQuantity <= 3)).length;

      // 4. Collect all matching shop entries from orders
      const matched = [];
      for (const [, userData] of Object.entries(users)) {
        for (const order of (userData.orders || [])) {
          for (const shopEntry of (order.shops || [])) {
            if (shopIds.has(shopEntry.shopId)) {
              matched.push({
                orderId: order.id,
                placedAt: order.placedAt,
                status: order.status,
                shop: shopEntry,
                customer: order.customer,
              });
            }
          }
        }
      }

      // 5. Compute stats
      const totalRevenue = matched.reduce((s, o) => s + (o.shop.subtotal || 0), 0);
      const totalOrders = matched.length;

      const todayStr = new Date().toISOString().split('T')[0];
      const todayOrders = matched.filter(o => o.placedAt?.startsWith(todayStr)).length;

      // Last 7 days revenue
      const days7 = getLast7Days();
      const last7Days = days7.map(({ label, dateStr }) => ({
        label,
        revenue: matched
          .filter(o => o.placedAt?.startsWith(dateStr))
          .reduce((s, o) => s + (o.shop.subtotal || 0), 0),
      }));

      // Last 3 months revenue
      const months3 = getLastMonths(3);
      const last3Months = months3.map(({ label, year, month }) => ({
        label,
        revenue: matched
          .filter(o => {
            const d = new Date(o.placedAt);
            return d.getFullYear() === year && d.getMonth() === month;
          })
          .reduce((s, o) => s + (o.shop.subtotal || 0), 0),
      }));

      // Recent 5 orders
      const recentOrders = [...matched]
        .sort((a, b) => new Date(b.placedAt) - new Date(a.placedAt))
        .slice(0, 5);

      // Top products by qty sold
      const productMap = {};
      for (const o of matched) {
        for (const item of (o.shop.items || [])) {
          if (!productMap[item.name]) productMap[item.name] = { name: item.name, qty: 0, revenue: 0 };
          productMap[item.name].qty += item.quantity;
          productMap[item.name].revenue += item.price * item.quantity;
        }
      }
      const topProducts = Object.values(productMap)
        .sort((a, b) => b.qty - a.qty)
        .slice(0, 5);

      setStats({ totalRevenue, totalOrders, activeProducts, lowStockProducts: lowStock, todayOrders, last7Days, last3Months, recentOrders, topProducts });
    } catch (err) {
      console.error('Dashboard load failed:', err);
    } finally {
      setLoading(false);
    }
  }, [sellerPhone]); // ✅ Only re-runs when phone number actually changes

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]); // ✅ Stable — won't loop

  const maxDayRevenue = Math.max(...stats.last7Days.map(d => d.revenue), 1);
  const monthColors = ['bg-purple-600', 'bg-purple-400', 'bg-purple-200'];

  const STATUS_STYLE = {
    confirmed:        'bg-emerald-100 text-emerald-700',
    preparing:        'bg-amber-100 text-amber-700',
    out_for_delivery: 'bg-blue-100 text-blue-700',
    delivered:        'bg-purple-100 text-purple-700',
  };
  const STATUS_EMOJI = { confirmed: '✅', preparing: '👨‍🍳', out_for_delivery: '🛵', delivered: '🎉' };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-32 gap-4">
      <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
      <p className="text-gray-400 font-semibold">Loading dashboard...</p>
    </div>
  );

  return (
    <div className="space-y-6">

      {/* Greeting */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-gray-900">
            Hey, {seller.name?.split(' ')[0]} 👋
          </h2>
          <p className="text-sm text-gray-400 mt-0.5">Here's what's happening with your shops today</p>
        </div>
        <button
          type="button"
          onClick={loadDashboard}
          className="px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-600 rounded-xl font-bold text-sm border border-purple-200 transition-all"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          label="Total Revenue"
          value={`₹${stats.totalRevenue.toLocaleString('en-IN')}`}
          sub={stats.totalRevenue > 0 ? '↑ From all orders' : 'No revenue yet'}
          subColor="text-emerald-600"
          gradient
        />
        <StatCard
          label="Total Orders"
          value={stats.totalOrders}
          sub={stats.todayOrders > 0 ? `↑ ${stats.todayOrders} orders today` : 'No orders today'}
          subColor="text-blue-600"
        />
        <StatCard
          label="Active Products"
          value={stats.activeProducts}
          sub={stats.lowStockProducts > 0 ? `⚠️ ${stats.lowStockProducts} low/out of stock` : '✅ All stocked up'}
          subColor={stats.lowStockProducts > 0 ? 'text-orange-500' : 'text-emerald-600'}
        />
        <StatCard
          label="Pending Orders"
          value={stats.recentOrders.filter(o => o.status !== 'delivered').length}
          sub={stats.recentOrders.filter(o => o.status === 'out_for_delivery').length > 0
            ? `🛵 ${stats.recentOrders.filter(o => o.status === 'out_for_delivery').length} out for delivery`
            : 'No active deliveries'}
          subColor="text-purple-600"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Bar chart — revenue last 7 days */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-purple-100">
          <h3 className="text-lg font-black text-gray-900 mb-1">Revenue — Last 7 Days</h3>
          <p className="text-xs text-gray-400 mb-6">Daily earnings from your shops</p>
          {stats.last7Days.every(d => d.revenue === 0) ? (
            <div className="flex items-center justify-center h-40 text-gray-300 text-sm font-semibold">No revenue this week yet</div>
          ) : (
            <>
              <div className="flex items-end gap-2 h-40">
                {stats.last7Days.map((day, i) => {
                  const heightPct = maxDayRevenue > 0 ? (day.revenue / maxDayRevenue) * 100 : 0;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                      {day.revenue > 0 && (
                        <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                          ₹{day.revenue}
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
                {stats.last7Days.map((d, i) => <span key={i}>{d.label}</span>)}
              </div>
            </>
          )}
        </div>

        {/* Monthly earnings */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-purple-100">
          <h3 className="text-lg font-black text-gray-900 mb-1">Monthly Earnings</h3>
          <p className="text-xs text-gray-400 mb-6">Revenue breakdown by month</p>
          <div className="space-y-4">
            {stats.last3Months.map((month, i) => {
              const maxMonthRev = Math.max(...stats.last3Months.map(m => m.revenue), 1);
              const pct = (month.revenue / maxMonthRev) * 100;
              return (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${monthColors[i]}`} />
                      <span className="text-sm font-semibold text-gray-700">{month.label}</span>
                    </div>
                    <span className="font-black text-gray-900 text-sm">
                      {month.revenue > 0 ? `₹${month.revenue.toLocaleString('en-IN')}` : '—'}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${i === 0 ? 'bg-gradient-to-r from-purple-600 to-fuchsia-500' : i === 1 ? 'bg-purple-400' : 'bg-purple-200'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Recent orders */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-purple-100">
          <h3 className="text-lg font-black text-gray-900 mb-4">Recent Orders</h3>
          {stats.recentOrders.length === 0 ? (
            <div className="text-center py-10 text-gray-300 text-sm font-semibold">No orders yet</div>
          ) : (
            <div className="space-y-3">
              {stats.recentOrders.map((o, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center text-base flex-shrink-0">
                    {STATUS_EMOJI[o.status] || '📦'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-gray-800 truncate">{o.customer?.name}</p>
                    <p className="text-[10px] text-gray-400 font-mono truncate">{o.orderId}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-black text-purple-700">₹{o.shop.subtotal}</p>
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${STATUS_STYLE[o.status] || 'bg-gray-100 text-gray-600'}`}>
                      {o.status?.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top products */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-purple-100">
          <h3 className="text-lg font-black text-gray-900 mb-4">Top Products</h3>
          {stats.topProducts.length === 0 ? (
            <div className="text-center py-10 text-gray-300 text-sm font-semibold">No sales data yet</div>
          ) : (
            <div className="space-y-3">
              {stats.topProducts.map((p, i) => {
                const maxQty = stats.topProducts[0]?.qty || 1;
                return (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center text-white text-[10px] font-black flex-shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-black text-gray-800 capitalize truncate">{p.name}</span>
                        <span className="text-xs font-black text-purple-600 ml-2 flex-shrink-0">×{p.qty}</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-fuchsia-500 rounded-full transition-all duration-700"
                          style={{ width: `${(p.qty / maxQty) * 100}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-xs font-black text-gray-500 flex-shrink-0">₹{p.revenue}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardTab;