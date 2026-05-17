"use client";

import { useState, useEffect, useRef, Fragment } from 'react';

const STATUS_CONFIG = {
  confirmed:        { label: 'Confirmed',       emoji: '✅', bg: 'bg-emerald-100', text: 'text-emerald-700' },
  preparing:        { label: 'Preparing',        emoji: '👨‍🍳', bg: 'bg-amber-100',  text: 'text-amber-700'  },
  out_for_delivery: { label: 'Out for Delivery', emoji: '🛵', bg: 'bg-blue-100',   text: 'text-blue-700'   },
  delivered:        { label: 'Delivered',        emoji: '🎉', bg: 'bg-purple-100', text: 'text-purple-700' },
};

const PAYMENT_LABELS = {
  cod:  '💵 COD',
  upi:  '📲 UPI',
  card: '💳 Card',
};

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// Safely extract the canonical shop ID from a seller's shop object.
// The sellers API returns shops with an "id" field; the orders API returns
// shop entries that may have "shopId" OR "id".  This helper normalises both.
function getShopId(shop) {
  return shop?.shopId || shop?.id || '';
}

const OrdersTab = ({ seller }) => {
  const [shopOrders, setShopOrders]       = useState([]);
  const [loading, setLoading]             = useState(true);
  const [shops, setShops]                 = useState([]);
  const [selectedShopId, setSelectedShopId] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [updatingId, setUpdatingId]       = useState(null);
  const [newOrderIds, setNewOrderIds]     = useState(new Set());

  const lastRefreshedElRef = useRef(null);
  const shopsRef           = useRef([]);
  const prevOrderIdsRef    = useRef(new Set());
  const isFetchingRef      = useRef(false);

  // ── Fetch orders for all seller shops via /api/orders?shopId=id1,id2 ───────
  const fetchOrders = async (shopIds) => {
    if (isFetchingRef.current || shopIds.size === 0) return;
    isFetchingRef.current = true;
    try {
      const ids = [...shopIds].join(',');
      const res = await fetch(`/api/orders?shopId=${encodeURIComponent(ids)}`);
      const results = await res.json();

      if (!Array.isArray(results)) {
        console.warn('Unexpected orders response:', results);
        return;
      }

      const newIds  = new Set(results.map(o => o.orderId));
      const brandNew = results
        .filter(o => prevOrderIdsRef.current.size > 0 && !prevOrderIdsRef.current.has(o.orderId))
        .map(o => o.orderId);

      prevOrderIdsRef.current = newIds;

      setShopOrders(prev => {
        const prevSig = prev.map(o => `${o.orderId}:${o.status}`).join('|');
        const nextSig = results.map(o => `${o.orderId}:${o.status}`).join('|');
        if (prevSig === nextSig) return prev;
        return results;
      });

      if (brandNew.length > 0) {
        setNewOrderIds(curr => {
          const updated = new Set([...curr, ...brandNew]);
          setTimeout(() => {
            setNewOrderIds(c => {
              const cleaned = new Set(c);
              brandNew.forEach(id => cleaned.delete(id));
              return cleaned;
            });
          }, 4000);
          return updated;
        });
      }

      // Update timestamp via DOM ref — zero re-renders
      const now = new Date();
      if (lastRefreshedElRef.current) {
        lastRefreshedElRef.current.textContent =
          `· ${now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
      }
    } catch (err) {
      console.error('Failed to refresh orders:', err);
    } finally {
      isFetchingRef.current = false;
    }
  };

  useEffect(() => {
    if (!seller?.phoneNumber) return;

    const init = async () => {
      setLoading(true);
      try {
        const sellerRes  = await fetch(`/api/sellers?phoneNumber=${encodeURIComponent(seller.phoneNumber)}`);
        const sellerData = await sellerRes.json();

        // The sellers API wraps the result: { seller: { shops: [...] } }
        // Each shop has an "id" field (not "shopId")
        const sellerShops = sellerData?.seller?.shops || [];
        shopsRef.current  = sellerShops;
        setShops(sellerShops);

        // Use getShopId() so we handle both "id" and "shopId" transparently
        const shopIds = new Set(sellerShops.map(s => getShopId(s)).filter(Boolean));
        await fetchOrders(shopIds);
      } finally {
        setLoading(false);
      }
    };

    init();

    // Poll every 5 seconds for new orders
    const interval = setInterval(() => {
      const shopIds = new Set(shopsRef.current.map(s => getShopId(s)).filter(Boolean));
      fetchOrders(shopIds);
    }, 5000);

    return () => clearInterval(interval);
  }, [seller]);

  // ── Update order status via PATCH /api/orders ────────────────────────────
  const handleStatusChange = async (customerPhone, orderId, newStatus) => {
    setUpdatingId(orderId);
    try {
      const res = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerPhone, orderId, status: newStatus }),
      });

      if (!res.ok) {
        const err = await res.json();
        console.error('Status update failed:', err);
        return;
      }

      // Optimistic update in UI
      setShopOrders(prev =>
        prev.map(o => o.orderId === orderId ? { ...o, status: newStatus } : o)
      );
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = shopOrders.filter(o => {
    // o.shop.shopId is normalised by the API fix — always present
 const shopMatch = selectedShopId === 'all' || getShopId(o.shop) === selectedShopId;
    const statusMatch = selectedStatus === 'all' || o.status === selectedStatus;
    return shopMatch && statusMatch;
  });

  const totalRevenue = filtered.reduce((s, o) => s + (o.shop?.subtotal || 0), 0);
  const totalItems   = filtered.reduce((s, o) => s + (o.shop?.items || []).reduce((a, i) => a + i.quantity, 0), 0);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-32 gap-4">
      <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
      <p className="text-gray-400 font-semibold">Loading orders...</p>
    </div>
  );

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent">
          Shop Orders
        </h2>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-emerald-600">Live</span>
            <span ref={lastRefreshedElRef} className="text-[10px] text-emerald-400 hidden sm:inline" />
          </div>
          <button
            onClick={() => fetchOrders(new Set(shopsRef.current.map(s => getShopId(s)).filter(Boolean)))}
            className="px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-600 rounded-xl font-bold text-sm border border-purple-200 transition-all"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Orders', value: filtered.length,    color: 'from-purple-600 to-purple-700', sub: 'matched orders' },
          { label: 'Revenue',      value: `₹${totalRevenue}`, color: 'from-emerald-500 to-teal-600',  sub: 'from filtered orders' },
          { label: 'Items Sold',   value: totalItems,          color: 'from-blue-500 to-blue-600',     sub: 'total quantity' },
          { label: 'Shops',        value: shops.length,        color: 'from-fuchsia-500 to-purple-600',sub: 'your shops' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl p-5 shadow-lg border border-purple-100">
            <p className="text-gray-500 text-xs font-medium mb-1">{stat.label}</p>
            <h3 className={`text-2xl font-black bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>{stat.value}</h3>
            <p className="text-[11px] text-gray-400 mt-1">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-lg border border-purple-100 flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2">
          <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Shop</span>
          <div className="flex gap-1.5 flex-wrap">
            <button
              onClick={() => setSelectedShopId('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${selectedShopId === 'all' ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-md' : 'bg-purple-50 text-purple-600 hover:bg-purple-100 border border-purple-200'}`}
            >
              All
            </button>
            {shops.map(shop => {
              const sid = getShopId(shop);
              return (
                <button
                  key={sid}
                  onClick={() => setSelectedShopId(sid)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all capitalize ${selectedShopId === sid ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-md' : 'bg-purple-50 text-purple-600 hover:bg-purple-100 border border-purple-200'}`}
                >
                  {shop.shopName}
                </button>
              );
            })}
          </div>
        </div>

        <div className="w-px h-6 bg-gray-200 hidden md:block" />

        <div className="flex items-center gap-2">
          <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Status</span>
          <div className="flex gap-1.5 flex-wrap">
            <button
              onClick={() => setSelectedStatus('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${selectedStatus === 'all' ? 'bg-gray-800 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              All
            </button>
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
              <button
                key={key}
                onClick={() => setSelectedStatus(key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${selectedStatus === key ? `${cfg.bg} ${cfg.text} shadow-md` : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {cfg.emoji} {cfg.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Orders table */}
      {filtered.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-2xl shadow-lg border border-purple-100">
          <div className="text-5xl mb-4">📦</div>
          <h3 className="text-xl font-black text-gray-700 mb-2">No orders found</h3>
          <p className="text-gray-400 text-sm">Orders placed from your shops will appear here</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-lg border border-purple-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-purple-600 to-purple-700 text-white">
              <tr>
                <th className="px-5 py-4 text-left text-sm font-bold">Order</th>
                <th className="px-5 py-4 text-left text-sm font-bold">Customer</th>
                <th className="px-5 py-4 text-left text-sm font-bold hidden md:table-cell">Shop</th>
                <th className="px-5 py-4 text-left text-sm font-bold hidden lg:table-cell">Items</th>
                <th className="px-5 py-4 text-left text-sm font-bold">Amount</th>
                <th className="px-5 py-4 text-left text-sm font-bold">Status</th>
                <th className="px-5 py-4 text-left text-sm font-bold hidden md:table-cell">Payment</th>
                <th className="px-5 py-4 text-left text-sm font-bold">Update</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o, i) => {
                const statusCfg    = STATUS_CONFIG[o.status] || STATUS_CONFIG.confirmed;
                const isExpanded   = expandedOrderId === o.orderId;
                const isNew        = newOrderIds.has(o.orderId);
                const shopName     = o.shop?.shopName || o.shop?.name || '—';
                const shopPhoto    = o.shop?.shopPhoto || o.shop?.photo || '';

                return (
                  <Fragment key={`${o.orderId}-${o.shop?.shopId}`}>
                    <tr
                      className={`border-t border-gray-100 hover:bg-purple-50 transition-colors cursor-pointer
                        ${isNew ? 'bg-emerald-50' : i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}
                      `}
                      onClick={() => setExpandedOrderId(isExpanded ? null : o.orderId)}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          {isNew && (
                            <span className="text-[9px] font-black text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded-full border border-emerald-200">
                              NEW
                            </span>
                          )}
                          <p className="font-black text-gray-900 text-xs font-mono">{o.orderId}</p>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-0.5">{formatDate(o.placedAt)}</p>
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-bold text-gray-800 text-sm">{o.customer?.name}</p>
                        <p className="text-[10px] text-gray-400">{o.customer?.phone}</p>
                      </td>

                      <td className="px-5 py-4 hidden md:table-cell">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg overflow-hidden bg-purple-50 border border-purple-100 flex-shrink-0">
                            {shopPhoto && (
                              <img
                                src={shopPhoto}
                                alt=""
                                className="w-full h-full object-cover"
                                onError={(e) => { e.target.style.opacity = '0'; }}
                              />
                            )}
                          </div>
                          <span className="text-sm font-bold text-gray-700 capitalize">{shopName}</span>
                        </div>
                      </td>

                      <td className="px-5 py-4 hidden lg:table-cell">
                        <div className="flex -space-x-1.5">
                          {(o.shop?.items || []).slice(0, 3).map((item, j) => (
                            <div key={j} className="w-7 h-7 rounded-lg border-2 border-white bg-purple-50 overflow-hidden">
                              <img
                                
src={item.imageId}
                                alt=""
                                className="w-full h-full object-contain p-0.5"
                                onError={(e) => { e.target.style.opacity = '0'; }}
                              />
                            </div>
                          ))}
                        </div>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          {(o.shop?.items || []).reduce((s, i) => s + i.quantity, 0)} items
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-black text-purple-700">₹{o.shop?.subtotal}</p>
                        <p className="text-[10px] text-gray-400">{PAYMENT_LABELS[o.paymentMethod]}</p>
                      </td>

                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${statusCfg.bg} ${statusCfg.text}`}>
                          {statusCfg.emoji} {statusCfg.label}
                        </span>
                      </td>

                      <td className="px-5 py-4 hidden md:table-cell text-sm text-gray-500 font-medium">
                        {PAYMENT_LABELS[o.paymentMethod]}
                      </td>

                      <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={o.status}
                          disabled={updatingId === o.orderId}
                          onChange={(e) => handleStatusChange(o.customerPhone, o.orderId, e.target.value)}
                          className="text-xs font-bold border border-purple-200 rounded-xl px-2 py-1.5 bg-purple-50 text-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-400 cursor-pointer disabled:opacity-50"
                        >
                          <option value="confirmed">✅ Confirmed</option>
                          <option value="preparing">👨‍🍳 Preparing</option>
                          <option value="out_for_delivery">🛵 Out for Delivery</option>
                          <option value="delivered">🎉 Delivered</option>
                        </select>
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr key={`${o.orderId}-expanded`} className="bg-purple-50/60 border-t border-purple-100">
                        <td colSpan={8} className="px-6 py-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Items</p>
                              <div className="space-y-2">
                                {(o.shop?.items || []).map((item, j) => (
                                  <div key={j} className="flex items-center gap-3 bg-white rounded-xl px-3 py-2 border border-purple-100">
                                    <div className="w-9 h-9 rounded-lg overflow-hidden bg-purple-50 border border-purple-100 flex-shrink-0">
                                      <img
                                        
src={item.imageId}
                                        alt=""
                                        className="w-full h-full object-contain p-0.5"
                                        onError={(e) => { e.target.style.opacity = '0'; }}
                                      />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-black text-gray-800 capitalize truncate">{item.name}</p>
                                      <div className="flex gap-1.5 mt-0.5">
                                        {item.selectedColor && item.selectedColor !== 'default' && (
                                          <span className="text-[9px] font-bold text-violet-500 bg-violet-50 px-1.5 py-0.5 rounded-full border border-violet-100 capitalize">{item.selectedColor}</span>
                                        )}
                                        {item.selectedSize && item.selectedSize !== 'default' && (
                                          <span className="text-[9px] font-bold text-fuchsia-500 bg-fuchsia-50 px-1.5 py-0.5 rounded-full border border-fuchsia-100">{item.selectedSize}</span>
                                        )}
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-sm font-black text-purple-700">₹{item.price * item.quantity}</p>
                                      <p className="text-[10px] text-gray-400">×{item.quantity}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="space-y-3">
                              <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Delivery Address</p>
                                <p className="text-sm font-semibold text-gray-700 bg-white rounded-xl px-3 py-2 border border-purple-100">
                                  {o.customer?.address}
                                </p>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Phone</p>
                                  <p className="text-sm font-bold text-gray-700 bg-white rounded-xl px-3 py-2 border border-purple-100">
                                    {o.customer?.phone}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Subtotal</p>
                                  <p className="text-sm font-black text-purple-700 bg-white rounded-xl px-3 py-2 border border-purple-100">
                                    ₹{o.shop?.subtotal}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default OrdersTab;