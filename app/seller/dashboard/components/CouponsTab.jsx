"use client";

import { useState, useEffect, useCallback } from 'react';
import { Tag, Plus, Trash2, Copy, Check, Sparkles, X } from 'lucide-react';

// Generate suggested coupon codes based on discount + min cart value
function generateSuggestions(discount, minCart) {
  const d = discount || 0;
  const m = minCart || 0;
  const suggestions = new Set();

  if (d > 0) {
    suggestions.add(`FLAT${d}`);
    suggestions.add(`SAVE${d}`);
    suggestions.add(`GET${d}OFF`);
  }
  if (m > 0) {
    suggestions.add(`BAZRUSH${m}`);
  }
  if (d > 0 && m > 0) {
    suggestions.add(`OFF${d}ON${m}`);
  }
  suggestions.add('WELCOME50');
  suggestions.add('FIRSTORDER');

  return Array.from(suggestions).slice(0, 5);
}

const CouponsTab = ({ seller }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [coupons, setCoupons] = useState([]);
  const [copiedCode, setCopiedCode] = useState(null);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    code: '',
    minCartValue: '',
    discountAmount: '',
  });

  const sellerPhone = seller?.phoneNumber;

  const loadCoupons = useCallback(async () => {
    if (!sellerPhone) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/coupons?sellerPhone=${encodeURIComponent(sellerPhone)}`);
      const data = await res.json();
      setCoupons(data?.coupons || []);
    } catch (err) {
      console.error('Failed to load coupons:', err);
    } finally {
      setLoading(false);
    }
  }, [sellerPhone]);

  useEffect(() => {
    loadCoupons();
  }, [loadCoupons]);

  const suggestions = generateSuggestions(
    Number(form.discountAmount),
    Number(form.minCartValue)
  );

  const handleSuggestionClick = (code) => {
    setForm((f) => ({ ...f, code }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const code = form.code.trim().toUpperCase();
    const minCartValue = Number(form.minCartValue);
    const discountAmount = Number(form.discountAmount);

    if (!code) {
      setError('Please enter a coupon code');
      return;
    }
    if (!discountAmount || discountAmount <= 0) {
      setError('Please enter a valid discount amount');
      return;
    }
    if (minCartValue < 0) {
      setError('Minimum cart value cannot be negative');
      return;
    }
    if (discountAmount > minCartValue && minCartValue > 0) {
      setError('Discount cannot exceed minimum cart value');
      return;
    }
    if (coupons.some((c) => c.code === code)) {
      setError('A coupon with this code already exists');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sellerPhone,
          code,
          minCartValue,
          discountAmount,
        }),
      });
      if (!res.ok) throw new Error('Failed to save coupon');
      const data = await res.json();
      setCoupons((prev) => [data.coupon, ...prev]);
      setForm({ code: '', minCartValue: '', discountAmount: '' });
    } catch (err) {
      console.error(err);
      setError('Something went wrong while saving the coupon');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (couponId) => {
    try {
      await fetch(`/api/coupons?id=${encodeURIComponent(couponId)}&sellerPhone=${encodeURIComponent(sellerPhone)}`, {
        method: 'DELETE',
      });
      setCoupons((prev) => prev.filter((c) => c.id !== couponId));
    } catch (err) {
      console.error('Failed to delete coupon:', err);
    }
  };

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 1500);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
        <p className="text-gray-400 font-semibold">Loading coupons...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Heading */}
      <div>
        <h2 className="text-2xl font-black text-gray-900">Coupons 🎟️</h2>
        <p className="text-sm text-gray-400 mt-0.5">Create discount codes to attract more buyers</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create coupon form */}
        <div className="lg:col-span-1 bg-white rounded-2xl p-6 shadow-lg border border-purple-100 h-fit">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 flex items-center justify-center flex-shrink-0">
              <Plus className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-black text-gray-900">New Coupon</h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Discount amount */}
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5">
                Discount Amount (₹)
              </label>
              <input
                type="number"
                min="1"
                placeholder="e.g. 50"
                value={form.discountAmount}
                onChange={(e) => setForm((f) => ({ ...f, discountAmount: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none text-sm font-semibold text-gray-800 transition-all"
              />
            </div>

            {/* Minimum cart value */}
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5">
                Minimum Cart Value (₹)
              </label>
              <input
                type="number"
                min="0"
                placeholder="e.g. 300"
                value={form.minCartValue}
                onChange={(e) => setForm((f) => ({ ...f, minCartValue: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none text-sm font-semibold text-gray-800 transition-all"
              />
            </div>

            {/* Coupon code */}
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5">
                Coupon Code
              </label>
              <input
                type="text"
                placeholder="e.g. SAVE50"
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none text-sm font-black uppercase tracking-wide text-purple-700 transition-all"
              />
            </div>

            {/* Suggestions */}
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-xs font-bold text-gray-500">Suggested codes</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleSuggestionClick(s)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black tracking-wide transition-all border ${
                      form.code === s
                        ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white border-transparent shadow-md shadow-purple-200'
                        : 'bg-purple-50 text-purple-600 border-purple-100 hover:bg-purple-100'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-50 border border-red-100 text-red-500 text-xs font-semibold">
                <X className="w-3.5 h-3.5 flex-shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 text-white font-black text-sm shadow-lg shadow-purple-200 hover:shadow-purple-300 transition-all disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Create Coupon'}
            </button>
          </form>
        </div>

        {/* Coupon list */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-lg border border-purple-100">
          <h3 className="text-lg font-black text-gray-900 mb-4">
            Your Coupons {coupons.length > 0 && <span className="text-purple-500">({coupons.length})</span>}
          </h3>

          {coupons.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
              <div className="w-14 h-14 rounded-2xl bg-purple-50 flex items-center justify-center">
                <Tag className="w-7 h-7 text-purple-300" />
              </div>
              <p className="text-gray-400 text-sm font-semibold">No coupons yet</p>
              <p className="text-gray-300 text-xs">Create your first coupon to start attracting buyers</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {coupons.map((c) => (
                <div
                  key={c.id}
                  className="relative bg-gradient-to-br from-purple-50 to-fuchsia-50 rounded-2xl p-4 border border-purple-100 overflow-hidden"
                >
                  {/* Decorative notch */}
                  <div className="absolute -left-2.5 top-1/2 -translate-y-1/2 w-5 h-5 bg-white rounded-full border border-purple-100" />
                  <div className="absolute -right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 bg-white rounded-full border border-purple-100" />

                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 flex items-center justify-center flex-shrink-0">
                        <Tag className="w-4 h-4 text-white" />
                      </div>
                      <span className="font-black text-purple-700 text-lg tracking-wide">{c.code}</span>
                    </div>
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-50 hover:text-red-500 transition-all flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-sm mb-3">
                    <div>
                      <p className="text-gray-400 text-[11px] font-semibold">Discount</p>
                      <p className="font-black text-gray-900">₹{c.discountAmount} OFF</p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-400 text-[11px] font-semibold">Min. cart</p>
                      <p className="font-black text-gray-900">
                        {c.minCartValue > 0 ? `₹${c.minCartValue}` : 'No minimum'}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleCopy(c.code)}
                    className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-white border border-purple-100 text-purple-600 text-xs font-bold hover:bg-purple-50 transition-all"
                  >
                    {copiedCode === c.code ? (
                      <>
                        <Check className="w-3.5 h-3.5" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" /> Copy code
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CouponsTab;