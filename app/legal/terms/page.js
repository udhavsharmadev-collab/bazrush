"use client";

import Link from 'next/link';
import { ArrowLeft, FileText } from 'lucide-react';

const TermsPage = () => {
  return (
    <div className="min-h-screen py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-black via-purple-900/20 to-black">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-16 relative">
        <div className="bg-gradient-to-r from-purple-600 via-purple-700 to-purple-800 rounded-3xl p-8 lg:p-12 shadow-2xl border border-purple-500/50 text-white mb-12">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
              <FileText className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl lg:text-4xl font-black">Terms &amp; Conditions</h1>
              <p className="text-purple-100">Last updated: April  2026</p>
            </div>
          </div>
          <p className="text-lg text-purple-100 leading-relaxed">
            Welcome to <span className="font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">Bazrush</span>, We offer a fast and efficient delivery experience to get your essentials to you without delay. These Terms outline how you use our platform, interact with sellers, place orders, and receive deliveries.
          </p>
        </div>

        <Link 
          href="/legal" 
          className="inline-flex items-center space-x-2 text-purple-400 hover:text-purple-300 font-semibold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Legal Center</span>
        </Link>
      </div>

      <div className="max-w-4xl mx-auto space-y-12">
        {/* 1. Acceptance */}
        <section className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 lg:p-12 border border-white/20">
          <h2 className="text-2xl lg:text-3xl font-black text-white mb-6 flex items-center space-x-3">
            <span className="w-8 h-8 bg-purple-600 rounded-xl flex items-center justify-center text-sm font-bold">1</span>
            <span>Acceptance of Terms</span>
          </h2>
          <div className="space-y-4 text-purple-100 leading-relaxed">
            <p>By accessing Bazrush, you agree to these Terms, our <Link href="/legal/privacy" className="text-purple-300 hover:text-purple-200 font-semibold underline">Privacy Policy</Link>, and applicable Indian laws.</p>
<p>Bazrush operates as a hyperlocal delivery platform connecting customers with sellers for bazaar stuff in 10-15 minutes.</p>
          </div>
        </section>

        {/* 2. User Accounts */}
        <section className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 lg:p-12 border border-white/20">
          <h2 className="text-2xl lg:text-3xl font-black text-white mb-6 flex items-center space-x-3">
            <span className="w-8 h-8 bg-purple-600 rounded-xl flex items-center justify-center text-sm font-bold">2</span>
            <span>User Accounts</span>
          </h2>
          <ul className="space-y-3 text-purple-100 pl-6">
            <li>• You must be 18+ and reside in serviced areas.</li>
            <li>• Provide accurate info; we reserve right to suspend fake accounts.</li>
            <li>• Phone/OTP verification required for orders.</li>
            <li>• Keep credentials secure; notify us of breaches.</li>
          </ul>
        </section>

        {/* 3. Orders & Payments */}
        <section className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 lg:p-12 border border-white/20">
          <h2 className="text-2xl lg:text-3xl font-black text-white mb-6 flex items-center space-x-3">
            <span className="w-8 h-8 bg-purple-600 rounded-xl flex items-center justify-center text-sm font-bold">3</span>
            <span>Orders and Payments</span>
          </h2>
          <div className="space-y-4 text-purple-100 leading-relaxed">
            <p>Orders are non-cancellable post-confirmation. Delivery times approximate (10-30 min).</p>
            <p>Prices dynamic; GST/applicable taxes included. Payments via UPI/cards/wallets.</p>
            <p>Refunds per policy; no liability for out-of-stock items.</p>
          </div>
        </section>

        {/* 4. Sellers */}
        <section className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 lg:p-12 border border-white/20">
          <h2 className="text-2xl lg:text-3xl font-black text-white mb-6 flex items-center space-x-3">
            <span className="w-8 h-8 bg-purple-600 rounded-xl flex items-center justify-center text-sm font-bold">4</span>
            <span>Seller Services</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-6 text-purple-100">
            <div>
              <h4 className="font-semibold mb-3">Seller Responsibilities:</h4>
              <ul className="space-y-2 list-disc pl-5">
                <li>Quality fresh products</li>
                <li>Accurate inventory/pricing</li>
                <li>Timely packing</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Platform Fees:</h4>
              <p>Commission + delivery + taxes as per seller dashboard.</p>
            </div>
          </div>
        </section>

        {/* 5. Prohibited Conduct */}
        <section className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 lg:p-12 border border-white/20">
          <h2 className="text-2xl lg:text-3xl font-black text-white mb-6 flex items-center space-x-3">
            <span className="w-8 h-8 bg-purple-600 rounded-xl flex items-center justify-center text-sm font-bold">5</span>
            <span>Prohibited Activities</span>
          </h2>
          <ul className="grid md:grid-cols-2 gap-4 text-purple-100">
            <li className="flex items-start space-x-3 p-4 bg-white/10 rounded-2xl border border-white/20">
              <span className="w-6 h-6 bg-red-500/20 text-red-300 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">✕</span>
              <span>Fraudulent orders or payment manipulation</span>
            </li>
            <li className="flex items-start space-x-3 p-4 bg-white/10 rounded-2xl border border-white/20">
              <span className="w-6 h-6 bg-red-500/20 text-red-300 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">✕</span>
              <span>Abusing delivery partners</span>
            </li>
            <li className="flex items-start space-x-3 p-4 bg-white/10 rounded-2xl border border-white/20">
              <span className="w-6 h-6 bg-red-500/20 text-red-300 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">✕</span>
              <span>Illegal/restricted items</span>
            </li>
            <li className="flex items-start space-x-3 p-4 bg-white/10 rounded-2xl border border-white/20">
              <span className="w-6 h-6 bg-red-500/20 text-red-300 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">✕</span>
              <span>Automated scraping</span>
            </li>
          </ul>
        </section>

        {/* 6. Limitation of Liability */}
        <section className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 lg:p-12 border border-white/20">
          <h2 className="text-2xl lg:text-3xl font-black text-white mb-6 flex items-center space-x-3">
            <span className="w-8 h-8 bg-purple-600 rounded-xl flex items-center justify-center text-sm font-bold">6</span>
            <span>Liability &amp; Disclaimers</span>
          </h2>
          <div className="space-y-4 text-purple-100 leading-relaxed">
            <p>Bazrush is a platform only; not liable for product quality, delivery delays beyond control (traffic, weather), or seller actions.</p>
            <p>Total liability capped at order value. No consequential damages.</p>
            <p>Services "as-is"; we may modify/suspend without notice.</p>
          </div>
        </section>

        {/* 7. Governing Law */}
        <section className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 lg:p-12 border border-white/20">
          <h2 className="text-2xl lg:text-3xl font-black text-white mb-6 flex items-center space-x-3">
            <span className="w-8 h-8 bg-purple-600 rounded-xl flex items-center justify-center text-sm font-bold">7</span>
            <span>Governing Law</span>
          </h2>
          <p className="text-purple-100 leading-relaxed">
            Governed by laws of India. Disputes in courts of Delhi. Contact support@bazrush.com for questions.
          </p>
        </section>

        {/* Contact */}
        <div className="text-center pt-12 border-t border-white/20">
          <p className="text-purple-300 mb-6">Questions? Email us at <a href="mailto:support@bazrush.com" className="font-semibold underline hover:text-purple-200">support@bazrush.com</a></p>
          <Link href="/" className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-8 py-4 rounded-2xl font-semibold shadow-xl hover:shadow-2xl transition-all">
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;

