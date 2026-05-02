'use client';

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

const ProductCard = ({ product, onNavigate }) => (
  <div className="w-44 flex-shrink-0 bg-white rounded-2xl border border-purple-100 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
    <div className="relative h-32 bg-gradient-to-br from-violet-50 to-purple-100 flex items-center justify-center">
      <img
        src={`/images/${product.mainImageId}`}
        alt={product.name}
        className="w-full h-full object-cover"
        onError={(e) => { e.target.style.display = 'none'; }}
      />
      <span className="absolute bottom-2 left-2 bg-gradient-to-r from-violet-600 to-purple-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
        ₹{product.price}
      </span>
      <span className="absolute top-2 right-2 bg-emerald-50 text-emerald-600 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-emerald-200">
        {product.stockQuantity <= 5 ? `Only ${product.stockQuantity} left!` : 'In Stock'}
      </span>
    </div>
    <div className="p-3">
      <p className="text-xs font-semibold text-gray-800 truncate">{product.name}</p>
      <p className="text-[11px] text-purple-500 mb-2">{product.shopName}</p>
      <a
        href={`/product/${product.id}`}
        onClick={(e) => { e.preventDefault(); onNavigate(`/product/${product.id}`); }}
        className="block w-full bg-gradient-to-r from-violet-600 to-purple-500 text-white text-xs font-semibold py-1.5 rounded-lg hover:opacity-90 transition-opacity text-center cursor-pointer"
      >
        View Product
      </a>
    </div>
  </div>
);

