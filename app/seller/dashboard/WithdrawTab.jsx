"use client";

import { useState, useEffect } from 'react';
import { useSeller } from '../../../context/SellerContext';

const WithdrawTab = ({ seller }) => {
  const { requestWithdraw } = useSeller();
  const [formData, setFormData] = useState({
    name: seller?.name || '',
    phone: seller?.phone || '',
    address: '',
    paymentMode: 'upi',
    upiId: '',
    bankDetails: { accountHolderName: '', accountNumber: '', ifsc: '', bankName: '' },
    amount: '',
  });
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [requests, setRequests] = useState([]);

  useEffect(() => { fetchRequests(); }, [seller?.phoneNumber]);

  const fetchRequests = async () => {
    if (!seller?.phoneNumber) return;
    try {
      const res = await fetch(`/api/withdraw?phoneNumber=${encodeURIComponent(seller.phoneNumber)}`);
      const data = await res.json();
      if (res.ok) setRequests(data.requests);
    } catch (err) { console.error(err); }
  };

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
    if (!formData.name.trim() || !formData.phone.trim() || !formData.address.trim() || !formData.amount) {
      setMessage('❌ Please fill all required fields'); return;
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
    setSubmitting(true);
    try {
      const result = await requestWithdraw(formData);
      if (result.success) {
        setMessage('✅ Withdrawal request submitted successfully!');
        setFormData(prev => ({ ...prev, address: '', upiId: '', amount: '', bankDetails: { accountHolderName: '', accountNumber: '', ifsc: '', bankName: '' } }));
        fetchRequests();
      } else {
        setMessage(`❌ ${result.error}`);
      }
    } catch (err) {
      setMessage(`❌ ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const statusColor = {
    pending: 'bg-yellow-100 text-yellow-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Withdraw Earnings</h2>
        <p className="text-gray-500 text-sm mt-1">Submit a request to withdraw your available balance</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-purple-100 p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input type="tel" name="phone" value={formData.phone} onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Address</label>
            <textarea name="address" value={formData.address} onChange={handleChange} rows={2}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount to Withdraw (₹)</label>
            <input type="number" name="amount" value={formData.amount} onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Payment Mode</label>
            <div className="flex gap-3">
              <button type="button" onClick={() => setFormData(prev => ({ ...prev, paymentMode: 'upi' }))}
                className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition ${formData.paymentMode === 'upi' ? 'bg-purple-600 text-white border-purple-600' : 'border-gray-200 text-gray-600'}`}>
                UPI
              </button>
              <button type="button" onClick={() => setFormData(prev => ({ ...prev, paymentMode: 'bank' }))}
                className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition ${formData.paymentMode === 'bank' ? 'bg-purple-600 text-white border-purple-600' : 'border-gray-200 text-gray-600'}`}>
                Bank Transfer
              </button>
            </div>
          </div>

          {formData.paymentMode === 'upi' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">UPI ID</label>
              <input type="text" name="upiId" value={formData.upiId} onChange={handleChange} placeholder="yourname@upi"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account Holder Name</label>
                <input type="text" name="bank_accountHolderName" value={formData.bankDetails.accountHolderName} onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                <input type="text" name="bank_accountNumber" value={formData.bankDetails.accountNumber} onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">IFSC Code</label>
                <input type="text" name="bank_ifsc" value={formData.bankDetails.ifsc} onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                <input type="text" name="bank_bankName" value={formData.bankDetails.bankName} onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400" />
              </div>
            </div>
          )}

          {message && <p className="text-sm">{message}</p>}

          <button type="submit" disabled={submitting}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-purple-500 text-white font-medium hover:opacity-90 transition disabled:opacity-50">
            {submitting ? 'Submitting...' : 'Request Withdrawal'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-purple-100 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Past Requests</h3>
        {requests.length === 0 ? (
          <p className="text-gray-400 text-sm">No withdrawal requests yet</p>
        ) : (
          <div className="space-y-3">
            {requests.map((r) => (
              <div key={r._id} className="flex items-center justify-between border border-gray-100 rounded-xl p-4">
                <div>
                  <p className="font-medium text-gray-800">₹{r.amount}</p>
                  <p className="text-xs text-gray-400">{r.paymentMode === 'upi' ? r.upiId : r.bankDetails?.bankName} · {new Date(r.createdAt).toLocaleDateString()}</p>
                </div>
                <span className={`text-xs px-3 py-1 rounded-full font-medium ${statusColor[r.status]}`}>{r.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WithdrawTab;