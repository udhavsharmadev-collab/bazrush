"use client";

import { useState, useEffect, useCallback } from 'react';
import { useSeller } from '../../../context/SellerContext';
import { Wallet, MapPin, CreditCard, Smartphone, CheckCircle2, Clock, XCircle } from 'lucide-react';

function getNetShopAmount(shop) {
  const subtotal = shop?.subtotal || 0;
  const discount = shop?.couponDiscount || 0;
  return Math.max(subtotal - discount, 0);
}

const WithdrawTab = ({ seller }) => {
  const { requestWithdraw } = useSeller();
  const sellerPhone = seller?.phoneNumber;

  const [totalRevenue, setTotalRevenue] = useState(0);
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [requests, setRequests] = useState([]);

  const [formData, setFormData] = useState({
    name: seller?.name || '',
    phone: seller?.phone || '',
    addressLine: '',
    landmark: '',
    city: '',
    state: '',
    pincode: '',
    paymentMode: 'upi',
    upiId: '',
    bankDetails: { accountHolderName: '', accountNumber: '', ifsc: '', bankName: '' },
    amount: '',
  });
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadRevenue = useCallback(async () => {
    if (!sellerPhone) return;
    setBalanceLoading(true);
    try {
      const sellerRes = await fetch(`/api/sellers?phoneNumber=${encodeURIComponent(sellerPhone)}`);
      const sellerData = await sellerRes.json();
      const shops = sellerData?.seller?.shops || [];
      const shopIds = new Set(shops.map(s => s.id));

      const usersRes = await fetch('/api/users');
      const users = await usersRes.json();

      let revenue = 0;
      for (const [, userData] of Object.entries(users)) {
        for (const order of (userData.orders || [])) {
          for (const shopEntry of (order.shops || [])) {
            if (shopIds.has(shopEntry.shopId)) revenue += getNetShopAmount(shopEntry);
          }
        }
      }
      setTotalRevenue(revenue);
    } catch (err) {
      console.error('Revenue load failed:', err);
    } finally {
      setBalanceLoading(false);
    }
  }, [sellerPhone]);

  const fetchRequests = useCallback(async () => {
    if (!sellerPhone) return;
    try {
      const res = await fetch(`/api/withdraw?phoneNumber=${encodeURIComponent(sellerPhone)}`);
      const data = await res.json();
      if (res.ok) setRequests(data.requests);
    } catch (err) { console.error(err); }
  }, [sellerPhone]);

  useEffect(() => {
    loadRevenue();
    fetchRequests();
  }, [loadRevenue, fetchRequests]);

  // Already pending or approved withdrawals reduce what's left available to request
  const reserved = requests
    .filter(r => r.status === 'pending' || r.status === 'approved')
    .reduce((s, r) => s + Number(r.amount || 0), 0);

  const availableBalance = Math.max(totalRevenue - reserved, 0);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('bank_')) {
      const key = name.replace('bank_', '');
      setFormData(prev => ({ ...prev, bankDetails: { ...prev.bankDetails, [key]: value } }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    if (!formData.name.trim() || !formData.phone.trim()) {
      setMessage('❌ Please fill your name and phone number'); return;
    }
    if (!formData.addressLine.trim() || !formData.city.trim() || !formData.state.trim() || !formData.pincode.trim()) {
      setMessage('❌ Please complete the address fields'); return;
    }
    if (!/^\d{6}$/.test(formData.pincode.trim())) {
      setMessage('❌ Enter a valid 6-digit pincode'); return;
    }
    if (!formData.amount || Number(formData.amount) <= 0) {
      setMessage('❌ Enter a valid amount'); return;
    }
    if (Number(formData.amount) > availableBalance) {
      setMessage(`❌ You can't withdraw more than your available balance (₹${availableBalance.toLocaleString('en-IN')})`); return;
    }
    if (formData.paymentMode === 'upi' && !formData.upiId.trim()) {
      setMessage('❌ Please enter your UPI ID'); return;
    }
    if (formData.paymentMode === 'bank') {
      const { accountHolderName, accountNumber, ifsc, bankName } = formData.bankDetails;
      if (!accountHolderName.trim() || !accountNumber.trim() || !ifsc.trim() || !bankName.trim()) {
        setMessage('❌ Please fill all bank details'); return;
      }
    }

    const address = `${formData.addressLine}${formData.landmark ? ', Near ' + formData.landmark : ''}, ${formData.city}, ${formData.state} - ${formData.pincode}`;

    setSubmitting(true);
    try {
      const result = await requestWithdraw({ ...formData, address });
      if (result.success) {
        setMessage('✅ Withdrawal request submitted successfully!');
        setFormData(prev => ({
          ...prev, addressLine: '', landmark: '', city: '', state: '', pincode: '',
          upiId: '', amount: '', bankDetails: { accountHolderName: '', accountNumber: '', ifsc: '', bankName: '' },
        }));
        fetchRequests();
        loadRevenue();
      } else {
        setMessage(`❌ ${result.error}`);
      }
    } catch (err) {
      setMessage(`❌ ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const statusStyle = {
    pending:  { color: 'bg-yellow-100 text-yellow-700', icon: Clock },
    approved: { color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
    rejected: { color: 'bg-red-100 text-red-700', icon: XCircle },
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Withdraw Earnings</h2>
        <p className="text-gray-500 text-sm mt-1">Request a payout of your available balance</p>
      </div>

      {/* Balance card */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-2xl p-6 text-white flex items-center justify-between shadow-lg shadow-purple-200">
        <div>
          <p className="text-purple-100 text-sm font-medium">Available Balance</p>
          <p className="text-3xl font-black mt-1">
            {balanceLoading ? '...' : `₹${availableBalance.toLocaleString('en-IN')}`}
          </p>
          {reserved > 0 && !balanceLoading && (
            <p className="text-purple-200 text-xs mt-1">₹{reserved.toLocaleString('en-IN')} already requested</p>
          )}
        </div>
        <div className="w-14 h-14 bg-white/15 rounded-2xl flex items-center justify-center">
          <Wallet className="w-7 h-7" />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-purple-100 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Contact */}
          <div>
            <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-purple-500" /> Contact Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Full Name</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Phone Number</label>
                <input type="tel" name="phone" value={formData.phone} onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm" />
              </div>
            </div>
          </div>

          {/* Address */}
          <div>
            <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-purple-500" /> Address
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">House No, Street, Area</label>
                <input type="text" name="addressLine" value={formData.addressLine} onChange={handleChange} placeholder="e.g. 12/4, MG Road"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Landmark (optional)</label>
                <input type="text" name="landmark" value={formData.landmark} onChange={handleChange} placeholder="e.g. Near City Hospital"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">City</label>
                  <input type="text" name="city" value={formData.city} onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">State</label>
                  <input type="text" name="state" value={formData.state} onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Pincode</label>
                  <input type="text" name="pincode" value={formData.pincode} onChange={handleChange} maxLength={6}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm" />
                </div>
              </div>
            </div>
          </div>

          {/* Amount */}
          <div>
            <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
              <Wallet className="w-4 h-4 text-purple-500" /> Amount
            </h3>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">₹</span>
              <input type="number" name="amount" value={formData.amount} onChange={handleChange} placeholder="0"
                className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm" />
            </div>
            <p className="text-xs text-gray-400 mt-1">Max: ₹{availableBalance.toLocaleString('en-IN')}</p>
          </div>

          {/* Payment mode */}
          <div>
            <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-purple-500" /> Payment Mode
            </h3>
            <div className="flex gap-3 mb-4">
              <button type="button" onClick={() => setFormData(prev => ({ ...prev, paymentMode: 'upi' }))}
                className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition ${formData.paymentMode === 'upi' ? 'bg-purple-600 text-white border-purple-600' : 'border-gray-200 text-gray-600 hover:bg-purple-50'}`}>
                UPI
              </button>
              <button type="button" onClick={() => setFormData(prev => ({ ...prev, paymentMode: 'bank' }))}
                className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition ${formData.paymentMode === 'bank' ? 'bg-purple-600 text-white border-purple-600' : 'border-gray-200 text-gray-600 hover:bg-purple-50'}`}>
                Bank Transfer
              </button>
            </div>

            {formData.paymentMode === 'upi' ? (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">UPI ID</label>
                <input type="text" name="upiId" value={formData.upiId} onChange={handleChange} placeholder="yourname@upi"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Account Holder Name</label>
                  <input type="text" name="bank_accountHolderName" value={formData.bankDetails.accountHolderName} onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Account Number</label>
                  <input type="text" name="bank_accountNumber" value={formData.bankDetails.accountNumber} onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">IFSC Code</label>
                  <input type="text" name="bank_ifsc" value={formData.bankDetails.ifsc} onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Bank Name</label>
                  <input type="text" name="bank_bankName" value={formData.bankDetails.bankName} onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm" />
                </div>
              </div>
            )}
          </div>

          {message && (
            <p className={`text-sm font-medium ${message.startsWith('✅') ? 'text-green-600' : 'text-red-500'}`}>{message}</p>
          )}

          <button type="submit" disabled={submitting}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold shadow-lg shadow-purple-200 hover:opacity-90 transition disabled:opacity-50">
            {submitting ? 'Submitting...' : 'Request Withdrawal'}
          </button>
        </form>
      </div>

      {/* Past requests */}
      <div className="bg-white rounded-2xl shadow-sm border border-purple-100 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Past Requests</h3>
        {requests.length === 0 ? (
          <p className="text-gray-400 text-sm">No withdrawal requests yet</p>
        ) : (
          <div className="space-y-3">
            {requests.map((r) => {
              const { color, icon: Icon } = statusStyle[r.status] || statusStyle.pending;
              return (
                <div key={r._id} className="flex items-center justify-between border border-gray-100 rounded-xl p-4">
                  <div>
                    <p className="font-bold text-gray-800">₹{Number(r.amount).toLocaleString('en-IN')}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {r.paymentMode === 'upi' ? r.upiId : r.bankDetails?.bankName} · {new Date(r.createdAt).toLocaleDateString('en-IN')}
                    </p>
                  </div>
                  <span className={`text-xs px-3 py-1.5 rounded-full font-semibold flex items-center gap-1 ${color}`}>
                    <Icon className="w-3.5 h-3.5" /> {r.status}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default WithdrawTab;