const ShopCard = ({ shop, rating, onNavigate }) => (
  <div className="w-52 flex-shrink-0 bg-white rounded-2xl border border-purple-100 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
    <div className="h-28 bg-gradient-to-br from-violet-50 to-fuchsia-50 flex items-center justify-center overflow-hidden">
      <img
        src={`/images/${shop.mainPhotoId}`}
        alt={shop.shopName}
        className="w-full h-full object-cover"
        onError={(e) => { e.target.style.display = 'none'; }}
      />
    </div>
    <div className="p-3">
      <p className="text-sm font-bold text-gray-800 truncate">{shop.shopName}</p>
      <p className="text-[11px] text-purple-500 font-semibold mb-0.5">{shop.category}</p>
      <p className="text-[11px] text-gray-400 truncate mb-1.5">{shop.address}</p>
      <div className="flex items-center justify-between mb-2">
        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
          shop.isOpen ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-500"
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${shop.isOpen ? "bg-emerald-500" : "bg-rose-400"}`} />
          {shop.isOpen ? "Open Now" : "Closed"}
        </span>
        {rating ? (
          <span className="inline-flex items-center gap-0.5 text-[11px] font-black text-amber-500">
            ⭐ {rating.avg}
            <span className="text-gray-400 font-medium">({rating.count})</span>
          </span>
        ) : (
          <span className="text-[10px] text-gray-300 font-medium">No reviews</span>
        )}
      </div>
      <a
        href={`/shop/${shop.id}`}
        onClick={(e) => { e.preventDefault(); onNavigate(`/shop/${shop.id}`); }}
        className="block w-full border border-violet-600 text-violet-600 text-xs font-semibold py-1.5 rounded-lg hover:bg-violet-600 hover:text-white transition-all duration-200 text-center cursor-pointer"
      >
        View Shop →
      </a>
    </div>
  </div>
);

const Page = () => {
  const [loading, setLoading] = useState(true);
  const [productsByCategory, setProductsByCategory] = useState({});
  const [shops, setShops] = useState([]);
  const [shopRatings, setShopRatings] = useState({});
  const router = useRouter();

  const handleNavigate = useCallback((path) => {
    router.push(path);
  }, [router]);

  useEffect(() => {
    loadData();
    fetchRatings();
  }, []);

  const loadData = async () => {
    try {
      const [productsRes, sellersRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/sellers'),
      ]);
      const productsData = await productsRes.json();
      const sellersData = await sellersRes.json();

      // Handle both { sellers: [] } and plain array response
      const products = productsData.products || productsData || [];
      const sellers = sellersData.sellers || (Array.isArray(sellersData) ? sellersData : []);

      // Build shopId → shop map
      const shopsMap = {};
      const allShops = [];
      sellers.forEach(seller => {
        (seller.shops || []).forEach(shop => {
          if (shop.id) shopsMap[shop.id] = shop;
          allShops.push(shop);
        });
      });

      // Group in-stock products by category
      const grouped = {};
      products.forEach(p => {
        if (p.stockStatus !== 'in_stock' || p.stockQuantity <= 0) return;
        const cat = p.category || 'Other';
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push({ ...p, shopName: shopsMap[p.shopId]?.shopName || 'Unknown' });
      });

      setProductsByCategory(grouped);
      setShops(allShops);
    } catch (err) {
      console.error('Data load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRatings = async () => {
    try {
      const res = await fetch('/api/reviews');
      const reviews = await res.json();
      const ratingsMap = {};
      for (const review of (Array.isArray(reviews) ? reviews : [])) {
        if (!review.shopId) continue;
        if (!ratingsMap[review.shopId]) ratingsMap[review.shopId] = { total: 0, count: 0 };
        ratingsMap[review.shopId].total += review.rating;
        ratingsMap[review.shopId].count += 1;
      }
      const computed = {};
      for (const [shopId, { total, count }] of Object.entries(ratingsMap)) {
        computed[shopId] = { avg: (total / count).toFixed(1), count };
      }
      setShopRatings(computed);
    } catch (err) {
      console.error('Failed to fetch ratings:', err);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 border-b border-purple-100 px-6 py-14 text-center">
        <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-3">
          <span className="bg-gradient-to-r from-violet-700 via-purple-600 to-fuchsia-600 bg-clip-text text-transparent">
            Find what you need,<br />delivered fast
          </span>{' '}
          <span>⚡</span>
        </h1>
        <p className="text-sm text-gray-500 mb-6">Local shops · Real-time availability · Fast delivery</p>
        <a
          href="/shops"
          onClick={(e) => { e.preventDefault(); handleNavigate('/shops'); }}
          className="inline-block bg-gradient-to-r from-violet-600 to-purple-500 text-white px-8 py-3 rounded-full text-sm font-semibold shadow-lg shadow-purple-200 hover:shadow-purple-300 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
        >
          Start Shopping
        </a>
      </section>

      {/* Products by Category */}
      <section className="px-5 py-8">
        <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
          🛍️ <span className="bg-gradient-to-r from-violet-600 to-purple-500 bg-clip-text text-transparent">Featured Products</span>
        </h2>
        {loading ? (
          <div className="flex gap-3 overflow-x-auto pb-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="w-44 flex-shrink-0 h-52 bg-purple-50 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : Object.keys(productsByCategory).length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">
            <div className="text-4xl mb-3">🛍️</div>No products available right now!
          </div>
        ) : (
          <div className="flex gap-6 overflow-x-auto pb-3">
            {Object.entries(productsByCategory).map(([category, catProducts]) => (
              <div key={category} className="flex-shrink-0">
                <span className="text-[11px] font-semibold text-purple-500 bg-purple-50 px-3 py-0.5 rounded-full mb-3 inline-block">
                  {category}
                </span>
                <div className="flex gap-3">
                  {catProducts.map((p) => (
                    <ProductCard key={p.id} product={p} onNavigate={handleNavigate} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Shops */}
      <section className="px-5 py-8 bg-gray-50 border-t border-purple-100">
        <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
          🏪 <span className="bg-gradient-to-r from-violet-600 to-purple-500 bg-clip-text text-transparent">Local Shops Near You</span>
        </h2>
        {loading ? (
          <div className="flex gap-3 overflow-x-auto pb-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="w-52 flex-shrink-0 h-60 bg-purple-50 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : shops.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">
            <div className="text-4xl mb-3">🏪</div>No shops in your area yet!
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-3">
            {shops.map((shop, i) => (
              <ShopCard
                key={shop.id || i}
                shop={shop}
                rating={shopRatings[shop.id]}
                onNavigate={handleNavigate}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Page;