"use client";

import Link from "next/link";
import { ArrowLeft, Shield, MapPin, Smartphone } from "lucide-react";

const PrivacyPage = () => {
  return (
    <div className="min-h-screen py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-black via-purple-900/20 to-black">
      
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-16 relative">
        <div className="bg-gradient-to-r from-purple-600 via-purple-700 to-purple-800 rounded-3xl p-8 lg:p-12 shadow-2xl border border-purple-500/50 text-white mb-12 overflow-hidden">
          
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-xl -mr-16 -mt-16" />
          
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center p-4">
              <Shield className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl lg:text-4xl font-black">Privacy Policy</h1>
              <p className="text-purple-100">Last updated: April  2026</p>
            </div>
          </div>

          <p className="text-lg text-purple-100 leading-relaxed">
            At{" "}
            <span className="font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Bazrush
            </span>
            , We take your privacy seriously. Here’s how we collect, use, and protect your information to keep your experience fast, secure, and hassle-free.
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

      {/* Content */}
      <div className="max-w-4xl mx-auto space-y-12">

        {/* 1 */}
        <section className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20">
          <h2 className="text-2xl font-black text-white mb-8 flex items-center space-x-3">
            <span className="w-8 h-8 bg-purple-600 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0">1</span>
            <span>Information We Collect</span>
          </h2>

          <div className="grid md:grid-cols-2 gap-8 text-purple-100">
            <div>
              <h4 className="font-semibold mb-4 flex items-center space-x-2">
                <Smartphone className="w-5 h-5" />
                <span>Account Data</span>
              </h4>
              <ul className="space-y-2">
                <li>• Name, phone, email</li>
                <li>• Address history</li>
                <li>• Payment details (tokenized)</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4 flex items-center space-x-2">
                <MapPin className="w-5 h-5" />
                <span>Usage Data</span>
              </h4>
              <ul className="space-y-2">
                <li>• Order history</li>
                <li>• Location (delivery only)</li>
                <li>• Device info, IP</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 2 */}
        <section className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20">
          <h2 className="text-2xl font-black text-white mb-6 flex items-center space-x-3">
            <span className="w-8 h-8 bg-purple-600 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0">2</span>
            <span>How We Use Your Information</span>
          </h2>

          <ul className="space-y-2 text-purple-100 list-disc pl-6">
            <li>Process orders and deliveries</li>
            <li>Improve service (analytics)</li>
            <li>Send notifications/promos</li>
            <li>Prevent fraud</li>
            <li>Legal compliance (IT Act 2000, DPDP Act)</li>
          </ul>
        </section>

        {/* 3 */}
        <section className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20">
          <h2 className="text-2xl font-black text-white mb-6 flex items-center space-x-3">
            <span className="w-8 h-8 bg-purple-600 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0">3</span>
            <span>Data Sharing</span>
          </h2>

          <div className="space-y-3 text-purple-100">
            <p>Shared with sellers and delivery partners for fulfillment.</p>
            <p>Service providers (payment, cloud). No selling data.</p>
            <p>Legal/govt requests only.</p>
          </div>
        </section>

        {/* 4 */}
        <section className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20">
          <h2 className="text-2xl font-black text-white mb-6 flex items-center space-x-3">
            <span className="w-8 h-8 bg-purple-600 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0">4</span>
            <span>Cookies & Tracking</span>
          </h2>
          <p className="text-purple-100">
            Essential cookies for cart/login. Analytics cookies (Google). Manage in browser settings.
          </p>
        </section>

        {/* 5 */}
        <section className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20">
          <h2 className="text-2xl font-black text-white mb-6 flex items-center space-x-3">
            <span className="w-8 h-8 bg-purple-600 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0">5</span>
            <span>Security & Retention</span>
          </h2>

          <div className="grid md:grid-cols-2 gap-6 text-purple-100">
            <div>
              <h4 className="font-semibold mb-2">Security:</h4>
              <p>SSL encryption, Firebase Auth, regular audits.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Retention:</h4>
              <p>Order data 7 years; inactive accounts deletable.</p>
            </div>
          </div>
        </section>

        {/* 6 */}
        <section className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20">
          <h2 className="text-2xl font-black text-white mb-6 flex items-center space-x-3">
            <span className="w-8 h-8 bg-purple-600 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0">6</span>
            <span>Your Rights</span>
          </h2>

          <ul className="space-y-2 text-purple-100 pl-6">
            <li>• Access/delete your data</li>
            <li>• Opt-out marketing</li>
            <li>• No consent for children under 18</li>
          </ul>
        </section>

        {/* Footer */}
        <div className="text-center pt-12 border-t border-white/20 pb-20">
          <p className="text-purple-300 mb-6">
            Privacy concerns?{" "}
            <a href="mailto:privacy@bazrush.com" className="underline">
              privacy@bazrush.com
            </a>
          </p>

          <Link
            href="/"
            className="inline-flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage;