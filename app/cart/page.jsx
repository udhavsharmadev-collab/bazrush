'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import PhoneAuthModal from '../components/auth/PhoneAuthModal';

// ── Delivery window: 12:00 AM (0) → 9:00 PM (21) ─────────────────────────────
const DELIVERY_START = 0;   // midnight
const DELIVERY_END   = 21;  // 9 PM (orders accepted up to 8:59 PM)

function getDeliveryStatus() {
  const now  = new Date();
  const hour = now.getHours();
  const min  = now.getMinutes();
  const isOpen = hour >= DELIVERY_START && hour < DELIVERY_END;

  // Minutes until next window opens (for closed state)
  let minutesUntilOpen = null;
  if (!isOpen) {
    // Next open = midnight tonight if we're past 9 PM, else midnight already passed → midnight
    const midnight = new Date(now);
    midnight.setHours(DELIVERY_START, 0, 0, 0);
    if (hour >= DELIVERY_END) midnight.setDate(midnight.getDate() + 1);
    minutesUntilOpen = Math.ceil((midnight - now) / 60000);
  }

  // Minutes until window closes (for open state — warn when < 30 min left)
  let minutesUntilClose = null;
  if (isOpen) {
    const close = new Date(now);
    close.setHours(DELIVERY_END, 0, 0, 0);
    minutesUntilClose = Math.ceil((close - now) / 60000);
  }

  return { isOpen, hour, min, minutesUntilOpen, minutesUntilClose };
}

function formatCountdown(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

// ── Closed Banner ─────────────────────────────────────────────────────────────
const ClosedBanner = ({ minutesUntilOpen }) => (
  <div className="mx-4 mt-4 bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-5 border border-slate-700 shadow-xl">
    <div className="flex items-start gap-4">
      <div className="w-12 h-12 rounded-2xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center flex-shrink-0">
        <span className="text-2xl">🌙</span>
      </div>
      <div className="flex-1">
        <p className="text-white font-black text-sm mb-0.5">We're closed right now</p>
        <p className="text-slate-400 text-xs leading-relaxed">
          Deliveries run <span className="text-amber-400 font-bold">12:00 AM – 9:00 PM</span> daily.
          Our single delivery partner ensures every order gets the care it deserves ⚡
        </p>
        {minutesUntilOpen !== null && (
          <div className="mt-3 inline-flex items-center gap-2 bg-amber-400/10 border border-amber-400/20 rounded-xl px-3 py-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-amber-400 text-[11px] font-black">
              Opens in {formatCountdown(minutesUntilOpen)}
            </span>
          </div>
        )}
      </div>
    </div>
  </div>
);

// ── Closing Soon Warning ───────────────────────────────────────────────────────
const ClosingSoonBanner = ({ minutesUntilClose }) => (
  <div className="mx-4 mt-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-3.5 border border-amber-200 flex items-center gap-3">
    <span className="text-xl flex-shrink-0">⏰</span>
    <div>
      <p className="text-amber-800 font-black text-xs">Ordering closes soon!</p>
      <p className="text-amber-600 text-[11px]">
        Last orders in <span className="font-black">{formatCountdown(minutesUntilClose)}</span> · Deliveries until 9:00 PM
      </p>
    </div>
  </div>
);

// ── Cart Page ─────────────────────────────────────────────────────────────────
const CartPage = () => {
  const router = useRouter();
  const { cartItems, updateQuantity, removeFromCart, clearCart, totalCount, totalPrice } = useCart();
  const { isAuthenticated } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [deliveryStatus, setDeliveryStatus] = useState(getDeliveryStatus());

  // Refresh delivery status every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setDeliveryStatus(getDeliveryStatus());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const PLATFORM_FEE = 0;
  const grandTotal   = totalPrice + PLATFORM_FEE;
  const { isOpen, minutesUntilOpen, minutesUntilClose } = deliveryStatus;
  const showClosingSoon = isOpen && minutesUntilClose !== null && minutesUntilClose <= 30;

  const handleCheckout = () => {
    if (!isOpen) return; // blocked by UI, but double-check
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    router.push('/checkout');
  };

  const handleModalClose = () => {
    setShowAuthModal(false);
    if (isAuthenticated) router.push('/checkout');
  };

  if (cartItems.length === 0) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
      <div className="text-7xl mb-5">🛒</div>
      <h2 className="text-2xl font-black text-gray-900 mb-2">Your cart is empty</h2>
      <p className="text-gray-400 text-sm mb-8 text-center">Add products from any shop to get started</p>
      <button
        onClick={() => router.push('/')}
        className="bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white px-8 py-3.5 rounded-2xl font-black text-sm shadow-lg shadow-violet-200 hover:scale-[1.02] active:scale-95 transition-all"
      >
        Start Shopping ⚡
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-36">

      <PhoneAuthModal isOpen={showAuthModal} onClose={handleModalClose} />

      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-700 hover:bg-gray-100 transition-all text-lg"
        >
          ←
        </button>
        <h1 className="text-gray-900 font-black text-base flex-1">My Cart</h1>
        <span className="text-[10px] font-black px-3 py-1 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white shadow-md shadow-violet-200">
          {totalCount} {totalCount === 1 ? 'item' : 'items'}
        </span>
        <button
          onClick={clearCart}
          className="text-[11px] font-bold text-rose-400 hover:text-rose-600 transition-colors px-2"
        >
          Clear all
        </button>
      </div>

      {/* Delivery status banners */}
      {!isOpen && <ClosedBanner minutesUntilOpen={minutesUntilOpen} />}
      {showClosingSoon && <ClosingSoonBanner minutesUntilClose={minutesUntilClose} />}

      {/* Delivery hours info strip (always visible when open) */}
      {isOpen && !showClosingSoon && (
        <div className="mx-4 mt-4 flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-2.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
          <p className="text-emerald-700 text-[11px] font-bold flex-1">
            Delivery open · 20–25 min ⚡
          </p>
          <span className="text-[10px] text-emerald-500 font-semibold">until 9:00 PM</span>
        </div>
      )}

      {/* Cart Items */}
      <div className="px-4 pt-4 space-y-3">
        {cartItems.map((item) => (
          <div
            key={item.key}
            className={`bg-white rounded-3xl border border-gray-100 p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow ${!isOpen ? 'opacity-60' : ''}`}
          >
            <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-100 flex-shrink-0 flex items-center justify-center">
              <img
               src={`/images/${item.product.cartImageId ?? item.product.mainImageId}`}
                alt={item.product.name}
                className="w-full h-full object-contain p-1.5"
                onError={(e) => { e.target.style.opacity = '0.2'; }}
              />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-gray-900 capitalize truncate">{item.product.name}</p>
              <div className="flex gap-2 mt-0.5 flex-wrap">
                {item.selectedColor && item.selectedColor !== 'default' && (
                  <span className="text-[10px] font-bold text-violet-500 bg-violet-50 px-2 py-0.5 rounded-full capitalize border border-violet-100">
                    {item.selectedColor}
                  </span>
                )}
                {item.selectedSize && item.selectedSize !== 'default' && (
                  <span className="text-[10px] font-bold text-fuchsia-500 bg-fuchsia-50 px-2 py-0.5 rounded-full border border-fuchsia-100">
                    {item.selectedSize}
                  </span>
                )}
              </div>
              <p className="text-violet-600 font-black text-sm mt-1">₹{item.product.price * item.quantity}</p>
            </div>

            <div className="flex flex-col items-center gap-1.5">
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-2xl px-2 py-1.5">
                <button
                  onClick={() => {
                    if (item.quantity === 1) removeFromCart(item.key);
                    else updateQuantity(item.key, -1);
                  }}
                  className="w-7 h-7 rounded-xl bg-white border border-gray-200 text-gray-600 font-black text-base flex items-center justify-center hover:border-violet-300 hover:text-violet-600 active:scale-90 transition-all shadow-sm"
                >
                  {item.quantity === 1 ? '🗑' : '−'}
                </button>
                <span className="text-gray-900 font-black text-sm w-5 text-center">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.key, 1)}
                  className="w-7 h-7 rounded-xl bg-violet-600 text-white font-black text-base flex items-center justify-center hover:bg-violet-700 active:scale-90 transition-all shadow-sm shadow-violet-200"
                >
                  +
                </button>
              </div>
              <p className="text-[9px] text-gray-300 font-semibold">₹{item.product.price} each</p>
            </div>
          </div>
        ))}
      </div>

      {/* Order Summary */}
      <div className="mx-4 mt-5 bg-white rounded-3xl border border-gray-100 p-5 shadow-sm">
        <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Order Summary</p>
        <div className="space-y-2.5">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500 font-medium">Subtotal ({totalCount} items)</span>
            <span className="text-sm font-black text-gray-900">₹{totalPrice}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500 font-medium">Delivery</span>
            <div className="text-right">
              <span className="text-sm font-black text-gray-900">₹30–₹50</span>
              <p className="text-[9px] text-violet-400 font-bold">based on distance</p>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500 font-medium">Platform Fees</span>
            <span className="text-sm font-black text-emerald-500">FREE</span>
          </div>
          <div className="h-px bg-gray-100 my-1" />
          <div className="flex justify-between items-center">
            <span className="text-base font-black text-gray-900">Total</span>
            <div className="text-right">
              <span className="text-xl font-black bg-gradient-to-r from-violet-600 to-fuchsia-500 bg-clip-text text-transparent">₹{totalPrice}</span>
              <p className="text-[9px] text-gray-400 font-bold">+ delivery at checkout</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 px-4 py-3 bg-white border-t border-gray-100">
        {isOpen ? (
          <button
            onClick={handleCheckout}
            className="w-full py-4 rounded-2xl text-sm font-black bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white shadow-lg shadow-violet-200 hover:shadow-violet-300 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <span>Proceed to Checkout</span>
            <span className="bg-white/20 px-2.5 py-0.5 rounded-xl text-xs font-black">₹{totalPrice} + delivery ⚡</span>
          </button>
        ) : (
          <div className="w-full py-4 rounded-2xl text-sm font-black bg-slate-100 border-2 border-slate-200 text-slate-400 flex flex-col items-center justify-center gap-0.5 cursor-not-allowed select-none">
            <span>Ordering Unavailable Right Now 🌙</span>
            <span className="text-[10px] font-semibold text-slate-400">
              Come back between <span className="font-black text-slate-500">12:00 AM – 9:00 PM</span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPage;