"use client";

import { useState, useEffect, useCallback } from "react";
import { Wallet, Clock, CheckCircle2, XCircle, RefreshCw, MapPin, Smartphone, CreditCard } from "lucide-react";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Rejected" },
];

const STATUS_STYLE = {
  pending:  { color: "bg-yellow-100 text-yellow-700", icon: Clock },
  approved: { color: "bg-green-100 text-green-700", icon: CheckCircle2 },
  rejected: { color: "bg-red-100 text-red-700", icon: XCircle },
};

export default function WithdrawalsTab() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("pending");
  const [actionId, setActionId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const load = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/withdraw?all=true");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      setRequests(data.requests || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id, status) => {
    setActionId(id);
    try {
      const res = await fetch("/api/withdraw", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");
      setRequests(prev => prev.map(r => (r._id === id ? data.request : r)));
    } catch (err) {
      alert(err.message);
    } finally {
      setActionId(null);
    }
  };

  const filtered = filter === "all" ? requests : requests.filter(r => r.status === filter);
  const pendingTotal = requests.filter(r => r.status === "pending").reduce((s, r) => s + Number(r.amount || 0), 0);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-32 gap-4">
      <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
      <p className="text-gray-400 font-semibold">Loading withdrawal requests...</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Withdrawal Requests</h2>
          <p className="text-sm text-gray-400 mt-0.5">Review and process seller payout requests</p>
        </div>
        <button
          onClick={() => load(true)}
          className="px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-600 rounded-xl font-bold text-sm border border-purple-200 transition-all flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600 font-semibold">
          ⚠️ {error}
        </div>
      )}

      {/* Pending total */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-2xl p-6 text-white flex items-center justify-between shadow-lg shadow-purple-200">
        <div>
          <p className="text-purple-100 text-sm font-medium">Pending Payout Total</p>
          <p className="text-3xl font-black mt-1">₹{pendingTotal.toLocaleString("en-IN")}</p>
        </div>
        <div className="w-14 h-14 bg-white/15 rounded-2xl flex items-center justify-center">
          <Wallet className="w-7 h-7" />
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              filter === f.id ? "bg-purple-600 text-white shadow-md shadow-purple-200" : "bg-white text-gray-500 border border-gray-200 hover:bg-purple-50"
            }`}
          >
            {f.label}
            {f.id !== "all" && (
              <span className="ml-1.5 opacity-70">({requests.filter(r => r.status === f.id).length})</span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-purple-100 py-16 text-center text-gray-300 font-semibold">
          No {filter !== "all" ? filter : ""} withdrawal requests
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(r => {
            const { color, icon: Icon } = STATUS_STYLE[r.status] || STATUS_STYLE.pending;
            const isExpanded = expandedId === r._id;
            return (
              <div key={r._id} className="bg-white rounded-2xl border border-purple-100 shadow-sm overflow-hidden">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : r._id)}
                  className="w-full flex items-center justify-between p-5 text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <Wallet className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-black text-gray-900">{r.name} <span className="text-gray-400 font-medium">· ₹{Number(r.amount).toLocaleString("en-IN")}</span></p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {r.seller?.phoneNumber || r.phone} · {new Date(r.createdAt).toLocaleDateString("en-IN")}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs px-3 py-1.5 rounded-full font-bold flex items-center gap-1 flex-shrink-0 ${color}`}>
                    <Icon className="w-3.5 h-3.5" /> {r.status}
                  </span>
                </button>

                {isExpanded && (
                  <div className="px-5 pb-5 pt-0 border-t border-gray-100">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-sm">
                      <div className="flex gap-2">
                        <Smartphone className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs text-gray-400 font-semibold">Contact</p>
                          <p className="text-gray-700">{r.name} · {r.phone}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <MapPin className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs text-gray-400 font-semibold">Address</p>
                          <p className="text-gray-700">{r.address}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 md:col-span-2">
                        <CreditCard className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs text-gray-400 font-semibold">Payment Details</p>
                          {r.paymentMode === "upi" ? (
                            <p className="text-gray-700">UPI: {r.upiId}</p>
                          ) : (
                            <p className="text-gray-700">
                              {r.bankDetails?.accountHolderName} · {r.bankDetails?.accountNumber} · {r.bankDetails?.ifsc} · {r.bankDetails?.bankName}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {r.status === "pending" && (
                      <div className="flex gap-3 mt-5">
                        <button
                          disabled={actionId === r._id}
                          onClick={() => updateStatus(r._id, "approved")}
                          className="flex-1 py-2.5 rounded-xl bg-green-600 text-white font-bold text-sm hover:bg-green-700 transition disabled:opacity-50"
                        >
                          {actionId === r._id ? "..." : "Approve"}
                        </button>
                        <button
                          disabled={actionId === r._id}
                          onClick={() => updateStatus(r._id, "rejected")}
                          className="flex-1 py-2.5 rounded-xl bg-red-50 text-red-600 border border-red-200 font-bold text-sm hover:bg-red-100 transition disabled:opacity-50"
                        >
                          {actionId === r._id ? "..." : "Reject"}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}