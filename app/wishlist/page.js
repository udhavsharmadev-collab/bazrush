'use client';

import { useRouter } from "next/navigation";
import { useWishlist } from "../context/Wishlistcontext";
import { Heart, Trash2 } from "lucide-react";

const WishlistPage = () => {
  const router = useRouter();
  const { wishlistItems, removeFromWishlist } = useWishlist();

  return (
    <div className="min-h-screen bg-white pb-10">

      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-700 hover:bg-gray-100 transition-all text-lg"
        >←</button>
        <div className="flex items-center gap-2 flex-1">
          <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
          <span className="text-gray-900 font-black text-sm">My Wishlist</span>
          {wishlistItems.length > 0 && (
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-50 text-rose-500 border border-rose-200">
              {wishlistItems.length}
            </span>
          )}
        </div>
      </div>

      {/* Empty state */}
      {wishlistItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
          <div className="w-20 h-20 rounded-3xl bg-rose-50 border-2 border-rose-100 flex items-center justify-center mb-5">
            <Heart className="w-9 h-9 text-rose-300" />
          </div>
          <p className="text-lg font-black text-gray-800 mb-1">Your wishlist is empty</p>
          <p className="text-sm text-gray-400 mb-6 font-medium">Save products you love and find them here anytime.</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white text-sm font-black shadow-lg shadow-violet-200 hover:scale-105 transition-transform"
          >
            Explore Products
          </button>
        </div>
      ) : (
        <div className="px-4 pt-4 space-y-3">
          {wishlistItems.map((product) => (
            <div
              key={product.id}
              className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 border border-gray-100 hover:border-violet-200 hover:bg-violet-50/40 transition-all duration-200 cursor-pointer group"
              onClick={() => router.push(`/product/${product.id}`)}
            >
              {/* Product image */}
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-gradient-to-br from-violet-50 to-purple-50 border border-purple-100 flex-shrink-0 flex items-center justify-center">
                <img
                  src={product.mainImageId}
                  alt={product.name}
                  className="w-full h-full object-contain p-1"
                  onError={(e) => { e.target.style.opacity = '0.2'; }}
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-gray-900 capitalize truncate">{product.name}</p>
                <p className="text-[11px] text-violet-500 font-semibold capitalize mt-0.5">{product.category}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm font-black text-gray-900">₹{product.price}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${product.stockStatus === "in_stock" ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-rose-50 text-rose-500 border border-rose-200"}`}>
                    {product.stockStatus === "in_stock" ? "In Stock" : "Out of Stock"}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFromWishlist(product.id);
                  }}
                  className="w-8 h-8 rounded-xl bg-white border border-rose-100 flex items-center justify-center text-rose-400 hover:bg-rose-50 hover:border-rose-300 hover:text-rose-600 transition-all active:scale-90"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <span className="text-violet-400 text-[10px] font-bold group-hover:translate-x-0.5 transition-transform">View →</span>
              </div>
            </div>
          ))}

          {/* Clear all */}
          <button
            onClick={() => {
              wishlistItems.forEach(p => removeFromWishlist(p.id));
            }}
            className="w-full py-3 mt-2 rounded-2xl border-2 border-dashed border-rose-200 text-rose-400 text-xs font-black hover:bg-rose-50 hover:border-rose-300 transition-all flex items-center justify-center gap-2"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear Wishlist
          </button>
        </div>
      )}
    </div>
  );
};

export default WishlistPage;