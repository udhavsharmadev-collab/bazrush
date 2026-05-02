"use client";

import Link from 'next/link';
import { ArrowLeft, FileText } from 'lucide-react';

const LegalHub = () => {
  return (
    <div className="min-h-screen py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-black via-purple-900/20 to-black">
      {/* Hero Section */}
      <div className="max-w-4xl mx-auto text-center mb-20 relative overflow-hidden rounded-3xl p-12 bg-gradient-to-r from-purple-600 via-purple-700 to-purple-800 text-white shadow-2xl border border-purple-500/50">
        <div className="absolute inset-0 bg-white/5 backdrop-blur-sm" />
        <div className="relative z-10">
          <div className="inline-flex items-center px-6 py-3 bg-white/20 backdrop-blur-sm rounded-2xl border border-white/30 mb-8">
            <FileText className="w-5 h-5 mr-2" />
            <span className="font-semibold">Bazrush Legal Center</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-black mb-6 bg-gradient-to-r from-white to-purple-100 bg-clip-text text-transparent">
            Legal Documents
          </h1>
          <p className="text-xl text-purple-100 max-w-2xl mx-auto leading-relaxed">
            Our Terms &amp; Conditions and Privacy Policy ensure safe, fast bazaar deliveries. Like Blinkit, we prioritize your trust and speed.
          </p>
        </div>
      </div>

      {/* Quick Links */}
      <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8 mb-20">
        <Link href="/legal/terms" className="group relative bg-white/10 backdrop-blur-lg border border-white/20 hover:border-purple-400 hover:bg-white/20 rounded-3xl p-10 lg:p-12 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 hover:scale-[1.02]">
          <div className="absolute -inset-2 bg-gradient-to-r from-purple-600/20 to-purple-800/20 rounded-3xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative flex flex-col items-center text-center h-full">
            <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-purple-700 rounded-3xl flex items-center justify-center mb-6 shadow-2xl group-hover:scale-110 transition-transform">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-black text-white mb-4">Terms &amp; Conditions</h3>
            <p className="text-purple-100 leading-relaxed">Our service terms for ultra-fast bazaar deliveries, payments, and seller partnerships.</p>
          </div>
        </Link>

        <Link href="/legal/privacy" className="group relative bg-white/10 backdrop-blur-lg border border-white/20 hover:border-purple-400 hover:bg-white/20 rounded-3xl p-10 lg:p-12 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 hover:scale-[1.02]">
          <div className="absolute -inset-2 bg-gradient-to-r from-purple-600/20 to-purple-800/20 rounded-3xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative flex flex-col items-center text-center h-full">
            <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-purple-700 rounded-3xl flex items-center justify-center mb-6 shadow-2xl group-hover:scale-110 transition-transform">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-2xl font-black text-white mb-4">Privacy Policy</h3>
            <p className="text-purple-100 leading-relaxed">How we protect your data, location, and order information securely.</p>
          </div>
        </Link>
      </div>

      {/* Back Home */}
      <div className="text-center">
        <Link 
          href="/" 
          className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-8 py-4 rounded-2xl font-semibold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Home</span>
        </Link>
      </div>
    </div>
  );
};

export default LegalHub;

