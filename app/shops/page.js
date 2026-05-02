'use client';

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";

const ShopsPage = () => {
  const router = useRouter();
  const [shops, setShops] = useState([]);
  const [shopRatings, setShopRatings] = useState({});
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [showOpenOnly, setShowOpenOnly] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchShops();
    fetchRatings();
  }, []);

  const fetchShops = async () => {
    try {
      const res = await fetch("/api/sellers");
      const sellersData = await res.json();

      // Handle both { sellers: [] } and plain array response
      const sellers = sellersData.sellers || (Array.isArray(sellersData) ? sellersData : []);

      const allShops = [];
      sellers.forEach((seller) => {
        (seller.shops || []).forEach((shop) =>
          allShops.push({ ...shop, ownerName: seller.name })
        );
      });

      setShops(allShops);
    } catch (err) {
      console.error("Failed to fetch shops:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRatings = async () => {
    try {
      const res = await fetch("/api/reviews");
      const reviews = await res.json();

      const map = {};
      for (const review of (Array.isArray(reviews) ? reviews : [])) {
        if (!review.shopId) continue;
        if (!map[review.shopId]) map[review.shopId] = { total: 0, count: 0 };
        map[review.shopId].total += review.rating;
        map[review.shopId].count += 1;
      }

      const computed = {};
      for (const [id, { total, count }] of Object.entries(map)) {
        computed[id] = { avg: (total / count).toFixed(1), count };
      }
      setShopRatings(computed);
    } catch (err) {
      console.error("Rating fetch failed:", err);
    }
  };

  const categories = useMemo(() => {
    const cats = new Set(shops.map((s) => s.category).filter(Boolean));
    return ["All", ...Array.from(cats)];
  }, [shops]);

  const filtered = useMemo(() => {
    return shops.filter((shop) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        shop.shopName?.toLowerCase().includes(q) ||
        shop.category?.toLowerCase().includes(q) ||
        shop.address?.toLowerCase().includes(q);
      const matchCategory =
        activeFilter === "All" || shop.category === activeFilter;
      const matchOpen = !showOpenOnly || shop.isOpen;
      return matchSearch && matchCategory && matchOpen;
    });
  }, [shops, search, activeFilter, showOpenOnly]);

  return (
    <div className="min-h-screen bg-white">
      {/* ── HERO HEADER ── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-violet-700 via-purple-600 to-fuchsia-600 px-5 pt-14 pb-20">
        {/* decorative blobs */}
        <div className="pointer-events-none absolute -top-16 -right-16 w-72 h-72 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-12 -left-12 w-56 h-56 rounded-full bg-fuchsia-400/20 blur-2xl" />

        <button
          onClick={() => router.back()}
          className="mb-5 flex items-center gap-2 text-white/70 text-sm font-medium hover:text-white transition-colors"
        >
          ← Back
        </button>

        <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-1">
          Discover
        </p>
        <h1 className="text-3xl font-black text-white leading-tight mb-1">
          All Shops 🏪
        </h1>
        <p className="text-white/60 text-sm mb-8">
          {shops.length} local shops · near you
        </p>

        {/* Search bar floats over hero bottom */}
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-base">
            🔍
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search shops, categories, areas…"
            className="w-full pl-11 pr-4 py-4 rounded-2xl bg-white shadow-xl shadow-purple-900/20 text-gray-800 placeholder-gray-400 text-sm font-medium outline-none border-0 focus:ring-2 focus:ring-violet-300 transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg leading-none"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* ── FILTERS ── */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm px-4 pt-3 pb-3">
        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-2 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveFilter(cat)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-bold border transition-all duration-200 ${
                activeFilter === cat
                  ? "bg-gradient-to-r from-violet-600 to-purple-500 text-white border-transparent shadow-md shadow-purple-200"
                  : "bg-white text-gray-500 border-gray-200 hover:border-violet-300 hover:text-violet-600"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Open only toggle + result count */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400 font-medium">
            {filtered.length} shop{filtered.length !== 1 ? "s" : ""} found
          </span>
          <button
            onClick={() => setShowOpenOnly((v) => !v)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border transition-all duration-200 ${
              showOpenOnly
                ? "bg-emerald-500 text-white border-emerald-500 shadow-sm"
                : "bg-white text-gray-500 border-gray-200 hover:border-emerald-400 hover:text-emerald-600"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                showOpenOnly ? "bg-white" : "bg-emerald-400"
              }`}
            />
            Open Now
          </button>
        </div>
      </div>

      {/* ── SHOP GRID ── */}
      <div className="px-4 py-6">
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-60 rounded-2xl bg-purple-50 animate-pulse"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-gray-500 font-semibold mb-1">No shops found</p>
            <p className="text-gray-400 text-sm">Try a different search or filter</p>
            <button
              onClick={() => { setSearch(""); setActiveFilter("All"); setShowOpenOnly(false); }}
              className="mt-5 px-5 py-2.5 rounded-full bg-gradient-to-r from-violet-600 to-purple-500 text-white text-sm font-bold shadow-md shadow-purple-200"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map((shop) => {
              const rating = shopRatings[shop.id];
              return (
                <div
                  key={shop.id}
                  onClick={() => router.push(`/shop/${shop.id}`)}
                  className="cursor-pointer group bg-white rounded-2xl border border-purple-100 overflow-hidden hover:shadow-xl hover:shadow-purple-100 hover:-translate-y-1 transition-all duration-300"
                >
                  {/* Image */}
                  <div className="relative h-32 bg-gradient-to-br from-violet-50 to-fuchsia-50 overflow-hidden">
                    <img
                      src={`/images/${shop.mainPhotoId}`}
                      alt={shop.shopName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => { e.target.style.opacity = "0.1"; }}
                    />
                    {/* Open/Closed badge */}
                    <span
                      className={`absolute top-2 left-2 flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        shop.isOpen
                          ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                          : "bg-rose-50 text-rose-500 border-rose-200"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          shop.isOpen ? "bg-emerald-500" : "bg-rose-400"
                        }`}
                      />
                      {shop.isOpen ? "Open" : "Closed"}
                    </span>

                    {/* Rating badge */}
                    {rating && (
                      <span className="absolute top-2 right-2 flex items-center gap-0.5 text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                        ⭐ {rating.avg}
                      </span>
                    )}

                    {/* gradient fade */}
                    <div className="absolute inset-0 bg-gradient-to-t from-white/30 to-transparent" />
                  </div>

                  {/* Info */}
                  <div className="p-3">
                    <p className="text-sm font-black text-gray-900 truncate leading-tight">
                      {shop.shopName}
                    </p>

                    <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-50 text-violet-600 border border-violet-100">
                      {shop.category}
                    </span>

                    <p className="mt-1.5 text-[11px] text-gray-400 truncate flex items-center gap-1">
                      <span>📍</span> {shop.address?.split(",")[0]}
                    </p>

                    {rating ? (
                      <p className="mt-0.5 text-[10px] text-gray-400">
                        {rating.count} review{rating.count !== 1 ? "s" : ""}
                      </p>
                    ) : (
                      <p className="mt-0.5 text-[10px] text-gray-300">No reviews yet</p>
                    )}

                    <div className="mt-3 w-full py-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-500 text-white text-[11px] font-bold text-center shadow-sm shadow-purple-200">
                      Visit Shop →
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ShopsPage;