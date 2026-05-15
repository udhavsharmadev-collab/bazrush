"use client";

import { useState, useMemo } from "react";

// ─── helpers ────────────────────────────────────────────────────────────────

function shopImage(img) {
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
  Food:        { bg: "#FFF7ED", text: "#9A3412", dot: "#F97316" },
  Grocery:     { bg: "#F0FDF4", text: "#166534", dot: "#22C55E" },
  Pharmacy:    { bg: "#EFF6FF", text: "#1E40AF", dot: "#3B82F6" },
  Electronics: { bg: "#FAF5FF", text: "#6B21A8", dot: "#A855F7" },
  Fashion:     { bg: "#FFF1F2", text: "#9F1239", dot: "#F43F5E" },
  default:     { bg: "#F8FAFC", text: "#475569", dot: "#94A3B8" },
};

function catStyle(cat) {
  return CATEGORY_COLORS[cat] || CATEGORY_COLORS.default;
}

// ─── per-shop stats from allOrders ──────────────────────────────────────────

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

function ShopCard({ shop, stats, sellerName }) {
  const imgSrc = shopImage(shop.image || shop.shopImage);
  const cs = catStyle(shop.category);
  const rev = stats?.revenue ?? 0;
  const orders = stats?.orders ?? 0;
  const activeOrders = stats?.activeOrders ?? 0;
  const products = Array.isArray(shop.products) ? shop.products.length : (shop.productCount ?? 0);

  return (
    <div
      style={{
        background: "var(--color-background-primary)",
        border: "0.5px solid var(--color-border-tertiary)",
        borderRadius: "16px",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        transition: "box-shadow 0.18s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 4px 24px rgba(0,0,0,0.08)")}
      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
    >
      {/* Banner / Image */}
      <div
        style={{
          width: "100%",
          height: "140px",
          background: imgSrc ? "transparent" : `linear-gradient(135deg,${cs.dot}22,${cs.dot}44)`,
          position: "relative",
          flexShrink: 0,
          overflow: "hidden",
        }}
      >
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={shop.shopName}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            onError={(e) => { e.currentTarget.style.display = "none"; }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "42px",
              fontWeight: 700,
              color: cs.dot,
              opacity: 0.5,
            }}
          >
            {initials(shop.shopName)}
          </div>
        )}

        {/* Category pill */}
        <span
          style={{
            position: "absolute",
            top: "10px",
            left: "10px",
            background: cs.bg,
            color: cs.text,
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: "0.04em",
            padding: "3px 10px",
            borderRadius: "999px",
            border: `1px solid ${cs.dot}33`,
            display: "flex",
            alignItems: "center",
            gap: "5px",
          }}
        >
          <span
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: cs.dot,
              flexShrink: 0,
            }}
          />
          {shop.category || "Shop"}
        </span>

        {/* Active orders badge */}
        {activeOrders > 0 && (
          <span
            style={{
              position: "absolute",
              top: "10px",
              right: "10px",
              background: "#FFF7ED",
              color: "#9A3412",
              fontSize: "11px",
              fontWeight: 700,
              padding: "3px 10px",
              borderRadius: "999px",
              border: "1px solid #F9731633",
            }}
          >
            {activeOrders} active
          </span>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: "16px", flex: 1, display: "flex", flexDirection: "column", gap: "12px" }}>

        {/* Name + seller */}
        <div>
          <p
            style={{
              margin: 0,
              fontSize: "16px",
              fontWeight: 600,
              color: "var(--color-text-primary)",
              lineHeight: 1.25,
            }}
          >
            {shop.shopName || shop.name || "Unnamed Shop"}
          </p>
          {sellerName && (
            <p style={{ margin: "3px 0 0", fontSize: "12px", color: "var(--color-text-secondary)" }}>
              by {sellerName}
            </p>
          )}
          {(shop.address || shop.location) && (
            <p
              style={{
                margin: "4px 0 0",
                fontSize: "12px",
                color: "var(--color-text-secondary)",
                display: "flex",
                alignItems: "flex-start",
                gap: "4px",
              }}
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" style={{ marginTop: "1px", flexShrink: 0 }}>
                <path d="M8 1.5A4.5 4.5 0 0 0 3.5 6c0 3.5 4.5 8.5 4.5 8.5S12.5 9.5 12.5 6A4.5 4.5 0 0 0 8 1.5ZM8 8a2 2 0 1 1 0-4 2 2 0 0 1 0 4Z" fill="currentColor"/>
              </svg>
              {shop.address || shop.location}
            </p>
          )}
        </div>

        {/* Stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "8px" }}>
          <StatPill icon="💰" label="Revenue" value={`₹${rev >= 1000 ? (rev / 1000).toFixed(1) + "k" : rev.toFixed(0)}`} accent="#6D28D9" />
          <StatPill icon="📦" label="Orders" value={orders} accent="#0284C7" />
          <StatPill icon="🛍️" label="Products" value={products} accent="#059669" />
        </div>
      </div>
    </div>
  );
}

function StatPill({ icon, label, value, accent }) {
  return (
    <div
      style={{
        background: "var(--color-background-secondary)",
        borderRadius: "10px",
        padding: "8px 10px",
        display: "flex",
        flexDirection: "column",
        gap: "2px",
        border: "0.5px solid var(--color-border-tertiary)",
      }}
    >
      <span style={{ fontSize: "11px", color: "var(--color-text-secondary)", fontWeight: 500 }}>
        {label}
      </span>
      <span style={{ fontSize: "15px", fontWeight: 700, color: accent }}>
        {value}
      </span>
    </div>
  );
}

// ─── ShopsTab ─────────────────────────────────────────────────────────────────

export function ShopsTab({ data }) {
  const { sellers = [], allOrders = [] } = data;
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("All");

  // flatten all shops with their seller name
  const allShops = useMemo(() => {
    const list = [];
    for (const seller of sellers) {
      for (const shop of seller.shops || []) {
        list.push({ shop, sellerName: seller.name || seller.sellerName || "" });
      }
    }
    return list;
  }, [sellers]);

  const shopStats = useMemo(() => buildShopStats(allOrders), [allOrders]);

  // unique categories
  const categories = useMemo(() => {
    const cats = new Set(allShops.map((s) => s.shop.category).filter(Boolean));
    return ["All", ...Array.from(cats).sort()];
  }, [allShops]);

  const filtered = useMemo(() => {
    return allShops.filter(({ shop }) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        (shop.shopName || "").toLowerCase().includes(q) ||
        (shop.category || "").toLowerCase().includes(q) ||
        (shop.address || "").toLowerCase().includes(q);
      const matchCat = catFilter === "All" || shop.category === catFilter;
      return matchSearch && matchCat;
    });
  }, [allShops, search, catFilter]);

  // summary stats
  const totalRevenue = useMemo(() => {
    return Object.values(shopStats).reduce((s, v) => s + v.revenue, 0);
  }, [shopStats]);
  const totalOrders = useMemo(() => {
    return Object.values(shopStats).reduce((s, v) => s + v.orders, 0);
  }, [shopStats]);
  const totalActive = useMemo(() => {
    return Object.values(shopStats).reduce((s, v) => s + v.activeOrders, 0);
  }, [shopStats]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: "12px" }}>
        {[
          { label: "Total Shops",    value: allShops.length, icon: "🏪", color: "#7C3AED" },
          { label: "Total Revenue",  value: `₹${totalRevenue >= 1000 ? (totalRevenue / 1000).toFixed(1) + "k" : totalRevenue.toFixed(0)}`, icon: "💰", color: "#6D28D9" },
          { label: "Total Orders",   value: totalOrders,  icon: "📦", color: "#0284C7" },
          { label: "Active Orders",  value: totalActive,  icon: "🔥", color: "#EA580C" },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              background: "var(--color-background-secondary)",
              borderRadius: "12px",
              padding: "16px",
              border: "0.5px solid var(--color-border-tertiary)",
            }}
          >
            <p style={{ margin: "0 0 4px", fontSize: "12px", color: "var(--color-text-secondary)", fontWeight: 500 }}>
              {s.icon} {s.label}
            </p>
            <p style={{ margin: 0, fontSize: "22px", fontWeight: 700, color: s.color }}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Search + filter */}
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: "1 1 200px", minWidth: "180px" }}>
          <svg
            width="15"
            height="15"
            viewBox="0 0 16 16"
            fill="none"
            style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", opacity: 0.45 }}
          >
            <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.4"/>
            <path d="m10.5 10.5 3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
          <input
            type="text"
            placeholder="Search shops…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              paddingLeft: "36px",
              paddingRight: "12px",
              height: "38px",
              border: "0.5px solid var(--color-border-secondary)",
              borderRadius: "10px",
              background: "var(--color-background-primary)",
              color: "var(--color-text-primary)",
              fontSize: "14px",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {categories.map((cat) => {
            const cs = catStyle(cat);
            const active = catFilter === cat;
            return (
              <button
                key={cat}
                onClick={() => setCatFilter(cat)}
                style={{
                  padding: "6px 14px",
                  borderRadius: "999px",
                  border: active ? `1.5px solid ${cs.dot}` : "0.5px solid var(--color-border-tertiary)",
                  background: active ? cs.bg : "var(--color-background-primary)",
                  color: active ? cs.text : "var(--color-text-secondary)",
                  fontSize: "12px",
                  fontWeight: active ? 700 : 500,
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "64px 0",
            color: "var(--color-text-secondary)",
            fontSize: "15px",
          }}
        >
          No shops match your search.
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))",
            gap: "20px",
          }}
        >
          {filtered.map(({ shop, sellerName }) => {
            const id = shop.shopId || shop.id || shop.shopName;
            return (
              <ShopCard
                key={id}
                shop={shop}
                sellerName={sellerName}
                stats={shopStats[id]}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}