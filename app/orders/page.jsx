'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { MapPin, Clock, ShoppingBag, ChevronDown, ChevronUp, Store, Star } from 'lucide-react';

const STATUS_CONFIG = {
  confirmed:        { label: 'Confirmed',       emoji: '✅', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', bar: 1 },
  preparing:        { label: 'Preparing',        emoji: '👨‍🍳', color: 'text-amber-600',  bg: 'bg-amber-50',  border: 'border-amber-200',  bar: 2 },
  out_for_delivery: { label: 'Out for Delivery', emoji: '🛵', color: 'text-blue-600',   bg: 'bg-blue-50',   border: 'border-blue-200',   bar: 3 },
  delivered:        { label: 'Delivered',        emoji: '🎉', color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-200', bar: 4 },
};

const PAYMENT_LABELS = { cod: '💵 Cash on Delivery', upi: '📲 UPI / QR', card: '💳 Card' };

function shopId(shop)    { return shop?.shopId   || shop?.id   || ''; }
function shopName(shop)  { return shop?.shopName || shop?.name || 'Shop'; }
function shopPhoto(shop) { return shop?.shopPhoto || shop?.photo || ''; }

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs  = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  if (mins < 1)  return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (hrs  < 24) return `${hrs}h ago`;
  return `${days}d ago`;
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

const StatusBar = ({ status }) => {
  const steps   = ['confirmed', 'preparing', 'out_for_delivery', 'delivered'];
  const current = STATUS_CONFIG[status]?.bar || 1;
  return (
    <div className="flex items-center gap-1 mt-3">
      {steps.map((step, i) => (
        <div key={step} className="flex-1">
          <div className={`h-1.5 rounded-full transition-all duration-500 ${
            i < current
              ? (i === current - 1 ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500' : 'bg-violet-300')
              : 'bg-gray-100'
          }`} />
        </div>
      ))}
    </div>
  );
};

const StarPicker = ({ value, onChange }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map((star) => (
      <button key={star} onClick={() => onChange(star)} className="transition-transform hover:scale-110 active:scale-95">
        <Star className={`w-7 h-7 ${star <= value ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} strokeWidth={1.5} />
      </button>
    ))}
  </div>
);

const ReviewModal = ({ target, order, userPhone, userName, onClose, onSubmitted }) => {
  const [rating, setRating]         = useState(0);
  const [text, setText]             = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState('');
  const isShop = target.type === 'shop';

  const handleSubmit = async () => {
    if (rating === 0) { setError('Please select a rating'); return; }
    setSubmitting(true); setError('');
    try {
      const review = {
        id: `REV-${Date.now()}`,
        type: target.type,
        orderId: order.id,
        shopId:    target.shopId,
        shopName:  target.shopName,
        shopPhoto: target.shopPhoto,
        ...(isShop ? {} : {
          productId:    target.productId,
          productName:  target.productName,
          productImage: target.productImage,
        }),
        reviewerName:  userName,
        reviewerPhone: userPhone,
        rating,
        text: text.trim(),
        createdAt: new Date().toISOString(),
      };
      const res  = await fetch('/api/reviews', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: userPhone, review }) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to submit'); return; }
      onSubmitted(target.type === 'shop'
        ? `shop-${order.id}-${target.shopId}`
        : `product-${order.id}-${target.productId}`
      );
    } catch { setError('Something went wrong'); }
    finally   { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden" style={{ animation: 'slideUp 0.3s ease' }}>
        <div className={`h-1 ${isShop ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500' : 'bg-gradient-to-r from-amber-400 to-orange-400'}`} />
        <div className="p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 flex-shrink-0 flex items-center justify-center">
              <img src={isShop ? target.shopPhoto : target.productImage} alt="" className="w-full h-full object-cover" onError={(e) => { e.target.style.opacity = '0'; }} />
            </div>
            <div className="flex-1">
              <p className={`text-[10px] font-black uppercase tracking-widest ${isShop ? 'text-violet-400' : 'text-amber-500'}`}>
                {isShop ? '🏪 Rate Shop' : '📦 Rate Product'}
              </p>
              <p className="text-sm font-black text-gray-900 capitalize leading-tight">
                {isShop ? target.shopName : target.productName}
              </p>
              {!isShop && <p className="text-[10px] text-gray-400 capitalize">{target.shopName}</p>}
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-all">✕</button>
          </div>
          <div className="mb-4">
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Your Rating</p>
            <StarPicker value={rating} onChange={setRating} />
            {rating > 0 && <p className="text-xs text-violet-500 font-bold mt-1">{['', 'Poor 😕', 'Fair 😐', 'Good 🙂', 'Great 😊', 'Excellent 🤩'][rating]}</p>}
          </div>
          <div className="mb-5">
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Your Review <span className="normal-case text-gray-300">(optional)</span></p>
            <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder={isShop ? 'Share your experience with this shop...' : 'How was this product?'} rows={3}
              className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm font-medium text-gray-800 bg-gray-50 outline-none resize-none focus:border-violet-400 focus:bg-white focus:shadow-md focus:shadow-violet-100 transition-all" />
          </div>
          {error && <p className="text-xs text-rose-500 font-bold mb-3">{error}</p>}
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-3 rounded-2xl border-2 border-gray-200 text-gray-500 font-black text-sm hover:bg-gray-50 transition-all">Cancel</button>
            <button onClick={handleSubmit} disabled={submitting || rating === 0}
              className={`flex-1 py-3 rounded-2xl font-black text-sm transition-all ${submitting || rating === 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : isShop ? 'bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white shadow-lg shadow-violet-200 hover:scale-[1.02] active:scale-95' : 'bg-gradient-to-r from-amber-400 to-orange-400 text-white shadow-lg shadow-amber-200 hover:scale-[1.02] active:scale-95'}`}>
              {submitting ? 'Submitting...' : 'Submit ⭐'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ShopGroup = ({ shopData }) => {
  const [open, setOpen] = useState(false);
  const name  = shopName(shopData);
  const photo = shopPhoto(shopData);
  return (
    <div className="border border-gray-100 rounded-2xl overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-violet-50 transition-colors">
        <div className="w-8 h-8 rounded-xl overflow-hidden bg-violet-100 border border-violet-200 flex-shrink-0 flex items-center justify-center">
          {photo ? <img src={photo} alt="" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} /> : <Store className="w-4 h-4 text-violet-400" />}
        </div>
        <div className="flex-1 text-left">
          <p className="text-sm font-black text-gray-800 capitalize">{name}</p>
          <p className="text-[10px] text-gray-400 font-medium">{shopData.items.length} item{shopData.items.length > 1 ? 's' : ''} · ₹{shopData.subtotal}</p>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="flex -space-x-1.5">
            {shopData.items.slice(0, 3).map((item, i) => (
              <div key={i} className="w-6 h-6 rounded-lg border border-white bg-violet-50 overflow-hidden">
                <img 
src={item.imageId} alt="" className="w-full h-full object-contain p-0.5" onError={(e) => { e.target.style.opacity = '0'; }} />
              </div>
            ))}
          </div>
          {open ? <ChevronUp className="w-3.5 h-3.5 text-violet-400 ml-1" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-300 ml-1" />}
        </div>
      </button>
      {open && (
        <div className="px-4 py-3 space-y-3 bg-white">
          {shopData.items.map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-50 to-fuchsia-50 border border-violet-100 flex-shrink-0 overflow-hidden flex items-center justify-center">
                <img 
src={item.imageId} alt={item.name} className="w-full h-full object-contain p-1" onError={(e) => { e.target.style.opacity = '0.15'; }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-gray-800 capitalize truncate">{item.name}</p>
                <div className="flex gap-1.5 mt-0.5 flex-wrap">
                  {item.selectedColor && item.selectedColor !== 'default' && <span className="text-[9px] font-bold text-violet-500 bg-violet-50 px-1.5 py-0.5 rounded-full capitalize border border-violet-100">{item.selectedColor}</span>}
                  {item.selectedSize  && item.selectedSize  !== 'default' && <span className="text-[9px] font-bold text-fuchsia-500 bg-fuchsia-50 px-1.5 py-0.5 rounded-full border border-fuchsia-100">{item.selectedSize}</span>}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-black text-violet-600">₹{item.price * item.quantity}</p>
                <p className="text-[10px] text-gray-400 font-semibold">×{item.quantity}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const OrderCard = ({ order, userPhone, userName, reviewedKeys, onReviewSubmitted }) => {
  const [expanded, setExpanded]       = useState(false);
  const [reviewModal, setReviewModal] = useState(null);
  const [eta, setEta]                 = useState(null);

  const statusCfg        = STATUS_CONFIG[order.status] || STATUS_CONFIG.confirmed;
  const isDelivered      = order.status === 'delivered';
  const isOutForDelivery = order.status === 'out_for_delivery';

  const partnerName  = order.assignedPartnerName || '';
  const partnerPhone = order.assignedPartner     || '';
  const otp          = order.deliveryOtp         || '';

  const shops = (order.shops || []).map(s => ({
    ...s,
    shopId:    shopId(s),
    shopName:  shopName(s),
    shopPhoto: shopPhoto(s),
  }));

  // ETA via OSRM — only when out for delivery and we have coords
  useEffect(() => {
    if (!isOutForDelivery) return;
    let cancelled = false;
    const calcEta = async () => {
      try {
        const partnerRes  = await fetch(`/api/delivery-partners?phoneNumber=${encodeURIComponent(partnerPhone)}`);
        const partnerData = await partnerRes.json();
        const riderLat = partnerData?.partner?.lat;
        const riderLng = partnerData?.partner?.lng;
        const custLat  = order.customer?.lat;
        const custLng  = order.customer?.lng;
        if (!riderLat || !custLat) { setEta('~10 min'); return; }
        const osrmRes  = await fetch(`https://router.project-osrm.org/route/v1/driving/${riderLng},${riderLat};${custLng},${custLat}?overview=false`);
        const osrmData = await osrmRes.json();
        const seconds  = osrmData?.routes?.[0]?.duration;
        const meters   = osrmData?.routes?.[0]?.distance;
        if (!cancelled && seconds) {
          const mins = Math.max(1, Math.round(seconds / 60));
          const dist = meters < 1000 ? `${Math.round(meters)}m` : `${(meters / 1000).toFixed(1)}km`;
          setEta(`~${mins} min · ${dist}`);
        } else if (!cancelled) {
          setEta('~10 min');
        }
      } catch { if (!cancelled) setEta('~10 min'); }
    };
    calcEta();
    return () => { cancelled = true; };
  }, [isOutForDelivery, partnerPhone, order.customer?.lat, order.customer?.lng]);

  const ETA_STATIC = {
    confirmed: { label: '~30 min', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
    preparing:  { label: '~20 min', color: 'text-amber-600',  bg: 'bg-amber-50',   border: 'border-amber-200'   },
  };
  const etaStatic = ETA_STATIC[order.status];

  return (
    <>
      {reviewModal && (
        <ReviewModal target={reviewModal} order={order} userPhone={userPhone} userName={userName}
          onClose={() => setReviewModal(null)}
          onSubmitted={(key) => { setReviewModal(null); onReviewSubmitted(key); }}
        />
      )}

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden" style={{ animation: 'slideUp 0.4s ease both' }}>
        <div className="h-1 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-400" />
        <div className="p-5">

          <div className="flex items-start justify-between gap-2 mb-1">
            <div>
              <p className="text-[10px] font-black text-gray-300 tracking-widest uppercase mb-0.5">Order ID</p>
              <p className="text-xs font-black text-gray-700 font-mono">{order.id}</p>
            </div>
            <span className={`text-[10px] font-black px-3 py-1.5 rounded-full border ${statusCfg.bg} ${statusCfg.color} ${statusCfg.border} flex items-center gap-1`}>
              {statusCfg.emoji} {statusCfg.label}
            </span>
          </div>

          <div className="flex items-center gap-1.5 mt-2 mb-3">
            <Clock className="w-3 h-3 text-gray-300" />
            <p className="text-[11px] text-gray-400 font-medium">{formatDate(order.placedAt)} · {timeAgo(order.placedAt)}</p>
          </div>

          <StatusBar status={order.status} />

          {etaStatic && (
            <div className={`mt-3 flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border ${etaStatic.bg} ${etaStatic.border}`}>
              <span className="text-lg">⏱️</span>
              <div className="flex-1">
                <p className={`text-xs font-black ${etaStatic.color}`}>Estimated Delivery</p>
                <p className={`text-[11px] font-bold ${etaStatic.color} opacity-80`}>{etaStatic.label}</p>
              </div>
            </div>
          )}

          {isOutForDelivery && (
            <div className="mt-4 space-y-3">

              {/* Rider card */}
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-4 flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center text-2xl flex-shrink-0">🛵</div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black text-blue-100 uppercase tracking-widest">Your Rider</p>
                  <p className="text-sm font-black text-white truncate">{partnerName || 'Delivery Partner'}</p>
                  <p className="text-[10px] text-blue-200 font-medium">
                    {eta ? `📍 ${eta} away` : 'Calculating ETA...'}
                  </p>
                </div>
                {partnerPhone && (
                  <a href={`tel:${partnerPhone}`}
                    className="flex-shrink-0 flex flex-col items-center justify-center w-14 h-14 bg-white rounded-2xl shadow-lg shadow-blue-800/20 hover:scale-105 active:scale-95 transition-all">
                    <span className="text-xl">📞</span>
                    <span className="text-[9px] font-black text-blue-600 mt-0.5">Call</span>
                  </a>
                )}
              </div>

              {/* OTP box */}
              {otp && (
                <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">🔐</span>
                    <div>
                      <p className="text-xs font-black text-blue-700">Delivery OTP</p>
                      <p className="text-[10px] text-blue-400">Share this code with your delivery partner</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-center bg-white border-2 border-blue-300 rounded-xl py-3 mt-1">
                    <p className="text-4xl font-black tracking-[0.4em] text-blue-700 pl-4">{otp}</p>
                  </div>
                </div>
              )}

              {/* Live ETA card */}
              <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border bg-blue-50 border-blue-200">
                <span className="text-lg">⏱️</span>
                <div className="flex-1">
                  <p className="text-xs font-black text-blue-600">Live ETA</p>
                  <p className="text-[11px] font-bold text-blue-500 opacity-80">{eta || 'Calculating...'}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-1.5 mt-4 flex-wrap">
            {shops.map((shop) => (
              <div key={shop.shopId} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-violet-50 border border-violet-100">
                <div className="w-4 h-4 rounded-md overflow-hidden bg-white flex-shrink-0">
                  {shop.shopPhoto && <img src={shop.shopPhoto} alt="" className="w-full h-full object-cover" onError={(e) => { e.target.style.opacity = '0'; }} />}
                </div>
                <p className="text-[10px] font-black text-violet-600 capitalize">{shop.shopName}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {shops.flatMap(s => s.items || []).slice(0, 3).map((item, i) => (
                  <div key={i} className="w-9 h-9 rounded-2xl border-2 border-white bg-gradient-to-br from-violet-50 to-fuchsia-50 overflow-hidden shadow-sm">
                    <img 
src={item.imageId} alt="" className="w-full h-full object-contain p-1" onError={(e) => { e.target.style.opacity = '0'; }} />
                  </div>
                ))}
                {shops.flatMap(s => s.items || []).length > 3 && (
                  <div className="w-9 h-9 rounded-2xl border-2 border-white bg-gray-100 flex items-center justify-center shadow-sm">
                    <span className="text-[9px] font-black text-gray-500">+{shops.flatMap(s => s.items || []).length - 3}</span>
                  </div>
                )}
              </div>
              <p className="text-[11px] text-gray-400 font-semibold">{shops.flatMap(s => s.items || []).length} items</p>
            </div>
            <div className="text-right">
              <p className="text-base font-black bg-gradient-to-r from-violet-600 to-fuchsia-500 bg-clip-text text-transparent">₹{order.totalPrice}</p>
              <p className="text-[9px] text-gray-300 font-medium">{PAYMENT_LABELS[order.paymentMethod]}</p>
            </div>
          </div>

          <button onClick={() => setExpanded(!expanded)} className="w-full mt-4 flex items-center justify-center gap-1.5 text-[11px] font-black text-violet-500 hover:text-violet-700 transition-colors py-1">
            {expanded ? <><ChevronUp className="w-3.5 h-3.5" /> Hide Details</> : <><ChevronDown className="w-3.5 h-3.5" /> View Details</>}
          </button>

          {expanded && (
            <div className="mt-3 pt-4 border-t border-gray-100 space-y-4">
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2.5">Items by Shop</p>
                <div className="space-y-2">
                  {shops.map((shop) => <ShopGroup key={shop.shopId} shopData={shop} />)}
                </div>
              </div>

              <div className="bg-gray-50 rounded-2xl p-3.5 space-y-1.5">
                {shops.map((shop) => (
                  <div key={shop.shopId} className="flex justify-between text-sm">
                    <span className="text-gray-400 font-medium capitalize truncate max-w-[60%]">{shop.shopName}</span>
                    <span className="font-black text-gray-700">₹{shop.subtotal}</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm">
  <span className="text-gray-400 font-medium">Delivery</span>
  <span className="font-black text-gray-700">
    {order.deliveryFee === 0 || !order.deliveryFee
      ? <span className="text-emerald-500">FREE</span>
      : `₹${order.deliveryFee}`}
  </span>
</div>
                <div className="h-px bg-gray-200 my-1" />
                <div className="flex justify-between">
                  <span className="font-black text-gray-800 text-sm">Total Paid</span>
                  <span className="font-black bg-gradient-to-r from-violet-600 to-fuchsia-500 bg-clip-text text-transparent">₹{order.totalPrice}</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-violet-600" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Delivery Address</p>
                  <p className="text-sm font-semibold text-gray-700 leading-relaxed">{order.customer?.address}</p>
                </div>
              </div>

              {isDelivered && (
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Rate Your Experience</p>
                  <div className="space-y-3">
                    {shops.map((shop) => {
                      const sKey        = `shop-${order.id}-${shop.shopId}`;
                      const shopReviewed = reviewedKeys[sKey];
                      return (
                        <div key={shop.shopId} className="rounded-2xl border border-violet-100 overflow-hidden">
                          <div className="flex items-center justify-between px-4 py-3 bg-violet-50">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-xl overflow-hidden bg-white border border-violet-100 flex-shrink-0">
                                {shop.shopPhoto && <img src={shop.shopPhoto} alt="" className="w-full h-full object-cover" onError={(e) => { e.target.style.opacity = '0'; }} />}
                              </div>
                              <div>
                                <p className="text-xs font-black text-gray-800 capitalize">{shop.shopName}</p>
                                <p className="text-[9px] text-violet-400 font-bold">🏪 Shop Review</p>
                              </div>
                            </div>
                            {shopReviewed ? (
                              <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">✅ Done</span>
                            ) : (
                              <button onClick={() => setReviewModal({ type: 'shop', shopId: shop.shopId, shopName: shop.shopName, shopPhoto: shop.shopPhoto })}
                                className="flex items-center gap-1 text-[10px] font-black text-violet-700 bg-white hover:bg-violet-100 px-2.5 py-1 rounded-full border border-violet-200 transition-all">
                                <Star className="w-3 h-3 fill-violet-400 text-violet-400" /> Rate
                              </button>
                            )}
                          </div>
                          {(shop.items || []).map((item) => {
                            const productId       = item.key?.split('-')[0] || item.productId;
                            const productKey      = `product-${order.id}-${productId}`;
                            const productReviewed = reviewedKeys[productKey];
                            return (
                              <div key={item.key || item.productId} className="flex items-center justify-between px-4 py-2.5 bg-white border-t border-violet-50">
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-lg overflow-hidden bg-amber-50 border border-amber-100 flex-shrink-0">
                                    <img 
src={item.imageId} alt="" className="w-full h-full object-contain p-0.5" onError={(e) => { e.target.style.opacity = '0'; }} />
                                  </div>
                                  <div>
                                    <p className="text-xs font-black text-gray-700 capitalize truncate max-w-[140px]">{item.name}</p>
                                    <p className="text-[9px] text-amber-500 font-bold">📦 Product Review</p>
                                  </div>
                                </div>
                                {productReviewed ? (
                                  <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">✅ Done</span>
                                ) : (
                                  <button onClick={() => setReviewModal({ type: 'product', shopId: shop.shopId, shopName: shop.shopName, shopPhoto: shop.shopPhoto, productId, productName: item.name, productImage: item.imageId })}
                                    className="flex items-center gap-1 text-[10px] font-black text-amber-700 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-full border border-amber-200 transition-all">
                                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> Rate
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────
const OrdersPage = () => {
  const router                    = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [orders, setOrders]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [reviewedKeys, setReviewedKeys] = useState({});
  const ordersRef                 = useRef([]);
  const pollRef                   = useRef(null);

  const fetchOrders = async () => {
    try {
      const res  = await fetch(`/api/orders?phone=${encodeURIComponent(user.phone)}`);
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch { return null; }
  };

  const fetchExistingReviews = async () => {
    try {
      const res  = await fetch(`/api/reviews?phone=${encodeURIComponent(user.phone)}`);
      const data = await res.json();
      const myReviews = Array.isArray(data) ? data : (data.reviews || []);
      const map = {};
      for (const r of myReviews) {
        if      (r.type === 'shop')    map[`shop-${r.orderId}-${r.shopId}`]       = true;
        else if (r.type === 'product') map[`product-${r.orderId}-${r.productId}`] = true;
        else                           map[`shop-${r.orderId}-${r.shopId}`]       = true;
      }
      setReviewedKeys(map);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    if (!isAuthenticated || !user?.phone) { setLoading(false); return; }

    // Initial load
    fetchOrders().then((data) => {
      if (data) { ordersRef.current = data; setOrders(data); }
      setLoading(false);
    });
    fetchExistingReviews();

    // FIX 3 — Poll every 5s. Always replace orders that are in active/live
    // states so rider name, OTP, call button never get stuck on stale data.
    pollRef.current = setInterval(async () => {
      const fresh = await fetchOrders();
      if (!Array.isArray(fresh)) return;

      setOrders(prev => {
        const prevMap = new Map(prev.map(o => [o.id, o]));
        let changed   = false;
        const next    = fresh.map(fo => {
          const existing = prevMap.get(fo.id);
          if (!existing) { changed = true; return fo; }

          // FIX 3 — Always take fresh server data for orders in active delivery
          // states so the customer sees rider name / OTP / call button immediately
          if (fo.status === 'out_for_delivery' || fo.status === 'preparing') {
            if (
              existing.assignedPartner     !== fo.assignedPartner     ||
              existing.assignedPartnerName !== fo.assignedPartnerName ||
              existing.deliveryOtp         !== fo.deliveryOtp         ||
              existing.status              !== fo.status
            ) {
              changed = true;
              return fo;
            }
            return existing;
          }

          // For all other statuses keep the existing smart-merge logic
          if (
            existing.status      !== fo.status      ||
            existing.deliveredAt !== fo.deliveredAt
          ) {
            changed = true;
            return fo;
          }
          return existing;
        });
        return changed ? next : prev;
      });
    }, 5000);

    return () => clearInterval(pollRef.current);
  }, [isAuthenticated, user?.phone]);

  const handleReviewSubmitted = (key) => setReviewedKeys(prev => ({ ...prev, [key]: true }));

 if (!isAuthenticated) return (
  <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 text-center">
    <div className="text-6xl mb-4">🔐</div>
    <h2 className="text-xl font-black text-gray-900 mb-2">Login to see your orders</h2>
    <p className="text-gray-400 text-sm mb-8">Your order history is saved to your account</p>
  </div>
);

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <style>{`@keyframes slideUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }`}</style>

      <div className="sticky top-0 z-50 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="w-9 h-9 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-700 hover:bg-gray-100 transition-all text-lg">←</button>
        <h1 className="text-gray-900 font-black text-base flex-1">My Orders</h1>
        {orders.length > 0 && (
          <span className="text-[10px] font-black px-3 py-1 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white shadow-md shadow-violet-200">
            {orders.length} {orders.length === 1 ? 'order' : 'orders'}
          </span>
        )}
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center pt-32 gap-3">
          <svg className="animate-spin w-8 h-8 text-violet-400" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
          <p className="text-sm font-black text-gray-400">Loading your orders...</p>
        </div>
      )}

      {!loading && orders.length === 0 && (
        <div className="flex flex-col items-center justify-center pt-28 px-6 text-center">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-violet-100 to-fuchsia-100 flex items-center justify-center mb-5 border border-violet-200">
            <ShoppingBag className="w-10 h-10 text-violet-400" />
          </div>
          <h2 className="text-xl font-black text-gray-900 mb-2">No orders yet</h2>
          <p className="text-gray-400 text-sm mb-8 leading-relaxed">Your placed orders will appear here.<br />Start shopping to see them!</p>
          <button onClick={() => router.push('/')} className="bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white px-8 py-3.5 rounded-2xl font-black text-sm shadow-lg shadow-violet-200 hover:scale-[1.02] active:scale-95 transition-all">Shop Now ⚡</button>
        </div>
      )}

      {!loading && orders.length > 0 && (
        <div className="px-4 pt-4 space-y-3">
          {orders.map((order, i) => (
            <div key={order.id} style={{ animationDelay: `${i * 60}ms` }}>
              <OrderCard
                order={order}
                userPhone={user.phone}
                userName={user.profile?.name}
                reviewedKeys={reviewedKeys}
                onReviewSubmitted={handleReviewSubmitted}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrdersPage;