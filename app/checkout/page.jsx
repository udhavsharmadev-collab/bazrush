'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { MapPin, User, Phone, Mail, ShoppingBag, Tag, X, Check } from 'lucide-react';
import PhoneAuthModal from '../components/auth/PhoneAuthModal';

const PLATFORM_FEE = 0;

function getDeliveryFee(km) {
  if (km <= 2) return 30;
  if (km <= 4) return 40;
  if (km <= 6) return 50;
  return 50;
}

async function geocodeAddress(address) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
      { headers: { 'Accept-Language': 'en' } }
    );
    const data = await res.json();
    if (data?.[0]) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch {}
  return null;
}

async function getRoadDistanceKm(fromLat, fromLng, toLat, toLng) {
  try {
    const res = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=false`
    );
    const data = await res.json();
    if (data?.routes?.[0]) return data.routes[0].distance / 1000;
  } catch {}
  return null;
}

async function fetchShopById(shopId) {
  try {
    const res = await fetch(`/api/sellers?shopId=${encodeURIComponent(shopId)}`);
    const data = await res.json();
    return data?.shop || null;
  } catch { return null; }
}

async function fetchCouponsBySellerPhone(sellerPhone) {
  try {
    const res = await fetch(`/api/coupons?sellerPhone=${encodeURIComponent(sellerPhone)}`);
    const data = await res.json();
    return data?.coupons || [];
  } catch { return []; }
}

async function fetchProductById(productId) {
  try {
    const res = await fetch('/api/products');
    const data = await res.json();
    return (data?.products || []).find(p => p.id === productId) || null;
  } catch { return null; }
}

function groupByShop(cartItems) {
  const groups = {};
  for (const item of cartItems) {
    const shopId = item.product?.shopId || 'unknown';
    if (!groups[shopId]) groups[shopId] = [];
    groups[shopId].push({ ...item, shopId });
  }
  return groups;
}

// ── Success screen ────────────────────────────────────────────────────────────
const OrderSuccessScreen = ({ orderId, address, grandTotal, onGoOrders, onGoHome }) => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setStep(1), 300);
    const t2 = setTimeout(() => setStep(2), 900);
    const t3 = setTimeout(() => setStep(3), 1300);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 text-center overflow-hidden">
      <style>{`
        @keyframes circleGrow {
          0%   { transform: scale(0); opacity: 0; }
          60%  { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes confettiBurst {
          0%   { transform: translateY(0) scale(1); opacity: 1; }
          100% { transform: translateY(-80px) scale(0.3); opacity: 0; }
        }
        .confetti-dot {
          position: absolute; width: 8px; height: 8px;
          border-radius: 50%;
          animation: confettiBurst 0.9s ease-out forwards;
        }
      `}</style>

      {step >= 1 && (
        <div className="absolute pointer-events-none" style={{ top: '38%', left: '50%', transform: 'translate(-50%,-50%)' }}>
          {[
            { color: '#8b5cf6', angle: 0,   delay: '0ms',  dist: 70 },
            { color: '#d946ef', angle: 45,  delay: '60ms', dist: 80 },
            { color: '#06b6d4', angle: 90,  delay: '30ms', dist: 65 },
            { color: '#f59e0b', angle: 135, delay: '80ms', dist: 75 },
            { color: '#10b981', angle: 180, delay: '20ms', dist: 70 },
            { color: '#f43f5e', angle: 225, delay: '50ms', dist: 80 },
            { color: '#8b5cf6', angle: 270, delay: '10ms', dist: 65 },
            { color: '#d946ef', angle: 315, delay: '70ms', dist: 75 },
          ].map((dot, i) => {
            const rad = (dot.angle * Math.PI) / 180;
            return (
              <div key={i} className="confetti-dot" style={{
                backgroundColor: dot.color,
                left: `${Math.cos(rad) * dot.dist}px`,
                top:  `${Math.sin(rad) * dot.dist}px`,
                animationDelay: dot.delay,
              }} />
            );
          })}
        </div>
      )}

      <div className="relative mb-8" style={{
        animation: 'circleGrow 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards',
        opacity: 0,
      }}>
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-violet-400 to-fuchsia-400 blur-xl opacity-30 scale-110" />
        <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-2xl shadow-violet-300">
          <svg viewBox="0 0 52 52" className="w-14 h-14" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
            <polyline
              points="12,26 22,36 40,18"
              strokeDasharray="60"
              strokeDashoffset={step >= 1 ? 0 : 60}
              style={{ transition: step >= 1 ? 'stroke-dashoffset 0.5s cubic-bezier(0.65,0,0.35,1)' : 'none' }}
            />
          </svg>
        </div>
      </div>

      {step >= 2 && (
        <div style={{ animation: 'fadeSlideUp 0.5s ease forwards' }}>
          <h2 className="text-2xl font-black text-gray-900 mb-2">Order Placed! 🎉</h2>
          <p className="text-gray-400 text-sm mb-1">Your order is being prepared</p>
          <p className="text-[11px] text-gray-300 font-mono mb-1">{orderId}</p>
          <p className="text-violet-500 font-bold text-sm">{address?.split(',')[0]}</p>
          <p className="text-gray-500 font-black text-base mt-2">Total Paid: ₹{grandTotal}</p>
        </div>
      )}

      {step >= 3 && (
        <div className="flex gap-3 mt-8" style={{ animation: 'fadeSlideUp 0.4s ease forwards' }}>
          <button onClick={onGoOrders} className="border-2 border-violet-200 text-violet-600 px-6 py-3 rounded-2xl font-black text-sm hover:bg-violet-50 transition-all active:scale-95">
            My Orders 📦
          </button>
          <button onClick={onGoHome} className="bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white px-6 py-3 rounded-2xl font-black text-sm shadow-lg shadow-violet-200 hover:scale-[1.02] active:scale-95 transition-all">
            Back to Home ⚡
          </button>
        </div>
      )}
    </div>
  );
};

// ── Main checkout page ────────────────────────────────────────────────────────
const CheckoutPage = () => {
  const router = useRouter();
  const { cartItems, totalPrice, totalCount, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();

  const [showAuthModal, setShowAuthModal] = useState(false);
  useEffect(() => {
    if (!isAuthenticated) setShowAuthModal(true);
  }, [isAuthenticated]);

  // ── Shop info ─────────────────────────────────────────────────────────────
  const [shopInfoMap, setShopInfoMap] = useState({});

  useEffect(() => {
    if (!cartItems.length) return;
    const shopGroups = groupByShop(cartItems);
    const shopIds = Object.keys(shopGroups).filter(id => id !== 'unknown');
    Promise.all(shopIds.map(fetchShopById)).then(results => {
      const map = {};
      shopIds.forEach((id, i) => { if (results[i]) map[id] = results[i]; });
      setShopInfoMap(map);
    });
  }, [cartItems]);

  // ── Delivery fee ──────────────────────────────────────────────────────────
  const [deliveryFee, setDeliveryFee] = useState(30);
  const [distKm, setDistKm]           = useState(null);
  const [calcingFee, setCalcingFee]   = useState(false);

  // ── Coupons ───────────────────────────────────────────────────────────────
  const [availableCoupons, setAvailableCoupons] = useState({}); // shopId -> [coupons]
  const [couponCode, setCouponCode]   = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null); // { shopId, code, discountAmount, minCartValue }
  const [couponError, setCouponError] = useState('');

  // Fetch available coupons for each shop once we know their owner's phone
  useEffect(() => {
    const shopIds = Object.keys(shopInfoMap);
    if (!shopIds.length) return;

    let cancelled = false;
    Promise.all(
      shopIds.map(async (shopId) => {
        const sellerPhone = shopInfoMap[shopId]?.ownerPhone;
        if (!sellerPhone) return [shopId, []];
        const coupons = await fetchCouponsBySellerPhone(sellerPhone);
        return [shopId, coupons];
      })
    ).then((entries) => {
      if (cancelled) return;
      const map = {};
      for (const [shopId, coupons] of entries) map[shopId] = coupons;
      setAvailableCoupons(map);
    });

    return () => { cancelled = true; };
  }, [shopInfoMap]);

  const couponDiscount = (() => {
  if (!appliedCoupon) return 0;
  if (appliedCoupon.type === 'product') {
    const price = appliedCoupon.productPrice || 0;
    if (appliedCoupon.rewardType === 'percent') {
      return Math.round((price * (appliedCoupon.rewardValue || 0)) / 100);
    }
    return price; // free
  }
  return appliedCoupon.discountAmount || 0;
})();
  const grandTotal = Math.max(totalPrice + deliveryFee + PLATFORM_FEE - couponDiscount, 0);

  // ── Form ──────────────────────────────────────────────────────────────────
  const [form, setForm]                   = useState({ name: '', phone: '', email: '', address: '' });
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [placing, setPlacing]             = useState(false);
  const [placed, setPlaced]               = useState(false);
  const [orderId, setOrderId]             = useState('');
  const [finalTotal, setFinalTotal]       = useState(0);
  const [stockError, setStockError]       = useState('');

  // ── Autofill form once ────────────────────────────────────────────────────
  const prefilledRef = useRef(false);

  useEffect(() => {
    if (prefilledRef.current) return;
    if (!isAuthenticated || !user?.phone) return;
    prefilledRef.current = true;
    setForm({
      name:    user.profile?.name    || user.name    || '',
      phone:   user.phone,
      email:   user.profile?.email   || user.email   || '',
      address: user.profile?.address || user.address || '',
    });
  }, [isAuthenticated, user]);

  const handleChange = (field, value) => {
    setStockError('');
    setForm(prev => ({ ...prev, [field]: value }));
  };

  // ── Delivery fee calculation ───────────────────────────────────────────────
  useEffect(() => {
    if (!form.address || form.address.length < 10) return;
    const shopGroups  = groupByShop(cartItems);
    const firstShopId = Object.keys(shopGroups)[0];
    if (!firstShopId) return;
    const shopInfo = shopInfoMap[firstShopId];
    if (!shopInfo?.address) return;

    let cancelled = false;
    const calc = async () => {
      setCalcingFee(true);
      try {
        const [shopCoords, custCoords] = await Promise.all([
          geocodeAddress(shopInfo.address),
          geocodeAddress(form.address),
        ]);
        if (cancelled) return;
        if (shopCoords && custCoords) {
          const km = await getRoadDistanceKm(shopCoords.lat, shopCoords.lng, custCoords.lat, custCoords.lng);
          if (!cancelled && km != null) {
            setDistKm(km);
            setDeliveryFee(getDeliveryFee(km));
          }
        }
      } finally {
        if (!cancelled) setCalcingFee(false);
      }
    };

    const t = setTimeout(calc, 1000);
    return () => { cancelled = true; clearTimeout(t); };
  }, [form.address, shopInfoMap]);

  // ── Coupon helpers ────────────────────────────────────────────────────────
  const shopGroupsForCoupons = groupByShop(cartItems);

  // Subtotal for a given shop (used to validate min cart value)
  const getShopSubtotal = (shopId) => {
    const items = shopGroupsForCoupons[shopId] || [];
    return items.reduce((s, i) => s + i.product.price * i.quantity, 0);
  };

  // Flatten all available coupons across shops with shop context attached
  const allAvailableCoupons = Object.entries(availableCoupons).flatMap(([shopId, coupons]) =>
    coupons.map(c => ({ ...c, shopId, shopName: shopInfoMap[shopId]?.shopName || 'Shop' }))
  );

  const applyCouponByCode = async (code, shopIdHint) => {
    setCouponError('');
    const normalized = code.trim().toUpperCase();
    if (!normalized) {
      setCouponError('Please enter a coupon code');
      return;
    }

    // Find matching coupon — prefer the hinted shop, otherwise search all
    let match = null;
    if (shopIdHint) {
      match = (availableCoupons[shopIdHint] || []).find(c => c.code === normalized);
      if (match) match = { ...match, shopId: shopIdHint };
    }
    if (!match) {
      for (const [shopId, coupons] of Object.entries(availableCoupons)) {
        const found = coupons.find(c => c.code === normalized);
        if (found) { match = { ...found, shopId }; break; }
      }
    }

    if (!match) {
      setCouponError('Invalid coupon code');
      return;
    }

    const shopSubtotal = getShopSubtotal(match.shopId);
    if (shopSubtotal < (match.minCartValue || 0)) {
      setCouponError(`Add ₹${(match.minCartValue - shopSubtotal)} more from ${shopInfoMap[match.shopId]?.shopName || 'this shop'} to use this coupon`);
      return;
    }

    let productPrice = null;
    if (match.type === 'product' && match.productId) {
      const cartItems_ = shopGroupsForCoupons[match.shopId] || [];
      const inCart = cartItems_.find(i => i.product.id === match.productId);
      if (inCart) {
        productPrice = inCart.product.price;
      } else {
        const fetched = await fetchProductById(match.productId);
        productPrice = fetched?.price ?? 0;
      }
    }

    setAppliedCoupon({
      shopId: match.shopId,
      code: match.code,
      type: match.type || 'discount',
      discountAmount: match.discountAmount || 0,
      minCartValue: match.minCartValue || 0,
      rewardType: match.rewardType,
      rewardValue: match.rewardValue,
      productId: match.productId,
      productName: match.productName,
      productImage: match.productImage,
      productPrice,
    });
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
  };

  // ── Place order ───────────────────────────────────────────────────────────
  const handlePlaceOrder = async () => {
    setPlacing(true);
    setStockError('');

    const shopGroups = groupByShop(cartItems);

    const shops = Object.entries(shopGroups).map(([shopId, items]) => {
      const s = shopInfoMap[shopId];
      const shopSubtotal = items.reduce((s, i) => s + i.product.price * i.quantity, 0);
      const couponHere = appliedCoupon && appliedCoupon.shopId === shopId ? appliedCoupon : null;
     const itemsList = items.map(item => ({
  key:           item.key,
  name:          item.product.name,
  price:         item.product.price,
  quantity:      item.quantity,
  selectedColor: item.selectedColor,
  selectedSize:  item.selectedSize,
  imageId: item.cartImageId ?? item.product.cartImageId ?? item.product.mainImageId,
  productId:     item.product.id,
}));

// If a product-reward coupon applies here and the reward item isn't already in the cart, add it
if (couponHere?.type === 'product' && couponHere.productId) {
  const alreadyInCart = items.some(i => i.product.id === couponHere.productId);
  if (!alreadyInCart) {
    itemsList.push({
      key: `reward-${couponHere.productId}`,
      name: couponHere.productName,
      price: couponHere.rewardType === 'percent' ? (couponHere.productPrice || 0) : 0,
      quantity: 1,
      selectedColor: null,
      selectedSize: null,
      imageId: couponHere.productImage,
      productId: couponHere.productId,
      isReward: true,
      rewardType: couponHere.rewardType,
    });
  }
}

return {
  shopId,
  shopName:     s?.shopName    || 'Unknown Shop',
  shopCategory: s?.category    || '',
  shopPhoto:    s?.mainPhotoId || s?.shopPhoto || '',
  shopAddress:  s?.address     || '',
  items: itemsList,
  subtotal: shopSubtotal,
  couponApplied: couponHere ? couponHere.code : null,
  couponType: couponHere?.type || null,
  couponDiscount: couponHere ? couponDiscount : 0,
  rewardProduct: couponHere?.type === 'product' ? {
    productId: couponHere.productId,
    name: couponHere.productName,
    image: couponHere.productImage,
    rewardType: couponHere.rewardType,
    rewardValue: couponHere.rewardValue,
  } : null,
};
});

    const flatItems = cartItems.map(item => ({
      productId: item.product.id,
      quantity:  item.quantity,
    }));

    const newOrder = {
      id:                 `ORD-${Date.now()}`,
      placedAt:           new Date().toISOString(),
      status:             'confirmed',
      paymentMethod,
      customer:           { ...form },
      shops,
      items:              flatItems,
      subtotal:           totalPrice,
      deliveryFee,
      deliveryDistanceKm: distKm,
      platformFee:        PLATFORM_FEE,
      couponCode:         appliedCoupon?.code || null,
      couponDiscount:     couponDiscount,
      totalPrice:         grandTotal,
      totalCount,
    };

    try {
      const res = await fetch('/api/orders', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ phone: form.phone, order: newOrder }),
      });

      if (res.status === 409) {
        const err = await res.json();
        setStockError(err.details?.join('\n') || 'Some items are out of stock.');
        setPlacing(false);
        return;
      }
      if (!res.ok) {
        const err = await res.json();
        setStockError(err.error || 'Failed to place order. Please try again.');
        setPlacing(false);
        return;
      }
    } catch {
      setStockError('Network error. Please check your connection and try again.');
      setPlacing(false);
      return;
    }

    setOrderId(newOrder.id);
    setFinalTotal(grandTotal);
    clearCart();
    setPlacing(false);
    setPlaced(true);
  };

  // ── Auth modal ────────────────────────────────────────────────────────────
  if (showAuthModal && !isAuthenticated) {
    return (
      <PhoneAuthModal
        isOpen={true}
        onClose={() => {
          if (!isAuthenticated) router.back();
          else setShowAuthModal(false);
        }}
      />
    );
  }

  if (placed) return (
    <OrderSuccessScreen
      orderId={orderId}
      address={form.address}
      grandTotal={finalTotal}
      onGoOrders={() => router.push('/orders')}
      onGoHome={() => router.push('/')}
    />
  );

  if (!cartItems.length) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 text-center">
      <div className="text-6xl mb-4">🛒</div>
      <p className="text-gray-400 text-sm mb-6">Your cart is empty</p>
      <button onClick={() => router.push('/')} className="bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white px-8 py-3 rounded-2xl font-black text-sm shadow-lg shadow-violet-200">
        Shop Now ⚡
      </button>
    </div>
  );

  const shopGroups = groupByShop(cartItems);

  const fields = [
    { key: 'name',    label: 'Full Name',       icon: User,   type: 'text',  placeholder: 'Your name'             },
    { key: 'phone',   label: 'Phone',            icon: Phone,  type: 'tel',   placeholder: '+91XXXXXXXXXX'         },
    { key: 'email',   label: 'Email',            icon: Mail,   type: 'email', placeholder: 'you@email.com'         },
    { key: 'address', label: 'Delivery Address', icon: MapPin, type: 'text',  placeholder: 'Full delivery address' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-36">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="w-9 h-9 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-700 hover:bg-gray-100 transition-all text-lg">←</button>
        <h1 className="text-gray-900 font-black text-base flex-1">Checkout</h1>
        <span className="text-[10px] font-black px-3 py-1 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white shadow-md shadow-violet-200">
          {totalCount} item{totalCount !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="px-4 pt-5 space-y-4">

        {/* Delivery details */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 pt-5 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-violet-100 flex items-center justify-center">
                <MapPin className="w-4 h-4 text-violet-600" />
              </div>
              <p className="text-sm font-black text-gray-900">Delivery Details</p>
            </div>
            {isAuthenticated && (
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">✓ Auto-filled</span>
            )}
          </div>
          <div className="px-5 pb-5 space-y-3">
            {fields.map(({ key, label, icon: Icon, type, placeholder }) => (
              <div key={key}>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">{label}</label>
                <div className="relative flex items-center">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <Icon className="w-4 h-4 text-violet-400" />
                  </div>
                  <input
                    type={type}
                    value={form[key]}
                    onChange={e => handleChange(key, e.target.value)}
                    placeholder={placeholder}
                    className={`w-full pl-9 pr-4 py-3 rounded-2xl border text-sm font-semibold text-gray-800 bg-gray-50 outline-none transition-all focus:border-violet-400 focus:bg-white focus:shadow-md focus:shadow-violet-100 ${form[key] ? 'border-violet-200' : 'border-gray-200'}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Coupons */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 pt-5 pb-3 flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-violet-100 flex items-center justify-center">
              <Tag className="w-4 h-4 text-violet-600" />
            </div>
            <p className="text-sm font-black text-gray-900">Apply Coupon</p>
          </div>

          <div className="px-5 pb-5 space-y-3">
            {appliedCoupon ? (
              <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-emerald-50 border border-emerald-200">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                 <div className="min-w-0">
  <p className="text-sm font-black text-emerald-700 tracking-wide truncate">{appliedCoupon.code}</p>
  <p className="text-[11px] text-emerald-500 font-semibold">
    {appliedCoupon.type === 'product'
      ? (appliedCoupon.rewardType === 'percent'
          ? `${appliedCoupon.rewardValue}% off ${appliedCoupon.productName}`
          : `${appliedCoupon.productName} FREE`)
      : `₹${appliedCoupon.discountAmount} off applied`}
  </p>
</div>
                </div>
                <button
                  onClick={handleRemoveCoupon}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-emerald-500 hover:bg-emerald-100 transition-all flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <div className="flex gap-2">
               <input
  type="text"
  value={couponCode}
  onChange={(e) => { setCouponCode(e.target.value); setCouponError(''); }}
  placeholder="Enter coupon code"
  style={{ textTransform: 'uppercase' }}
  className="flex-1 px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-sm font-black uppercase tracking-wide text-violet-700 placeholder-gray-400 placeholder:font-medium placeholder:tracking-normal placeholder:normal-case outline-none focus:border-violet-400 focus:bg-white focus:shadow-md focus:shadow-violet-100 transition-all"
/>
                  <button
                    onClick={() => applyCouponByCode(couponCode)}
                    className="px-5 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white text-sm font-black shadow-md shadow-violet-200 hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    Apply
                  </button>
                </div>

                {couponError && (
                  <p className="text-[11px] text-rose-500 font-semibold px-1">{couponError}</p>
                )}

                {allAvailableCoupons.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Available Coupons</p>
                    <div className="flex flex-col gap-2">
                      {allAvailableCoupons.map((c) => (
  <button
    key={`${c.shopId}-${c.code}`}
    onClick={() => applyCouponByCode(c.code, c.shopId)}
    className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-100 hover:border-violet-300 transition-all text-left"
  >
    {c.type === 'product' ? (
      <div className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0 bg-violet-100 border border-violet-200">
        <img
          src={c.productImage}
          alt={c.productName}
          className="w-full h-full object-cover"
          onError={(e) => { e.target.style.opacity = '0'; }}
        />
      </div>
    ) : (
      <div className="w-9 h-9 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 flex items-center justify-center flex-shrink-0 text-white text-base">
        🎟️
      </div>
    )}
    <div className="flex-1 min-w-0">
      <p className="text-sm font-black text-violet-700 tracking-wide">{c.code}</p>
      <p className="text-[11px] text-gray-500 font-medium truncate">
        {c.type === 'product'
          ? (c.rewardType === 'percent'
              ? `${c.rewardValue}% off ${c.productName}`
              : `${c.productName} FREE`)
          : `₹${c.discountAmount} off`}
        {c.minCartValue > 0 ? ` on orders above ₹${c.minCartValue}` : ''} · {c.shopName}
      </p>
    </div>
    <span className="text-[10px] font-black text-violet-500 flex-shrink-0">Tap to apply</span>
  </button>
))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Order summary */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 pt-5 pb-3 flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-fuchsia-100 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4 text-fuchsia-600" />
            </div>
            <p className="text-sm font-black text-gray-900">Order Summary</p>
          </div>
          <div className="px-5 pb-4 space-y-5">
            {Object.entries(shopGroups).map(([shopId, items]) => {
              const shopInfo = shopInfoMap[shopId];
              return (
                <div key={shopId}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-lg overflow-hidden bg-violet-50 border border-violet-100 flex-shrink-0">
                      {shopInfo?.mainPhotoId && (
                        <img src={shopInfo.mainPhotoId} alt="" className="w-full h-full object-cover" onError={e => { e.target.style.opacity = '0'; }} />
                      )}
                    </div>
                    <p className="text-[11px] font-black text-violet-600 capitalize">
                      {shopInfo?.shopName || <span className="text-gray-300">Loading...</span>}
                    </p>
                    <div className="flex-1 h-px bg-violet-100" />
                  </div>
                  <div className="space-y-2.5">
                    {items.map(item => (
                      <div key={item.key} className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-100 flex-shrink-0 flex items-center justify-center overflow-hidden">
                          <img src={item.product.cartImageId ?? item.product.mainImageId} alt={item.product.name} className="w-full h-full object-contain p-1" onError={e => { e.target.style.opacity = '0.2'; }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-black text-gray-900 capitalize truncate">{item.product.name}</p>
                          <div className="flex gap-1.5 mt-0.5 flex-wrap">
                            {item.selectedColor && item.selectedColor !== 'default' && (
                              <span className="text-[9px] font-bold text-violet-500 bg-violet-50 px-1.5 py-0.5 rounded-full capitalize border border-violet-100">{item.selectedColor}</span>
                            )}
                            {item.selectedSize && item.selectedSize !== 'default' && (
                              <span className="text-[9px] font-bold text-fuchsia-500 bg-fuchsia-50 px-1.5 py-0.5 rounded-full border border-fuchsia-100">{item.selectedSize}</span>
                            )}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-black text-violet-600">₹{item.product.price * item.quantity}</p>
                          <p className="text-[10px] text-gray-400 font-semibold">×{item.quantity}</p>
                        </div>
                      </div>
                    ))}

                    {appliedCoupon?.shopId === shopId && appliedCoupon.type === 'product' && appliedCoupon.productId && !items.some(i => i.product.id === appliedCoupon.productId) && (
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 flex-shrink-0 flex items-center justify-center overflow-hidden">
                          <img src={appliedCoupon.productImage} alt={appliedCoupon.productName} className="w-full h-full object-contain p-1" onError={e => { e.target.style.opacity = '0.2'; }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-black text-gray-900 capitalize truncate">{appliedCoupon.productName}</p>
                          <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200 inline-block mt-0.5">
                            {appliedCoupon.rewardType === 'percent' ? `${appliedCoupon.rewardValue}% OFF · Reward` : 'FREE · Reward'}
                          </span>
                        </div>
                        <div className="text-right flex-shrink-0">
                          {appliedCoupon.rewardType === 'percent' ? (
                            <>
                              <p className="text-sm font-black text-gray-400 line-through">₹{appliedCoupon.productPrice}</p>
                              <p className="text-sm font-black text-emerald-600">₹{(appliedCoupon.productPrice || 0) - couponDiscount}</p>
                            </>
                          ) : (
                            <p className="text-sm font-black text-emerald-600">FREE</p>
                          )}
                          <p className="text-[10px] text-gray-400 font-semibold">×1</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            <div className="h-px bg-gray-100" />

            <div className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400 font-medium">Subtotal</span>
                <span className="font-black text-gray-800">₹{totalPrice}</span>
              </div>
              <div className="flex justify-between text-sm items-center">
                <span className="text-gray-400 font-medium">
                  Delivery
                  {distKm != null && !calcingFee && (
                    <span className="ml-1.5 text-[10px] text-violet-400 font-bold">({distKm.toFixed(1)} km)</span>
                  )}
                </span>
                <span className="font-black text-gray-800 flex items-center gap-1.5">
                  {calcingFee ? (
                    <>
                      <svg className="animate-spin w-3 h-3 text-violet-400" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                      </svg>
                      <span className="text-violet-400 text-xs">Calculating...</span>
                    </>
                  ) : `₹${deliveryFee}`}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400 font-medium">Platform Fees</span>
                <span className="font-black text-emerald-500">FREE</span>
              </div>
             {appliedCoupon && (
  <div className="flex justify-between text-sm">
    <span className="text-emerald-500 font-bold flex items-center gap-1">
      <Tag className="w-3 h-3" />
      Coupon ({appliedCoupon.code}){appliedCoupon.type === 'product' ? ` · ${appliedCoupon.productName}` : ''}
    </span>
    <span className="font-black text-emerald-500">−₹{couponDiscount}</span>
  </div>
)}
              <div className="flex justify-between text-base pt-1 border-t border-gray-100 mt-1">
                <span className="font-black text-gray-900">Total</span>
                <span className="font-black bg-gradient-to-r from-violet-600 to-fuchsia-500 bg-clip-text text-transparent text-lg">₹{grandTotal}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment method */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 pt-5 pb-3">
            <p className="text-sm font-black text-gray-900">Payment Method</p>
          </div>
          <div className="px-5 pb-5 space-y-2.5">
            {[
              { id: 'cod',  label: 'Cash on Delivery', emoji: '💵', sub: 'Pay when you receive' },
             
            ].map(pm => (
              <button
                key={pm.id}
                onClick={() => setPaymentMethod(pm.id)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 transition-all ${paymentMethod === pm.id ? 'border-violet-400 bg-violet-50' : 'border-gray-100 bg-gray-50 hover:border-violet-200'}`}
              >
                <span className="text-xl">{pm.emoji}</span>
                <div className="flex-1 text-left">
                  <p className={`text-sm font-black ${paymentMethod === pm.id ? 'text-violet-700' : 'text-gray-700'}`}>{pm.label}</p>
                  <p className="text-[10px] text-gray-400 font-medium">{pm.sub}</p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${paymentMethod === pm.id ? 'border-violet-500 bg-violet-500' : 'border-gray-300'}`}>
                  {paymentMethod === pm.id && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
              </button>
            ))}
          </div>
        </div>

        {stockError && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl px-4 py-3 flex gap-3 items-start">
            <span className="text-lg flex-shrink-0">⚠️</span>
            <div>
              <p className="text-xs font-black text-rose-700 mb-0.5">Couldn't place your order</p>
              <p className="text-[11px] text-rose-500 font-medium whitespace-pre-line">{stockError}</p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 px-4 py-3 bg-white border-t border-gray-100">
        <button
          onClick={handlePlaceOrder}
          disabled={placing || !form.name || !form.phone || !form.address}
          className={`w-full py-4 rounded-2xl text-sm font-black transition-all flex items-center justify-center gap-2 min-h-[56px]
            ${placing
              ? 'bg-violet-100 text-violet-400 cursor-wait'
              : (!form.name || !form.phone || !form.address)
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white shadow-lg shadow-violet-200 hover:scale-[1.01] active:scale-95'
            }`}
        >
          {placing ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              Placing Order...
            </span>
          ) : (
            <>
              <span>Place Order</span>
              <span className="bg-white/20 px-2.5 py-0.5 rounded-xl text-xs font-black">₹{grandTotal} ⚡</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default CheckoutPage;