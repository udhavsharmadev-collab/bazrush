"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, User, ShoppingCart, Heart } from 'lucide-react';
import PhoneAuthModal from './auth/PhoneAuthModal';
import { useAuth } from '../context/AuthContext';
import { useSeller } from '../context/SellerContext';
import { useCart } from '../context/CartContext';
import { useDeliveryPartner } from '../context/DeliveryPartnerContext';
import { useWishlist } from '../context/Wishlistcontext'; // ← adjust path if needed

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const { isSellerAuthenticated, seller, logoutSeller } = useSeller();
  const { isPartnerAuthenticated, partner, logoutPartner } = useDeliveryPartner();
  const { totalCount } = useCart();
  const { wishlistItems } = useWishlist();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const toggleMobileMenu = () => setIsMobileMenuOpen((prev) => !prev);

  const openAuthModal = () => {
    setIsMobileMenuOpen(false);
    setShowAuthModal(true);
  };
  const closeAuthModal = () => setShowAuthModal(false);

  return (
    <>
      <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="flex justify-between items-center py-4 md:py-3">

            {/* Logo */}
            <Link href="/" className="flex items-center space-x-1">
              <span className="text-3xl md:text-4xl font-black tracking-[-0.08em]">
                <span className="bg-gradient-to-r from-[#7C3AED] to-purple-700 bg-clip-text text-transparent">Baz</span>
                <span className="text-yellow-400 -mx-[0.15em]">⚡</span>
                <span className="bg-gradient-to-r from-[#7C3AED] to-purple-700 bg-clip-text text-transparent">rush</span>
              </span>
            </Link>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/" className="text-gray-700 hover:text-purple-600 font-medium transition-colors duration-200">Home</Link>
              <Link href="/shops" className="text-gray-700 hover:text-purple-600 font-medium transition-colors duration-200">Shops</Link>
              <Link href="/orders" className="text-gray-700 hover:text-purple-600 font-medium transition-colors duration-200">Track Order</Link>
            </div>

            {/* Desktop Right Side */}
            <div className="hidden md:flex items-center gap-3">

              {/* Wishlist — only show for regular users (not seller/partner) */}
              {!isSellerAuthenticated && !isPartnerAuthenticated && (
                <Link href="/wishlist" className="relative p-2 rounded-xl hover:bg-rose-50 transition-colors group">
                  <Heart className={`w-6 h-6 transition-colors ${wishlistItems.length > 0 ? 'fill-rose-500 text-rose-500' : 'text-gray-600 group-hover:text-rose-500'}`} />
                  {wishlistItems.length > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-white text-[10px] font-black flex items-center justify-center shadow-md shadow-rose-200">
                      {wishlistItems.length > 99 ? '99+' : wishlistItems.length}
                    </span>
                  )}
                </Link>
              )}

              {/* Cart */}
              <Link href="/cart" className="relative p-2 rounded-xl hover:bg-violet-50 transition-colors group">
                <ShoppingCart className="w-6 h-6 text-gray-600 group-hover:text-violet-600 transition-colors" />
                {totalCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white text-[10px] font-black flex items-center justify-center shadow-md shadow-violet-200">
                    {totalCount > 99 ? '99+' : totalCount}
                  </span>
                )}
              </Link>

              {/* Auth States */}
              {isPartnerAuthenticated ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    🛵 Delivery Partner
                  </span>
                  <span className="font-semibold text-gray-700">{partner?.name}</span>
                  <Link href="/partner/delivery" className="ml-1 px-3 py-1.5 bg-indigo-100 text-indigo-700 text-sm font-medium rounded-lg hover:bg-indigo-200 transition-colors">
                    Dashboard
                  </Link>
                  <button type="button" onClick={logoutPartner} className="px-3 py-1.5 bg-gray-100 text-gray-500 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors">
                    Logout
                  </button>
                </div>
              ) : isSellerAuthenticated ? (
                <div className="flex items-center space-x-2">
                  <span className="bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent font-bold text-sm">🏪 Seller</span>
                  <span className="font-semibold text-gray-700">{seller?.name || 'Seller'}</span>
                  <Link href="/seller/dashboard" className="ml-2 px-3 py-1.5 bg-purple-100 text-purple-700 text-sm font-medium rounded-lg hover:bg-purple-200 transition-colors">
                    Dashboard
                  </Link>
                </div>
              ) : isAuthenticated ? (
                <div className="flex items-center space-x-2">
                  <User className="w-5 h-5 text-purple-600" />
                  <span className="font-semibold text-gray-700">Hi, {user?.phone.slice(-4)}</span>
                  <Link href="/account" className="ml-2 px-3 py-1.5 bg-purple-100 text-purple-700 text-sm font-medium rounded-lg hover:bg-purple-200 transition-colors">
                    Account
                  </Link>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={openAuthModal}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  Get Started
                </button>
              )}
            </div>

            {/* Mobile Right: Wishlist + Cart + Hamburger */}
            <div className="md:hidden flex items-center gap-1">
              {/* Wishlist icon — mobile */}
              {!isSellerAuthenticated && !isPartnerAuthenticated && (
                <Link href="/wishlist" className="relative p-2 rounded-xl hover:bg-rose-50 transition-colors">
                  <Heart className={`w-6 h-6 ${wishlistItems.length > 0 ? 'fill-rose-500 text-rose-500' : 'text-gray-600'}`} />
                  {wishlistItems.length > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-white text-[10px] font-black flex items-center justify-center shadow-md shadow-rose-200">
                      {wishlistItems.length > 99 ? '99+' : wishlistItems.length}
                    </span>
                  )}
                </Link>
              )}

              <Link href="/cart" className="relative p-2 rounded-xl hover:bg-violet-50 transition-colors">
                <ShoppingCart className="w-6 h-6 text-gray-600" />
                {totalCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white text-[10px] font-black flex items-center justify-center shadow-md shadow-violet-200">
                    {totalCount > 99 ? '99+' : totalCount}
                  </span>
                )}
              </Link>

              <button
                type="button"
                onClick={toggleMobileMenu}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Dropdown Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden pb-4 border-t border-gray-200">
              <div className="flex flex-col space-y-2 pt-4">
                <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="text-gray-700 hover:text-purple-600 font-medium py-2 px-2 rounded-lg hover:bg-purple-50 transition-all min-h-[44px] flex items-center">
                  Home
                </Link>
                <Link href="/shops" onClick={() => setIsMobileMenuOpen(false)} className="text-gray-700 hover:text-purple-600 font-medium py-2 px-2 rounded-lg hover:bg-purple-50 transition-all min-h-[44px] flex items-center">
                  Shops
                </Link>
                <Link href="/orders" onClick={() => setIsMobileMenuOpen(false)} className="text-gray-700 hover:text-purple-600 font-medium py-2 px-2 rounded-lg hover:bg-purple-50 transition-all min-h-[44px] flex items-center">
                  Track Order
                </Link>

                {/* Wishlist in mobile menu */}
                {!isSellerAuthenticated && !isPartnerAuthenticated && (
                  <Link
                    href="/wishlist"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-2 text-gray-700 hover:text-rose-500 font-medium py-2 px-2 rounded-lg hover:bg-rose-50 transition-all min-h-[44px]"
                  >
                    <Heart className={`w-5 h-5 ${wishlistItems.length > 0 ? 'fill-rose-500 text-rose-500' : 'text-gray-500'}`} />
                    <span>Wishlist</span>
                    {wishlistItems.length > 0 && (
                      <span className="ml-auto text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-50 text-rose-500 border border-rose-200">
                        {wishlistItems.length}
                      </span>
                    )}
                  </Link>
                )}

                <div className="pt-2 border-t border-gray-100">
                  {isPartnerAuthenticated ? (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2 py-2 px-2 bg-indigo-50 rounded-lg">
                        <span className="text-lg">🛵</span>
                        <div>
                          <p className="text-xs font-black text-indigo-500 uppercase tracking-widest">Delivery Partner</p>
                          <p className="font-bold text-gray-800 text-sm">{partner?.name}</p>
                        </div>
                      </div>
                      <Link href="/partner/delivery" onClick={() => setIsMobileMenuOpen(false)} className="py-2 px-2 rounded-lg bg-indigo-100 text-indigo-700 font-semibold text-sm text-center transition-all hover:bg-indigo-200 min-h-[44px] flex items-center justify-center">
                        Go to Dashboard
                      </Link>
                      <button
                        type="button"
                        onClick={() => { logoutPartner(); setIsMobileMenuOpen(false); }}
                        className="py-2 px-2 rounded-lg bg-gray-100 text-gray-500 font-semibold text-sm transition-all hover:bg-gray-200 min-h-[44px]"
                      >
                        Logout
                      </button>
                    </div>
                  ) : isSellerAuthenticated ? (
                    <Link href="/seller/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center space-x-2 py-2 px-2 rounded-lg bg-purple-50 hover:bg-purple-100 transition-all w-full min-h-[44px]">
                      <span>🏪</span><span className="font-medium text-purple-700">Seller Dashboard</span>
                    </Link>
                  ) : isAuthenticated ? (
                    <Link href="/account" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center space-x-2 py-2 px-2 rounded-lg hover:bg-purple-50 transition-all w-full min-h-[44px]">
                      <User className="w-5 h-5 text-purple-600" /><span className="font-medium text-gray-700">My Account</span>
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={openAuthModal}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-xl font-semibold mt-1 transition-all shadow-md hover:shadow-lg min-h-[44px]"
                    >
                      Get Started
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      </nav>

      <PhoneAuthModal isOpen={showAuthModal} onClose={closeAuthModal} />
    </>
  );
};

export default Navbar;