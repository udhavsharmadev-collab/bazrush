'use client';

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";

const ShopPage = () => {
  const { id } = useParams();
  const router = useRouter();
  const [shop, setShop] = useState(null);
  const [shopProducts, setShopProducts] = useState([]);
  const [activeTab, setActiveTab] = useState("products");
  const [todayDay, setTodayDay] = useState("");
  const [rating, setRating] = useState(null);
  const [productSearch, setProductSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
    setTodayDay(days[new Date().getDay()]);

    const loadAll = async () => {
      try {
        const sellersRes = await fetch('/api/sellers');
        const sellersData = await sellersRes.json();
        const sellers = sellersData.sellers || (Array.isArray(sellersData) ? sellersData : []);

        let foundShop = null;
        for (const seller of sellers) {
          for (const s of (seller.shops || [])) {
            if (s.id === id) {
              foundShop = { ...s, ownerName: seller.name, ownerPhone: seller.phoneNumber };
              break;
            }
          }
          if (foundShop) break;
        }
        setShop(foundShop);

        const productsRes = await fetch('/api/products');
        const productsData = await productsRes.json();
        const products = productsData.products || productsData || [];
        setShopProducts(products.filter((p) => p.shopId === id));

        await fetchShopRating(id);
      } catch (err) {
        console.error('Failed to load shop data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadAll();
  }, [id]);

  const fetchShopRating = async (shopId) => {
    try {
      const res = await fetch('/api/reviews');
      const reviews = await res.json();
      let total = 0, count = 0;
      for (const review of (Array.isArray(reviews) ? reviews : [])) {
        if (review.shopId === shopId) { total += review.rating; count++; }
      }
      if (count > 0) setRating({ avg: (total / count).toFixed(1), count });
    } catch (err) {
      console.error('Failed to fetch shop rating:', err);
    }
  };

  const inStockProducts = useMemo(
    () => shopProducts.filter(p => p.stockStatus === 'in_stock' && p.stockQuantity > 0),
    [shopProducts]
  );
  const outOfStockProducts = useMemo(
    () => shopProducts.filter(p => p.stockStatus !== 'in_stock' || p.stockQuantity <= 0),
    [shopProducts]
  );

  const categories = useMemo(() => {
    const cats = [...new Set(inStockProducts.map(p => p.category).filter(Boolean))];
    return cats.sort();
  }, [inStockProducts]);

  const filteredProducts = useMemo(() => {
    const q = productSearch.toLowerCase().trim();
    return inStockProducts.filter((p) => {
      const matchesSearch = !q || p.name?.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q);
      const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [inStockProducts, productSearch, selectedCategory]);

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-violet-200 border-t-violet-600 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-400 text-sm">Loading shop...</p>
      </div>
    </div>
  );

  if (!shop) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="text-5xl mb-4">🏪</div>
        <p className="text-gray-400 text-sm mb-4">Shop not found</p>
        <button onClick={() => router.back()} className="text-violet-600 text-sm font-bold border border-violet-200 px-5 py-2.5 rounded-2xl hover:bg-violet-50 transition-colors">← Go Back</button>
      </div>
    </div>
  );

  const days = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

  return (
    <div className="min-h-screen bg-white pb-10">

      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-700 hover:bg-gray-100 transition-all text-lg"
        >
          ←
        </button>
        <span className="text-gray-900 font-bold text-sm truncate flex-1 capitalize">{shop.shopName}</span>
        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
          shop.isOpen
            ? "bg-emerald-50 text-emerald-600 border-emerald-200"
            : "bg-rose-50 text-rose-500 border-rose-200"
        }`}>
          {shop.isOpen ? "● Open" : "● Closed"}
        </span>
      </div>

      {/* Hero */}
      <div className="relative h-52 overflow-hidden">
        <img
          src={`/images/${shop.mainPhotoId}`}
          alt={shop.shopName}
          className="w-full h-full object-cover"
          onError={(e) => { e.target.style.opacity = '0.1'; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/10 to-transparent" />
      </div>

      {/* Shop identity */}
      <div className="px-4 -mt-6 relative z-10">
        <div className="flex items-end gap-3 mb-4">
          <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-white shadow-lg bg-violet-50 flex-shrink-0">
            <img
              src={`/images/${shop.mainPhotoId}`}
              alt={shop.shopName}
              className="w-full h-full object-cover"
              onError={(e) => { e.target.style.opacity = '0'; }}
            />
          </div>
          <div className="flex-1 pb-1">
            <h1 className="text-lg font-black text-gray-900 capitalize leading-tight">{shop.shopName}</h1>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-violet-50 text-violet-600 border border-violet-100">
                {shop.category}
              </span>
              {rating ? (
                <span className="text-[11px] font-black text-amber-500 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-100">
                  ⭐ {rating.avg} <span className="text-gray-400 font-medium">({rating.count} review{rating.count !== 1 ? 's' : ''})</span>
                </span>
              ) : (
                <span className="text-[11px] text-gray-300 font-medium">No reviews yet</span>
              )}
            </div>
          </div>
        </div>

        {/* Info pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 mb-4">
          <div className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-gray-50 border border-gray-100">
            <span className="text-sm">📍</span>
            <span className="text-xs text-gray-600 font-medium whitespace-nowrap">{shop.address?.split(",")[0]}</span>
          </div>
          <div className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-gray-50 border border-gray-100">
            <span className="text-sm">👤</span>
            <span className="text-xs text-gray-600 font-medium whitespace-nowrap">{shop.ownerName}</span>
          </div>
          <div className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-gray-50 border border-gray-100">
            <span className="text-sm">📦</span>
            <span className="text-xs text-gray-600 font-medium whitespace-nowrap">{inStockProducts.length} In Stock</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-gray-100 rounded-2xl mb-5">
          {["products", "timing"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 text-xs font-bold rounded-xl capitalize transition-all duration-200 ${
                activeTab === tab
                  ? "bg-white text-violet-600 shadow-sm"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              {tab === "products" ? "🛍️ Products" : "🕐 Timings"}
            </button>
          ))}
        </div>

        {/* Products Tab */}
        {activeTab === "products" ? (
          <>
            {inStockProducts.length > 0 && (
              <>
                {/* Search bar full width */}
                <div className="relative mb-3">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder={`Search in ${shop.shopName}…`}
                    className="w-full pl-10 pr-10 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-gray-800 placeholder-gray-400 text-sm font-medium outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-300 transition-all"
                  />
                  {productSearch && (
                    <button
                      onClick={() => setProductSearch("")}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg leading-none"
                    >
                      ×
                    </button>
                  )}
                </div>

                {/* Category pills */}
                {categories.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pb-2 mb-3">
                    <button
                      onClick={() => setSelectedCategory('all')}
                      className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all border ${
                        selectedCategory === 'all'
                          ? 'bg-violet-600 text-white border-violet-600 shadow-md shadow-violet-200'
                          : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-violet-300'
                      }`}
                    >
                      All ({inStockProducts.length})
                    </button>
                    {categories.map(cat => {
                      const count = inStockProducts.filter(p => p.category === cat).length;
                      return (
                        <button
                          key={cat}
                          onClick={() => setSelectedCategory(cat)}
                          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all border capitalize ${
                            selectedCategory === cat
                              ? 'bg-violet-600 text-white border-violet-600 shadow-md shadow-violet-200'
                              : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-violet-300'
                          }`}
                        >
                          {cat} ({count})
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {(productSearch || selectedCategory !== 'all') && (
              <p className="text-xs text-gray-400 font-medium mb-3">
                {filteredProducts.length} result{filteredProducts.length !== 1 ? "s" : ""}
                {productSearch && <> for <span className="text-violet-500 font-bold">"{productSearch}"</span></>}
                {selectedCategory !== 'all' && <> in <span className="text-violet-500 font-bold capitalize">{selectedCategory}</span></>}
              </p>
            )}

            {shopProducts.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-5xl mb-3">📦</div>
                <p className="text-gray-400 text-sm">No products in this shop yet</p>
              </div>
            ) : filteredProducts.length === 0 && (productSearch || selectedCategory !== 'all') ? (
              <div className="text-center py-16">
                <div className="text-5xl mb-3">🔍</div>
                <p className="text-gray-600 font-semibold text-sm mb-1">No products found</p>
                <p className="text-gray-400 text-xs mb-4">Try a different keyword or category</p>
                <button
                  onClick={() => { setProductSearch(""); setSelectedCategory('all'); }}
                  className="px-5 py-2 rounded-full bg-gradient-to-r from-violet-600 to-purple-500 text-white text-xs font-bold shadow-md shadow-purple-200"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <>
                {filteredProducts.length > 0 && (
                  <div className="flex flex-wrap gap-3">
                    {filteredProducts.map((product) => (
                      <div
                        key={product.id}
                        onClick={() => router.push(`/product/${product.id}`)}
                        className="cursor-pointer group w-[calc(33.333%-8px)]"
                      >
                        <div className="w-full aspect-square md:w-[200px] md:h-[200px] rounded-xl overflow-hidden bg-gradient-to-br from-violet-50 to-purple-50 border border-purple-100 relative mb-1">
                          <img
                            src={`/images/${product.mainImageId}`}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => { e.target.style.opacity = '0.2'; }}
                          />
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-1.5">
                            <p className="text-white font-black text-[11px]">₹{product.price}</p>
                          </div>
                          {product.stockQuantity <= 5 ? (
                            <span className="absolute top-1.5 right-1.5 bg-amber-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow">
                              Only {product.stockQuantity} left!
                            </span>
                          ) : (
                            <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-400 shadow shadow-emerald-300" />
                          )}
                        </div>
                        <p className="text-[11px] font-bold text-gray-800 truncate leading-tight">{product.name}</p>
                        <p className="text-[10px] text-violet-500 font-medium truncate">{product.category}</p>
                      </div>
                    ))}
                  </div>
                )}

                {!productSearch && selectedCategory === 'all' && outOfStockProducts.length > 0 && (
                  <div className="mt-6">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex-1 h-px bg-gray-200" />
                      <span className="text-[11px] text-gray-400 font-semibold whitespace-nowrap">
                        Out of Stock ({outOfStockProducts.length})
                      </span>
                      <div className="flex-1 h-px bg-gray-200" />
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {outOfStockProducts.map((product) => (
                        <div key={product.id} className="w-[calc(33.333%-8px)] opacity-50 cursor-not-allowed">
                          <div className="w-full aspect-square md:w-[200px] md:h-[200px] rounded-xl overflow-hidden bg-gradient-to-br from-violet-50 to-purple-50 border border-purple-100 relative mb-1">
                            <img
                              src={`/images/${product.mainImageId}`}
                              alt={product.name}
                              className="w-full h-full object-cover grayscale"
                              onError={(e) => { e.target.style.opacity = '0.2'; }}
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/25">
                              <span className="bg-white text-gray-700 text-[10px] font-black px-2 py-1 rounded-lg shadow">
                                Out of Stock
                              </span>
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-1.5">
                              <p className="text-white/60 font-black text-[11px]">₹{product.price}</p>
                            </div>
                          </div>
                          <p className="text-[11px] font-bold text-gray-400 truncate leading-tight">{product.name}</p>
                          <p className="text-[10px] text-gray-300 font-medium truncate">{product.category}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        ) : (
          <div className="space-y-2">
            {days.map((day) => {
              const timing = shop.timing?.[day];
              const isToday = day === todayDay;
              return (
                <div
                  key={day}
                  className={`flex items-center justify-between px-4 py-3.5 rounded-2xl border ${
                    isToday ? "bg-violet-50 border-violet-200" : "bg-white border-gray-100"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {isToday && <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />}
                    <span className={`text-sm font-bold ${isToday ? "text-violet-700" : "text-gray-500"}`}>
                      {day}{isToday ? " · Today" : ""}
                    </span>
                  </div>
                  {timing?.closed ? (
                    <span className="text-xs text-rose-500 font-bold bg-rose-50 px-3 py-1 rounded-full border border-rose-100">Closed</span>
                  ) : (
                    <span className={`text-xs font-bold ${isToday ? "text-violet-600" : "text-gray-400"}`}>
                      {timing?.open} – {timing?.close}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ShopPage;