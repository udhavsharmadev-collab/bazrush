"use client";

import { useState, useEffect, useRef } from 'react';
import { Star, Store, Package } from 'lucide-react';

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

const StarDisplay = ({ rating, size = 'sm' }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((s) => (
      <Star key={s} className={`${size === 'sm' ? 'w-3.5 h-3.5' : 'w-5 h-5'} ${s <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} strokeWidth={1.5} />
    ))}
  </div>
);

const ReviewsTab = ({ seller }) => {
  const [shops, setShops] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedShopId, setSelectedShopId] = useState('all');
  const [selectedType, setSelectedType] = useState('all');

  // Prevent re-fetching when parent re-renders with same seller
  const loadedForPhone = useRef(null);

  useEffect(() => {
    if (!seller?.phoneNumber) return;
    if (loadedForPhone.current === seller.phoneNumber) return; // already loaded
    loadedForPhone.current = seller.phoneNumber;
    loadData();
  }, [seller?.phoneNumber]);

  const loadData = async () => {
    setLoading(true);
    try {
      const sellerRes = await fetch(`/api/sellers?phoneNumber=${encodeURIComponent(seller.phoneNumber)}`);
      const sellerData = await sellerRes.json();
      const sellerShops = sellerData?.seller?.shops || [];
      setShops(sellerShops);
      const shopIds = new Set(sellerShops.map(s => s.id));

      const usersRes = await fetch('/api/users');
      const users = await usersRes.json();
      const allReviews = [];
      for (const [, userData] of Object.entries(users)) {
        for (const review of (userData.reviews || [])) {
          if (shopIds.has(review.shopId)) {
            allReviews.push({
              ...review,
              type: review.type || 'shop',
              reviewerName: review.reviewerName || userData.name || '',
            });
          }
        }
      }
      allReviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setReviews(allReviews);
    } catch (err) {
      console.error('Failed to load reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  // Manual refresh — bypasses the ref guard
  const handleRefresh = () => {
    loadedForPhone.current = null;
    loadData();
  };

  const filtered = reviews.filter(r => {
    const shopMatch = selectedShopId === 'all' || r.shopId === selectedShopId;
    const typeMatch = selectedType === 'all' || r.type === selectedType;
    return shopMatch && typeMatch;
  });

  const avgRating = filtered.length > 0
    ? (filtered.reduce((s, r) => s + r.rating, 0) / filtered.length).toFixed(1)
    : '—';

  const ratingCounts = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: filtered.filter(r => r.rating === star).length,
  }));

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-32 gap-4">
      <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
      <p className="text-gray-400 font-semibold">Loading reviews...</p>
    </div>
  );

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent">Customer Reviews</h2>
        <button onClick={handleRefresh} className="px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-600 rounded-xl font-bold text-sm border border-purple-200 transition-all">🔄 Refresh</button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-lg border border-purple-100 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Type</span>
          <div className="flex gap-1.5">
            {[
              { id: 'all', label: 'All', emoji: '⭐' },
              { id: 'shop', label: 'Shop', emoji: '🏪' },
              { id: 'product', label: 'Product', emoji: '📦' },
            ].map(t => (
              <button key={t.id} onClick={() => setSelectedType(t.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${selectedType === t.id ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-md' : 'bg-purple-50 text-purple-600 hover:bg-purple-100 border border-purple-200'}`}>
                {t.emoji} {t.label}
              </button>
            ))}
          </div>
        </div>

        {shops.length > 1 && (
          <>
            <div className="w-px h-6 bg-gray-200 hidden md:block" />
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Shop</span>
              <div className="flex gap-1.5 flex-wrap">
                <button onClick={() => setSelectedShopId('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${selectedShopId === 'all' ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-md' : 'bg-purple-50 text-purple-600 hover:bg-purple-100 border border-purple-200'}`}>
                  All
                </button>
                {shops.map(shop => (
                  <button key={shop.id} onClick={() => setSelectedShopId(shop.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all capitalize ${selectedShopId === shop.id ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-md' : 'bg-purple-50 text-purple-600 hover:bg-purple-100 border border-purple-200'}`}>
                    {shop.shopName}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Stats */}
      {filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-purple-100 flex items-center gap-6">
            <div className="text-center">
              <p className="text-5xl font-black bg-gradient-to-r from-purple-600 to-fuchsia-500 bg-clip-text text-transparent">{avgRating}</p>
              <StarDisplay rating={Math.round(parseFloat(avgRating))} size="md" />
              <p className="text-xs text-gray-400 font-semibold mt-1">{filtered.length} review{filtered.length !== 1 ? 's' : ''}</p>
            </div>
            <div className="flex-1 space-y-1.5">
              {ratingCounts.map(({ star, count }) => {
                const pct = filtered.length > 0 ? (count / filtered.length) * 100 : 0;
                return (
                  <div key={star} className="flex items-center gap-2">
                    <span className="text-[11px] font-black text-gray-400 w-3">{star}</span>
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400 flex-shrink-0" strokeWidth={1} />
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-amber-400 to-amber-300 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[10px] font-bold text-gray-400 w-4">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Shop Reviews', value: reviews.filter(r => r.type === 'shop').length, emoji: '🏪', color: 'text-violet-600' },
              { label: 'Product Reviews', value: reviews.filter(r => r.type === 'product').length, emoji: '📦', color: 'text-amber-600' },
              { label: 'This Month', value: filtered.filter(r => new Date(r.createdAt).getMonth() === new Date().getMonth()).length, emoji: '📅', color: 'text-blue-600' },
              { label: 'Avg Score', value: avgRating, emoji: '⭐', color: 'text-fuchsia-600' },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-2xl p-4 shadow-lg border border-purple-100 text-center">
                <p className="text-2xl mb-1">{s.emoji}</p>
                <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
                <p className="text-[10px] text-gray-400 font-semibold">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reviews feed */}
      {filtered.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-2xl shadow-lg border border-purple-100">
          <div className="text-5xl mb-4">⭐</div>
          <h3 className="text-xl font-black text-gray-700 mb-2">No reviews yet</h3>
          <p className="text-gray-400 text-sm">Reviews from delivered orders will appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((review, i) => {
            const isShop = review.type === 'shop';
            return (
              <div key={review.id || i} className="bg-white rounded-2xl shadow-lg border border-purple-100 overflow-hidden">
                <div className={`h-1 ${isShop ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500' : 'bg-gradient-to-r from-amber-400 to-orange-400'}`} />
                <div className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center text-white font-black text-base flex-shrink-0">
                      {review.reviewerName?.[0]?.toUpperCase() || review.reviewerPhone?.replace('+91', '')?.[0] || '?'}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-black text-gray-900 text-sm">{review.reviewerName || 'Customer'}</p>
                          <p className="text-[10px] text-violet-500 font-bold">{review.reviewerPhone}</p>
                          <p className="text-[10px] text-gray-400 font-medium">{timeAgo(review.createdAt)}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <StarDisplay rating={review.rating} />
                          <span className={`inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full mt-1 ${
                            isShop ? 'bg-violet-50 text-violet-600 border border-violet-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
                          }`}>
                            {isShop ? <><Store className="w-2.5 h-2.5" /> Shop</> : <><Package className="w-2.5 h-2.5" /> Product</>}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mt-2 mb-2">
                        <div className="w-6 h-6 rounded-lg overflow-hidden bg-gray-50 border border-gray-100 flex-shrink-0">
                          <img src={`/images/${isShop ? review.shopPhoto : review.productImage}`} alt="" className="w-full h-full object-cover" onError={(e) => { e.target.style.opacity = '0'; }} />
                        </div>
                        <p className="text-[11px] font-black text-gray-600 capitalize">
                          {isShop ? review.shopName : review.productName}
                          {!isShop && <span className="text-gray-300 font-medium"> · {review.shopName}</span>}
                        </p>
                      </div>

                      {review.text && (
                        <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-xl px-4 py-2.5 border border-gray-100">
                          "{review.text}"
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ReviewsTab;