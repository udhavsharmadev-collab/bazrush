'use client';

import { useRouter } from 'next/navigation';
import { useCart } from '../context/CartContext';

const CartPage = () => {
  const router = useRouter();
  const { cartItems, updateQuantity, removeFromCart, clearCart, totalCount, totalPrice } = useCart();

  const PLATFORM_FEE = 0;
  const grandTotal = totalPrice + PLATFORM_FEE;

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

      {/* Cart Items */}
      <div className="px-4 pt-4 space-y-3">
        {cartItems.map((item) => (
          <div
            key={item.key}
            className="bg-white rounded-3xl border border-gray-100 p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow"
          >
            {/* Product image */}
            <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-100 flex-shrink-0 flex items-center justify-center">
              <img
                src={`/images/${item.product.mainImageId}`}
                alt={item.product.name}
                className="w-full h-full object-contain p-1.5"
                onError={(e) => { e.target.style.opacity = '0.2'; }}
              />
            </div>

            {/* Info */}
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

            {/* Quantity control */}
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

      {/* Order Summary card */}
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
        <button
          onClick={() => router.push('/checkout')}
          className="w-full py-4 rounded-2xl text-sm font-black bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white shadow-lg shadow-violet-200 hover:shadow-violet-300 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <span>Proceed to Checkout</span>
          <span className="bg-white/20 px-2.5 py-0.5 rounded-xl text-xs font-black">₹{totalPrice} + delivery ⚡</span>
        </button>
      </div>
    </div>
  );
};

export default CartPage;1