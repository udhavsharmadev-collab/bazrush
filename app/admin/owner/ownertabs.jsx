"use client";

import { useState, useMemo, useEffect } from "react";
import { Avatar, StatusBadge, Empty } from "./owneroverviewtab";

// ─── helpers ────────────────────────────────────────────────────────────────

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

function fmt(n) { return Number(n || 0).toLocaleString("en-IN"); }

function shopImage(shop) {
  const img = shop.mainPhotoId || shop.mainImageId || shop.image || shop.shopImage || shop.imageId;
  if (!img) return null;
  if (img.startsWith("http")) return img;
  return `/images/${img}`;
}

function initials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

const CATEGORY_COLORS = {
  Food:        { bg: "#FFF7ED", text: "#9A3412", dot: "#F97316", pill: "bg-orange-50 text-orange-700 border-orange-200" },
  Grocery:     { bg: "#F0FDF4", text: "#166534", dot: "#22C55E", pill: "bg-green-50 text-green-700 border-green-200" },
  Pharmacy:    { bg: "#EFF6FF", text: "#1E40AF", dot: "#3B82F6", pill: "bg-blue-50 text-blue-700 border-blue-200" },
  Electronics: { bg: "#FAF5FF", text: "#6B21A8", dot: "#A855F7", pill: "bg-purple-50 text-purple-700 border-purple-200" },
  Fashion:     { bg: "#FFF1F2", text: "#9F1239", dot: "#F43F5E", pill: "bg-rose-50 text-rose-700 border-rose-200" },
  default:     { bg: "#F8FAFC", text: "#475569", dot: "#94A3B8", pill: "bg-slate-50 text-slate-600 border-slate-200" },
};

function catStyle(cat) {
  return CATEGORY_COLORS[cat] || CATEGORY_COLORS.default;
}

function buildShopStats(allOrders = []) {
  const stats = {};
  for (const order of allOrders) {
    for (const shop of order.shops || []) {
      const id = shop.shopId || shop.id || shop.shopName;
      if (!id) continue;
      if (!stats[id]) stats[id] = { revenue: 0, orders: 0, activeOrders: 0 };
      stats[id].revenue += shop.subtotal || 0;
      stats[id].orders += 1;
      const s = (order.status || "").toLowerCase();
      if (!["delivered", "cancelled", "rejected"].includes(s))
        stats[id].activeOrders += 1;
    }
  }
  return stats;
}

// ─── ShopCard ────────────────────────────────────────────────────────────────

function ShopCard({ shop, stats, sellerName, sellerPhone, productCount }) {
  const imgSrc = shopImage(shop);
  const cs = catStyle(shop.category);
  const rev = stats?.revenue ?? 0;
  const orders = stats?.orders ?? 0;
  const activeOrders = stats?.activeOrders ?? 0;
  const products = productCount ?? 0;

  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-purple-100 hover:border-purple-300 hover:shadow-lg hover:shadow-purple-100 transition-all duration-200 flex flex-col">

      {/* Banner */}
      <div className="relative w-full h-36 flex-shrink-0 overflow-hidden"
        style={{ background: imgSrc ? undefined : `linear-gradient(135deg,${cs.dot}22,${cs.dot}55)` }}>
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={shop.shopName}
            className="w-full h-full object-cover block"
            onError={(e) => { e.currentTarget.style.display = "none"; }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl font-black opacity-30"
            style={{ color: cs.dot }}>
            {initials(shop.shopName || shop.name) || "🏪"}
          </div>
        )}

        {/* Category pill */}
        {shop.category && (
          <span className={`absolute top-2.5 left-2.5 text-[11px] font-bold px-3 py-1 rounded-full border flex items-center gap-1.5 ${cs.pill}`}>
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: cs.dot }} />
            {shop.category}
          </span>
        )}

        {/* Active orders badge */}
        {activeOrders > 0 && (
          <span className="absolute top-2.5 right-2.5 text-[11px] font-bold px-3 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
            🔥 {activeOrders} active
          </span>
        )}
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col gap-3 flex-1">

        {/* Name + address */}
        <div>
          <h4 className="font-black text-gray-900 text-base leading-tight truncate">
            {shop.shopName || shop.name || "Unnamed Shop"}
          </h4>
          {(shop.address || shop.location) && (
            <p className="text-xs text-gray-400 mt-1 line-clamp-1 flex items-start gap-1">
              <svg width="11" height="11" viewBox="0 0 16 16" fill="none" className="mt-0.5 flex-shrink-0">
                <path d="M8 1.5A4.5 4.5 0 0 0 3.5 6c0 3.5 4.5 8.5 4.5 8.5S12.5 9.5 12.5 6A4.5 4.5 0 0 0 8 1.5ZM8 8a2 2 0 1 1 0-4 2 2 0 0 1 0 4Z" fill="currentColor"/>
              </svg>
              {shop.address || shop.location}
            </p>
          )}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-purple-50 rounded-xl p-2.5 text-center">
            <p className="text-[10px] text-purple-400 font-semibold mb-0.5">Revenue</p>
            <p className="text-sm font-black text-purple-700">₹{fmt(rev)}</p>
          </div>
          <div className="bg-blue-50 rounded-xl p-2.5 text-center">
            <p className="text-[10px] text-blue-400 font-semibold mb-0.5">Orders</p>
            <p className="text-sm font-black text-blue-700">{orders}</p>
          </div>
          <div className="bg-emerald-50 rounded-xl p-2.5 text-center">
            <p className="text-[10px] text-emerald-400 font-semibold mb-0.5">Products</p>
            <p className="text-sm font-black text-emerald-700">{products}</p>
          </div>
        </div>

        {/* Seller footer */}
        <div className="border-t border-purple-50 pt-3 flex items-center gap-2">
          <Avatar name={sellerName} />
          <div className="min-w-0">
            <p className="text-xs font-black text-gray-700 truncate">{sellerName || "Unknown Seller"}</p>
            <p className="text-[10px] text-gray-400 truncate">{sellerPhone}</p>
          </div>
          {shop.createdAt && (
            <span className="ml-auto text-[10px] text-gray-300 font-semibold flex-shrink-0">
              {timeAgo(shop.createdAt)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// SHOPS TAB
// ════════════════════════════════════════════════════════════════════════════
export function ShopsTab({ data }) {
  const { sellers = [], allOrders = [] } = data;
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [productCounts, setProductCounts] = useState({});

  // fetch products once and build shopId → count map
  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((d) => {
        const counts = {};
        for (const p of d.products || []) {
          const id = p.shopId;
          if (!id) continue;
          counts[id] = (counts[id] || 0) + 1;
        }
        setProductCounts(counts);
      })
      .catch(() => {});
  }, []);

  const allShops = useMemo(() => {
    const list = [];
    for (const seller of sellers) {
      for (const shop of seller.shops || []) {
        list.push({
          shop,
          sellerName: seller.name || seller.sellerName || "",
          sellerPhone: seller.phoneNumber || "",
        });
      }
    }
    return list;
  }, [sellers]);

  const shopStats = useMemo(() => buildShopStats(allOrders), [allOrders]);

  const categories = useMemo(() => {
    const cats = new Set(allShops.map((s) => s.shop.category).filter(Boolean));
    return ["all", ...Array.from(cats).sort()];
  }, [allShops]);

  const filtered = useMemo(() => {
    return allShops.filter(({ shop }) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        (shop.shopName || "").toLowerCase().includes(q) ||
        (shop.category || "").toLowerCase().includes(q) ||
        (shop.address || "").toLowerCase().includes(q);
      const matchCat = catFilter === "all" || shop.category === catFilter;
      return matchSearch && matchCat;
    });
  }, [allShops, search, catFilter]);

  // summary stats
  const totalRevenue = useMemo(() => Object.values(shopStats).reduce((s, v) => s + v.revenue, 0), [shopStats]);
  const totalOrders  = useMemo(() => Object.values(shopStats).reduce((s, v) => s + v.orders, 0), [shopStats]);
  const totalActive  = useMemo(() => Object.values(shopStats).reduce((s, v) => s + v.activeOrders, 0), [shopStats]);

  return (
    <div className="space-y-6">

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Shops",   value: allShops.length, icon: "🏪", cls: "bg-purple-50 text-purple-700" },
          { label: "Total Revenue", value: `₹${fmt(totalRevenue)}`, icon: "💰", cls: "bg-violet-50 text-violet-700" },
          { label: "Total Orders",  value: totalOrders,  icon: "📦", cls: "bg-blue-50 text-blue-700" },
          { label: "Active Orders", value: totalActive,  icon: "🔥", cls: "bg-orange-50 text-orange-700" },
        ].map((s) => (
          <div key={s.label} className={`rounded-2xl p-4 border border-white/60 ${s.cls}`}>
            <p className="text-xs font-semibold opacity-70 mb-1">{s.icon} {s.label}</p>
            <p className="text-2xl font-black">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Search + filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search shops, categories, addresses…"
          className="flex-1 bg-white border border-purple-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all"
        />
        <div className="flex gap-2 flex-wrap">
          {categories.slice(0, 7).map((c) => {
            const cs = catStyle(c === "all" ? "default" : c);
            const active = catFilter === c;
            return (
              <button
                key={c}
                onClick={() => setCatFilter(c)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all capitalize border ${
                  active
                    ? "bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-md shadow-purple-200 border-transparent"
                    : "bg-white border-purple-200 text-gray-500 hover:border-purple-400"
                }`}
              >
                {c}
              </button>
            );
          })}
        </div>
      </div>

      <p className="text-xs text-gray-400 font-semibold">{filtered.length} shops found</p>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-300 font-semibold">No shops match your search</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(({ shop, sellerName, sellerPhone }) => {
            const id = shop.shopId || shop.id || shop.shopName;
            return (
              <ShopCard
                key={id}
                shop={shop}
                sellerName={sellerName}
                sellerPhone={sellerPhone}
                stats={shopStats[id]}
                productCount={productCounts[id] ?? 0}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// DELIVERY PARTNERS TAB
// ════════════════════════════════════════════════════════════════════════════
export function PartnersTab({ data }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const partners = Object.values(data.partners);
  const filtered = partners.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !q || p.name?.toLowerCase().includes(q) || p.phoneNumber?.includes(q);
    const matchStatus = statusFilter === "all"
      || (statusFilter === "online" && p.isOnline)
      || (statusFilter === "offline" && !p.isOnline);
    return matchSearch && matchStatus;
  });

  const vehicleIcons = { bike: "🏍️", cycle: "🚲", car: "🚗", scooter: "🛵" };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or phone…"
          className="flex-1 bg-white border border-purple-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all"
        />
        {["all", "online", "offline"].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all ${
              statusFilter === s
                ? "bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-md shadow-purple-200"
                : "bg-white border border-purple-200 text-gray-500 hover:border-purple-400"
            }`}>
            {s}
          </button>
        ))}
      </div>

      <p className="text-xs text-gray-400 font-semibold">{filtered.length} partners</p>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-300 font-semibold">No partners found</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((p, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 shadow-lg border border-purple-100 hover:border-purple-300 transition-all">
              <div className="flex items-center gap-3 mb-4">
                <Avatar name={p.name} size="lg" />
                <div className="flex-1 min-w-0">
                  <p className="font-black text-gray-900 truncate">{p.name}</p>
                  <p className="text-[10px] text-gray-400">{p.phoneNumber}</p>
                </div>
                <StatusBadge type={p.isOnline ? "green" : "gray"}>
                  {p.isOnline ? "Online" : "Offline"}
                </StatusBadge>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="bg-purple-50 rounded-xl p-3">
                  <p className="text-[10px] text-purple-400 font-semibold mb-1">Vehicle</p>
                  <p className="text-sm font-black text-gray-800 capitalize">
                    {vehicleIcons[p.vehicleType] || "🚗"} {p.vehicleType || "—"}
                  </p>
                </div>
                <div className="bg-purple-50 rounded-xl p-3">
                  <p className="text-[10px] text-purple-400 font-semibold mb-1">Plate</p>
                  <p className="text-sm font-black text-gray-800 truncate">{p.vehicleNumber || "—"}</p>
                </div>
              </div>
              {p.rating !== undefined && (
                <div className="flex items-center gap-1.5 pt-3 border-t border-purple-50">
                  <span className="text-yellow-400 text-sm">★</span>
                  <span className="text-sm font-black text-gray-800">{Number(p.rating).toFixed(1)}</span>
                  <span className="text-xs text-gray-300">/ 5.0</span>
                  {p.totalDeliveries !== undefined && (
                    <span className="ml-auto text-[10px] text-gray-400 font-semibold">
                      {fmt(p.totalDeliveries)} deliveries
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// SELLERS TAB
// ════════════════════════════════════════════════════════════════════════════
export function SellersTab({ data }) {
  const [search, setSearch] = useState("");
  const sellers = data.sellers.filter(s => {
    const q = search.toLowerCase();
    return !q || s.name?.toLowerCase().includes(q) || s.phoneNumber?.includes(q) || s.email?.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-5">
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search sellers by name, phone or email…"
        className="w-full bg-white border border-purple-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all"
      />
      <p className="text-xs text-gray-400 font-semibold">{sellers.length} sellers registered</p>
      {sellers.length === 0 ? (
        <div className="text-center py-16 text-gray-300 font-semibold">No sellers found</div>
      ) : (
        <div className="space-y-3">
          {sellers.map((s, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 shadow-lg border border-purple-100 hover:border-purple-300 transition-all">
              <div className="flex items-center gap-4 mb-3">
                <Avatar name={s.name} size="lg" />
                <div className="flex-1 min-w-0">
                  <p className="font-black text-gray-900 text-base">{s.name}</p>
                  <p className="text-xs text-gray-400">{s.email || s.phoneNumber}</p>
                </div>
                <StatusBadge type="purple">{s.shops?.length || 0} shops</StatusBadge>
              </div>
              {s.shops?.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-3 border-t border-purple-50">
                  {s.shops.map((sh, j) => (
                    <span key={j} className="text-xs px-3 py-1 rounded-full bg-purple-50 border border-purple-100 text-purple-600 font-semibold">
                      {sh.shopName || sh.name || "Shop"}
                      {sh.category ? ` · ${sh.category}` : ""}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}