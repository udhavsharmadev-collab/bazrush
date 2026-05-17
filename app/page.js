'use client';

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

// ─── Cookie helpers ────────────────────────────────────────────────────────────
function setCookie(name, value, days = 30) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/`;
}

function getCookie(name) {
  return document.cookie
    .split('; ')
    .find(row => row.startsWith(name + '='))
    ?.split('=')[1]
    ? decodeURIComponent(document.cookie.split('; ').find(row => row.startsWith(name + '='))?.split('=')[1])
    : null;
}

// ─── Allowed city (case-insensitive) ──────────────────────────────────────────
const ALLOWED_CITY = 'panipat';

// ─── Location Gate ─────────────────────────────────────────────────────────────
const LocationGate = ({ onAllowed }) => {
  const [city, setCity] = useState('');
  const [status, setStatus] = useState('idle'); // idle | detecting | denied
  const [inputVal, setInputVal] = useState('');

  const checkCity = useCallback((value) => {
    const normalized = value.trim().toLowerCase();
    if (normalized === ALLOWED_CITY) {
      setCookie('user_city', value.trim(), 365);
      onAllowed();
    } else {
      setStatus('denied');
      setCity(value.trim());
    }
  }, [onAllowed]);

  const handleDetect = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser. Please enter your city manually.');
      return;
    }
    setStatus('detecting');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );
          const data = await res.json();
          const detectedCity =
            data.address?.city ||
            data.address?.town ||
            data.address?.village ||
            data.address?.county ||
            '';
          setInputVal(detectedCity);
          checkCity(detectedCity);
        } catch {
          setStatus('idle');
          alert('Could not detect your location. Please enter your city manually.');
        }
      },
      () => {
        setStatus('idle');
        alert('Location access denied. Please enter your city manually.');
      }
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    checkCity(inputVal);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl shadow-purple-100 border border-purple-100 overflow-hidden">
        {/* Top accent */}
        <div className="h-1.5 bg-gradient-to-r from-violet-600 via-purple-500 to-fuchsia-500" />

        <div className="p-8 text-center">
          {status !== 'denied' ? (
            <>
              <div className="text-5xl mb-4">📍</div>
              <h2 className="text-xl font-bold text-gray-800 mb-1">Where are you?</h2>
              <p className="text-sm text-gray-400 mb-6">
                We need your city to check if we deliver in your area.
              </p>

              {/* Auto-detect button */}
              <button
                onClick={handleDetect}
                disabled={status === 'detecting'}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-purple-500 text-white text-sm font-semibold py-3 rounded-xl hover:opacity-90 active:scale-95 transition-all duration-150 disabled:opacity-60 mb-3 cursor-pointer"
              >
                {status === 'detecting' ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Detecting…
                  </>
                ) : (
                  <>
                    <span>🎯</span> Detect My Location
                  </>
                )}
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 mb-3">
                <span className="flex-1 h-px bg-purple-100" />
                <span className="text-xs text-gray-400">or enter manually</span>
                <span className="flex-1 h-px bg-purple-100" />
              </div>

              {/* Manual input */}
              <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  placeholder="Enter your city…"
                  className="flex-1 border border-purple-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent"
                />
                <button
                  type="submit"
                  className="bg-purple-50 border border-purple-200 text-violet-600 font-semibold text-sm px-4 py-2.5 rounded-xl hover:bg-violet-600 hover:text-white hover:border-violet-600 transition-all duration-150 cursor-pointer"
                >
                  Go
                </button>
              </form>
            </>
          ) : (
            /* ── Not available screen ── */
            <>
              <div className="text-5xl mb-4">😔</div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Not Available Yet</h2>
              <p className="text-sm text-gray-400 mb-1">
                Sorry, we're currently not available in
              </p>
              <p className="text-base font-bold text-rose-500 mb-4">{city}</p>
              <p className="text-xs text-gray-400 bg-purple-50 rounded-xl px-4 py-3 mb-6">
                🚀 We're expanding fast! Right now we only serve{' '}
                <span className="font-semibold text-violet-600">Panipat</span>.
                We'll be in your city soon.
              </p>
              <button
                onClick={() => { setStatus('idle'); setInputVal(''); }}
                className="w-full border border-violet-200 text-violet-600 text-sm font-semibold py-2.5 rounded-xl hover:bg-violet-600 hover:text-white transition-all duration-150 cursor-pointer"
              >
                Try a Different City
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Product Card ──────────────────────────────────────────────────────────────
const ProductCard = ({ product, onNavigate }) => (
  <div className="w-44 flex-shrink-0 bg-white rounded-2xl border border-purple-100 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
    <div className="relative h-32 bg-gradient-to-br from-violet-50 to-purple-100 flex items-center justify-center">
      <img
        src={product.mainImageId}
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

// ─── Shop Card ─────────────────────────────────────────────────────────────────
const ShopCard = ({ shop, rating, onNavigate }) => (
  <div className="w-52 flex-shrink-0 bg-white rounded-2xl border border-purple-100 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
    <div className="h-28 bg-gradient-to-br from-violet-50 to-fuchsia-50 flex items-center justify-center overflow-hidden">
      <img
        src={shop.mainPhotoId}
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

// ─── Main Page ─────────────────────────────────────────────────────────────────
const Page = () => {
  const [locationAllowed, setLocationAllowed] = useState(null); // null = checking
  const [loading, setLoading] = useState(true);
  const [productsByCategory, setProductsByCategory] = useState({});
  const [shops, setShops] = useState([]);
  const [shopRatings, setShopRatings] = useState({});
  const router = useRouter();

  const handleNavigate = useCallback((path) => {
    router.push(path);
  }, [router]);

  // Check cookie on mount
  useEffect(() => {
    const saved = getCookie('user_city');
    if (saved && saved.toLowerCase() === ALLOWED_CITY) {
      setLocationAllowed(true);
    } else if (saved) {
      // Had a cookie but wrong city — show gate again
      setLocationAllowed(false);
    } else {
      setLocationAllowed(false);
    }
  }, []);

  // Load data once location is confirmed
  useEffect(() => {
    if (locationAllowed) {
      loadData();
      fetchRatings();
    }
  }, [locationAllowed]);

  const loadData = async () => {
    try {
      const [productsRes, sellersRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/sellers'),
      ]);
      const productsData = await productsRes.json();
      const sellersData = await sellersRes.json();

      const products = productsData.products || productsData || [];
      const sellers = sellersData.sellers || (Array.isArray(sellersData) ? sellersData : []);

      const shopsMap = {};
      const allShops = [];
      sellers.forEach(seller => {
        (seller.shops || []).forEach(shop => {
          if (shop.id) shopsMap[shop.id] = shop;
          allShops.push(shop);
        });
      });

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

  // ── Render ──
  if (locationAllowed === null) {
    // Brief flash while reading cookie
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 flex items-center justify-center">
        <span className="w-8 h-8 border-4 border-violet-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!locationAllowed) {
    return <LocationGate onAllowed={() => setLocationAllowed(true)} />;
  }

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