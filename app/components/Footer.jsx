"use client";

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Mail, MapPin } from 'lucide-react';
import { FaInstagram, FaFacebookF } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import { useSeller } from '../context/SellerContext';

const Footer = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { isSellerAuthenticated } = useSeller();

  const isSellerPage = pathname?.includes('/seller');
  const hideBanner = isSellerPage || isSellerAuthenticated;

  const handleSellerClick = () => {
    router.push('/seller/login');
  };

  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">

        {!hideBanner && (
          <div className="mb-12 bg-gradient-to-r from-purple-600 via-purple-700 to-purple-800 rounded-3xl p-8 lg:p-12 shadow-2xl border border-purple-500/50 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl" />
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="text-white flex-1">
                <div className="flex items-center space-x-3 mb-4">
                  <span className="text-4xl animate-pulse">&#9889;</span>
                  <h3 className="text-3xl lg:text-4xl font-black">Join Bazrush Sellers</h3>
                </div>
                <p className="text-purple-100 text-lg leading-relaxed">
                  Start your business with lightning-fast delivery. Reach thousands of customers in minutes.
                </p>
              </div>
              <button
                onClick={handleSellerClick}
                className="group relative px-8 py-4 lg:py-5 lg:px-10 bg-white text-purple-700 font-bold text-lg rounded-2xl transition-all duration-300 hover:scale-110 hover:shadow-2xl whitespace-nowrap overflow-hidden cursor-pointer"
              >
                <span className="relative z-10 flex items-center space-x-2">
                  <span>Become a Seller</span>
                  <span className="group-hover:translate-x-1 transition-transform duration-300">&#8594;</span>
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-100 to-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">

          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-purple-700 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl">&#9889;</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
                  Bazrush
                </h3>
                <p className="text-sm text-gray-500">Lightning Fast Delivery</p>
              </div>
            </div>
            <p className="text-gray-600 leading-relaxed max-w-md">
              Delivering your essentials in 20-25 minutes. Experience futuristic speed with bold energy.
            </p>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-6">Links</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/" className="text-gray-700 hover:text-purple-600 transition-colors duration-200 flex items-center space-x-2 group">
                  <span className="w-1 h-1 bg-purple-600 rounded-full group-hover:scale-150 transition-transform" />
                  <span>Home</span>
                </Link>
              </li>
              <li>
                <Link href="/shops" className="text-gray-700 hover:text-purple-600 transition-colors duration-200 flex items-center space-x-2 group">
                  <span className="w-1 h-1 bg-purple-600 rounded-full group-hover:scale-150 transition-transform" />
                  <span>Shops</span>
                </Link>
              </li>
              <li>
                <Link href="/track" className="text-gray-700 hover:text-purple-600 transition-colors duration-200 flex items-center space-x-2 group">
                  <span className="w-1 h-1 bg-purple-600 rounded-full group-hover:scale-150 transition-transform" />
                  <span>Track Order</span>
                </Link>
              </li>
              <li>
                <Link href="/partner/delivery" className="text-gray-700 hover:text-purple-600 transition-colors duration-200 flex items-center space-x-2 group">
                  <span className="w-1 h-1 bg-purple-600 rounded-full group-hover:scale-150 transition-transform" />
                  <span>Deliver with Bazrush</span>
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-6">Contact</h4>
            <div className="space-y-4">
              <div className="flex items-start space-x-3 p-3 bg-white/50 rounded-xl border border-gray-100 hover:shadow-sm transition-all">
                <Mail className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-900">supportbazrush@gmail.com</p>
                  <p className="text-xs text-gray-500">Get in touch</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-white/50 rounded-xl border border-gray-100 hover:shadow-sm transition-all">
                <MapPin className="w-5 h-5 text-purple-600 flex-shrink-0" />
                <span className="text-sm text-gray-700">Only in Panipat</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-6">Legal</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/legal/privacy" className="text-gray-700 hover:text-purple-600 transition-colors duration-200 flex items-center space-x-2 group">
                  <span className="w-1 h-1 bg-purple-600 rounded-full group-hover:scale-150 transition-transform" />
                  <span>Privacy Policy</span>
                </Link>
              </li>
              <li>
                <Link href="/legal/terms" className="text-gray-700 hover:text-purple-600 transition-colors duration-200 flex items-center space-x-2 group">
                  <span className="w-1 h-1 bg-purple-600 rounded-full group-hover:scale-150 transition-transform" />
                  <span>Terms &amp; Conditions</span>
                </Link>
              </li>
            </ul>
          </div>

        </div>

        <div className="border-t border-gray-200 pt-8 mt-12">
          <div className="flex justify-center items-center space-x-6 mb-6">
            <a
              href="https://www.instagram.com/bazrushindia/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-12 h-12 bg-white border-2 border-gray-200 rounded-2xl flex items-center justify-center text-2xl hover:bg-purple-600 hover:text-white hover:border-purple-600 transition-all duration-300 shadow-md hover:shadow-lg hover:scale-110"
              aria-label="Instagram"
            >
              <FaInstagram />
            </a>
            <a
              href="https://www.facebook.com/profile.php?id=61589130841728"
              target="_blank"
              rel="noopener noreferrer"
              className="w-12 h-12 bg-white border-2 border-gray-200 rounded-2xl flex items-center justify-center text-2xl hover:bg-purple-600 hover:text-white hover:border-purple-600 transition-all duration-300 shadow-md hover:shadow-lg hover:scale-110"
              aria-label="Facebook"
            >
              <FaFacebookF />
            </a>
            <a
              href="https://x.com/supportbazrush"
              target="_blank"
              rel="noopener noreferrer"
              className="w-12 h-12 bg-white border-2 border-gray-200 rounded-2xl flex items-center justify-center text-2xl hover:bg-purple-600 hover:text-white hover:border-purple-600 transition-all duration-300 shadow-md hover:shadow-lg hover:scale-110"
              aria-label="X (Twitter)"
            >
              <FaXTwitter />
            </a>
          </div>
          <p className="text-center text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} Bazrush. Lightning fast, made simple. All rights reserved.
          </p>
        </div>

      </div>
    </footer>
  );
};

export default Footer;