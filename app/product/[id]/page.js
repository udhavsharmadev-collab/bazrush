'use client';

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { useWishlist } from "../../context/Wishlistcontext";
import { Star, Heart, Check } from "lucide-react";

const StarDisplay = ({ rating, size = 'sm' }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((s) => (
      <Star
        key={s}
        className={`${size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} ${
          s <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'
        }`}
        strokeWidth={1.5}
      />
    ))}
  </div>
);

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24) return `${hrs}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

const ProductPage = () => {
  const { id } = useParams();
  const router = useRouter();
  const { cartItems, addToCart, updateQuantity, removeFromCart } = useCart();
  const { isAuthenticated } = useAuth();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

  const [product, setProduct] = useState(null);
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);

  // selectedColorIndex: null = no color picked, number = index into product.colors
  const [selectedColorIndex, setSelectedColorIndex] = useState(null);
const [selectedSize, setSelectedSize] = useState(null);

  // activeThumb: which thumbnail is highlighted (0 = main, 1+ = side images)
  // Only used when NO color is selected. When a color IS selected, big image = color image.
  const [activeThumb, setActiveThumb] = useState(0);

  const [justAdded, setJustAdded] = useState(false);
  const [wishlistPulse, setWishlistPulse] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [avgRating, setAvgRating] = useState(null);
  const [loadingReviews, setLoadingReviews] = useState(true);

  // ── Load product + shop ────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const [productsRes, sellersRes] = await Promise.all([
          fetch('/api/products'),
          fetch('/api/sellers'),
        ]);
        const productsData = await productsRes.json();
        const sellersData = await sellersRes.json();
        const products = productsData.products || productsData || [];
        const sellers = sellersData.sellers || (Array.isArray(sellersData) ? sellersData : []);
        const found = products.find((p) => p.id === id);
       setProduct(found || null);
if (found) {
  // Pre-select first color and first size
  if (found.colors?.length > 0) setSelectedColorIndex(0);
  if (found.sizes?.length > 0) setSelectedSize(found.sizes[0]);

  for (const seller of sellers) {
    for (const s of (seller.shops || [])) {
      if (s.id === found.shopId) { setShop(s); break; }
    }
  }
}
      } catch (err) {
        console.error('Failed to load product:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
    fetchProductReviews(id);
  }, [id]);

  const fetchProductReviews = async (productId) => {
    setLoadingReviews(true);
    try {
      const res = await fetch('/api/reviews');
      const all = await res.json();
      const filtered = (Array.isArray(all) ? all : [])
        .filter((r) => r.productId === productId)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setReviews(filtered);
      if (filtered.length > 0) {
        const avg = (filtered.reduce((s, r) => s + r.rating, 0) / filtered.length).toFixed(1);
        setAvgRating({ avg, count: filtered.length });
      }
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
    } finally {
      setLoadingReviews(false);
    }
  };

  // ── Derived image logic ────────────────────────────────────────────────────
  //
  // BIG IMAGE (shown at top):
  //   - color selected  → product.colorImageIds[selectedColorIndex]
  //   - no color        → main image OR whichever side thumb is active
  //
  // THUMBNAILS (always visible below big image):
  //   - slot 0 = main image
  //   - slot 1..n = side images (product.imageIds)
  //   Thumbnails are purely for browsing when no color is selected.
  //   When a color is selected, thumbnail highlight is cleared.
  //
  // COLOR SWATCHES (separate section below):
  //   - each swatch = product.colorImageIds[i]  (its own uploaded photo)
  //   - clicking a swatch sets selectedColorIndex and replaces the big image
  //
  // CART IMAGE = whatever is shown big at the moment of "Add to Cart"

  const sideImages = product ? (product.imageIds || []).filter(Boolean) : [];
  const thumbImages = product
    ? [product.mainImageId, ...sideImages].filter(Boolean)
    : [];

  const selectedColor = selectedColorIndex !== null
    ? product?.colors?.[selectedColorIndex] ?? null
    : null;

  const selectedColorImgId = selectedColorIndex !== null
    ? (product?.colorImageIds?.[selectedColorIndex] || null)
    : null;

  // Big image: color image if selected, else the active thumbnail
  const bigImageId = selectedColorImgId || thumbImages[activeThumb] || null;

  // Cart always gets whatever is big
  const cartImageId = bigImageId;

  const shopClosed = shop ? !shop.isOpen : false;

  const cartKey = product
    ? `${product.id}-${selectedColor || 'default'}-${selectedSize || 'default'}`
    : null;
  const cartItem = cartItems.find((i) => i.key === cartKey);
  const cartQty = cartItem ? cartItem.quantity : 0;

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleColorSelect = (index) => {
  setSelectedColorIndex(index);
};
  const handleThumbClick = (index) => {
    setActiveThumb(index);
    // Clicking a thumbnail clears color selection so main/side image shows
    setSelectedColorIndex(null);
  };

  const handleAddToCart = () => {
    if (!product || shopClosed) return;
    addToCart({ ...product, cartImageId }, selectedColor, selectedSize);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);
  };

  const handleIncrease = () => {
    if (!product || shopClosed) return;
    addToCart({ ...product, cartImageId }, selectedColor, selectedSize);
  };

  const handleWishlistToggle = () => {
    if (!product) return;
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
      setWishlistPulse(true);
      setTimeout(() => setWishlistPulse(false), 600);
    }
  };

  // ── Loading / not found ────────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-violet-200 border-t-violet-600 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-400 text-sm">Loading product...</p>
      </div>
    </div>
  );

  if (!product) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="text-5xl mb-4">📦</div>
        <p className="text-gray-400 text-sm mb-4">Product not found</p>
        <button onClick={() => router.back()} className="text-violet-600 text-sm font-bold border border-violet-200 px-5 py-2.5 rounded-2xl hover:bg-violet-50 transition-colors">← Go Back</button>
      </div>
    </div>
  );

  const wishlisted = isInWishlist(product.id);

  return (
    <div className="min-h-screen bg-white pb-32">

      {/* ── Header ── */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-700 hover:bg-gray-100 transition-all text-lg"
        >←</button>
        <span className="text-gray-900 font-bold text-sm truncate flex-1 capitalize">{product.name}</span>
        <button
          onClick={handleWishlistToggle}
          className={`w-9 h-9 rounded-2xl flex items-center justify-center border transition-all duration-200 ${
            wishlisted ? 'bg-rose-50 border-rose-200' : 'bg-gray-50 border-gray-200 hover:bg-rose-50 hover:border-rose-200'
          }`}
        >
          <Heart className={`w-4 h-4 transition-all duration-200 ${wishlisted ? 'fill-rose-500 text-rose-500' : 'text-gray-400'} ${wishlistPulse ? 'scale-125' : 'scale-100'}`} />
        </button>
        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
          product.stockStatus === 'in_stock'
            ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
            : 'bg-rose-50 text-rose-500 border border-rose-200'
        }`}>
          {product.stockStatus === 'in_stock' ? '✓ In Stock' : 'Out of Stock'}
        </span>
      </div>

      {/* ── Big image ── */}
      <div className="mx-4 mt-4">
        <div className="w-full h-64 rounded-3xl overflow-hidden bg-gradient-to-br from-violet-50 to-purple-50 border border-purple-100 flex items-center justify-center relative">
          <img
            key={bigImageId}
            src={bigImageId}
            alt={product.name}
            className="w-full h-full object-contain p-4"
            onError={(e) => { e.target.style.opacity = '0.2'; }}
          />
          <span className="absolute top-3 left-3 text-[11px] font-bold px-3 py-1 rounded-full bg-white/90 backdrop-blur text-violet-600 border border-violet-100 shadow-sm uppercase tracking-wide">
            {product.category}
          </span>
          {avgRating && (
            <span className="absolute top-3 right-3 text-[11px] font-black px-2.5 py-1 rounded-full bg-white/90 backdrop-blur text-amber-500 border border-amber-100 shadow-sm">
              ⭐ {avgRating.avg} ({avgRating.count})
            </span>
          )}
          {/* Color badge on big image when a color is selected */}
          {selectedColor && (
            <span className="absolute bottom-3 left-3 text-[11px] font-bold px-3 py-1 rounded-full bg-violet-600/90 text-white shadow-sm capitalize">
              {selectedColor}
            </span>
          )}
        </div>

        {/* ── Thumbnails: main + side images ── */}
       {thumbImages.length > 1 && (
  <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
    {thumbImages.map((imgId, i) => {
      const isActive = !selectedColorImgId && activeThumb === i;
      return (
        <button
          key={imgId}
          onClick={() => handleThumbClick(i)}
          className={`relative w-14 h-14 rounded-2xl overflow-hidden border-2 flex-shrink-0 transition-all duration-200 ${
            isActive
              ? 'border-violet-500 shadow-md shadow-violet-200'
              : 'border-gray-200 opacity-60 hover:opacity-100 hover:border-violet-200'
          }`}
        >
          <img
            src={imgId}
            alt={i === 0 ? 'Main' : `Side ${i}`}
            className="w-full h-full object-cover"
            onError={(e) => { e.target.style.opacity = '0'; }}
          />
        </button>
      );
    })}
  </div>
)}
</div>

      {/* ── Info ── */}
      <div className="px-4 mt-5 space-y-5">

        {/* Name + Price */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <h1 className="text-xl font-black text-gray-900 capitalize leading-snug">{product.name}</h1>
            {avgRating ? (
              <div className="flex items-center gap-1.5 mt-1">
                <StarDisplay rating={Math.round(parseFloat(avgRating.avg))} />
                <span className="text-xs font-black text-amber-500">{avgRating.avg}</span>
                <span className="text-xs text-gray-400">({avgRating.count} review{avgRating.count !== 1 ? 's' : ''})</span>
              </div>
            ) : (
              !loadingReviews && <p className="text-xs text-gray-300 mt-1">No reviews yet</p>
            )}
          </div>
          <div className="flex-shrink-0 bg-gradient-to-br from-violet-600 to-fuchsia-500 px-4 py-2 rounded-2xl shadow-lg shadow-violet-200">
            <p className="text-white font-black text-xl">₹{product.price}</p>
          </div>
        </div>

        {/* ── Color swatches — each shows its own uploaded image ── */}
        {product.colors?.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Color</p>
              {selectedColor && (
                <span className="text-xs font-semibold text-violet-600 capitalize bg-violet-50 px-2.5 py-0.5 rounded-full border border-violet-100">
                  {selectedColor}
                </span>
              )}
            </div>
            <div className="flex gap-3 flex-wrap">
              {product.colors.map((color, i) => {
                const colorImgId = product.colorImageIds?.[i];
                const isSelected = selectedColorIndex === i;
                return (
                  <button
                    key={color}
                    onClick={() => handleColorSelect(i)}
                    title={color}
                    aria-label={`Select color: ${color}`}
                    className={`relative flex-shrink-0 rounded-2xl overflow-hidden transition-all duration-200 ${
                      isSelected
                        ? 'ring-2 ring-violet-500 ring-offset-2 shadow-lg shadow-violet-200 scale-105'
                        : 'ring-1 ring-gray-200 opacity-70 hover:opacity-100 hover:ring-violet-300'
                    }`}
                    style={{ width: 64, height: 64 }}
                  >
                    {colorImgId ? (
                      <img
                        src={colorImgId}
                        alt={color}
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center text-[11px] font-bold text-gray-500 capitalize text-center px-1 leading-tight">
                        {color}
                      </div>
                    )}
                    {isSelected && (
                      <div className="absolute inset-0 bg-violet-600/25 flex items-end justify-end p-1">
                        <div className="w-5 h-5 rounded-full bg-violet-600 flex items-center justify-center shadow">
                          <Check className="w-3 h-3 text-white" strokeWidth={3} />
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Sizes ── */}
        {product.sizes?.length > 0 && (
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2.5">Size</p>
            <div className="flex gap-2 flex-wrap">
              {product.sizes.map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 border ${
                    selectedSize === size
                      ? 'bg-fuchsia-600 border-fuchsia-600 text-white shadow-md shadow-fuchsia-200'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-fuchsia-300'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="h-px bg-gray-100" />

        {/* ── Shop card ── */}
        {shop && (
          <div
            onClick={() => router.push(`/shop/${shop.id}`)}
            className="flex items-center gap-3 p-3.5 rounded-2xl bg-gray-50 border border-gray-100 hover:border-violet-200 hover:bg-violet-50/50 transition-all duration-200 cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-2xl overflow-hidden bg-violet-100 flex-shrink-0 border border-violet-100">
              <img src={shop.mainPhotoId} alt={shop.shopName} className="w-full h-full object-cover" onError={(e) => { e.target.style.opacity = '0'; }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-gray-400 font-medium">Sold by</p>
              <p className="text-sm font-black text-gray-900 capitalize truncate">{shop.shopName}</p>
              <p className="text-[11px] text-violet-500 font-semibold">{shop.category}</p>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                shop.isOpen ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-rose-50 text-rose-500 border border-rose-200'
              }`}>
                {shop.isOpen ? '● Open' : '● Closed'}
              </span>
              <span className="text-violet-400 text-xs font-bold group-hover:translate-x-0.5 transition-transform">Visit →</span>
            </div>
          </div>
        )}

        {shopClosed && (
          <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-rose-50 border border-rose-200">
            <span className="text-xl">🔴</span>
            <div>
              <p className="text-sm font-black text-rose-700">Shop is currently closed</p>
              <p className="text-xs text-rose-400 font-medium mt-0.5">Orders are not accepted right now. Please check back later.</p>
            </div>
          </div>
        )}

        <div className="h-px bg-gray-100" />

        {/* ── Customer Reviews ── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <p className="text-sm font-black text-gray-900">Customer Reviews</p>
              {avgRating && (
                <span className="text-xs font-black text-amber-500 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-100">
                  ⭐ {avgRating.avg} · {avgRating.count} review{avgRating.count !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>

          {loadingReviews ? (
            <div className="flex items-center gap-2 py-6 justify-center">
              <svg className="animate-spin w-4 h-4 text-violet-400" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              <p className="text-xs text-gray-400 font-semibold">Loading reviews...</p>
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-10 bg-gray-50 rounded-2xl border border-gray-100">
              <div className="text-3xl mb-2">⭐</div>
              <p className="text-sm font-black text-gray-400">No reviews yet</p>
              <p className="text-xs text-gray-300 mt-1">Be the first to review this product!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reviews.map((review, i) => (
                <div key={review.id || i} className="bg-gray-50 rounded-2xl border border-gray-100 p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                      {review.reviewerName?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-black text-gray-900">{review.reviewerName}</p>
                        <div className="text-right flex-shrink-0">
                          <StarDisplay rating={review.rating} />
                          <p className="text-[10px] text-gray-400 mt-0.5">{timeAgo(review.createdAt)}</p>
                        </div>
                      </div>
                      {review.text && (
                        <p className="text-sm text-gray-700 leading-relaxed mt-2 bg-white rounded-xl px-3 py-2 border border-gray-100">
                          "{review.text}"
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div className="fixed bottom-0 left-0 right-0 px-4 py-3 bg-white border-t border-gray-100">
        {shopClosed ? (
          <div className="w-full py-4 rounded-2xl bg-rose-50 border-2 border-rose-200 flex items-center justify-center gap-2">
            <span className="text-base">🔴</span>
            <span className="text-sm font-black text-rose-500">Shop Closed — Orders Not Accepted</span>
          </div>
        ) : (
          <div className="flex gap-3">
            {cartQty === 0 ? (
              <button
                onClick={handleAddToCart}
                className={`flex-1 py-4 rounded-2xl text-sm font-black border-2 transition-all duration-300 ${
                  justAdded
                    ? 'border-emerald-400 text-emerald-600 bg-emerald-50'
                    : 'border-violet-200 text-violet-600 bg-violet-50 hover:bg-violet-100 hover:border-violet-300'
                }`}
              >
                {justAdded ? '✓ Added!' : '🛒 Add to Cart'}
              </button>
            ) : (
              <div className="flex-1 flex items-center justify-between py-2 px-4 rounded-2xl border-2 border-violet-300 bg-violet-50">
                <button
                  onClick={() => { if (cartQty === 1) removeFromCart(cartKey); else updateQuantity(cartKey, -1); }}
                  className="w-9 h-9 rounded-xl bg-white border border-violet-200 text-violet-600 font-black text-lg flex items-center justify-center hover:bg-violet-100 active:scale-90 transition-all shadow-sm"
                >
                  {cartQty === 1 ? '🗑' : '−'}
                </button>
                <div className="text-center">
                  {/* Show the active image (color or main) as a mini preview */}
                  {cartImageId && (
                    <img
                      src={cartImageId}
                      alt="variant"
                      className="w-8 h-8 rounded-lg object-cover mx-auto mb-0.5 border border-violet-200"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  )}
                  <p className="text-violet-700 font-black text-lg leading-none">{cartQty}</p>
                  <p className="text-violet-400 text-[10px] font-semibold">in cart</p>
                </div>
                <button
                  onClick={handleIncrease}
                  className="w-9 h-9 rounded-xl bg-violet-600 text-white font-black text-lg flex items-center justify-center hover:bg-violet-700 active:scale-90 transition-all shadow-md shadow-violet-200"
                >+</button>
              </div>
            )}

            <button
              onClick={handleWishlistToggle}
              className={`flex-1 py-4 rounded-2xl text-sm font-black flex items-center justify-center gap-2 transition-all duration-200 border-2 ${
                wishlisted
                  ? 'bg-rose-500 border-rose-500 text-white shadow-lg shadow-rose-200 hover:bg-rose-600'
                  : 'bg-white border-rose-200 text-rose-500 hover:bg-rose-50 hover:border-rose-300'
              }`}
            >
              <Heart className={`w-4 h-4 transition-all duration-200 ${wishlisted ? 'fill-white text-white' : 'text-rose-500'} ${wishlistPulse ? 'scale-125' : 'scale-100'}`} />
              {wishlisted ? 'Wishlisted' : 'Wishlist'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductPage;