"use client";

import { useState, useEffect } from "react";

const isCod = (method) => {
  if (!method) return false;
  const m = method.toLowerCase();
  return m === "cod" || m === "cash" || m.includes("cash");
};

const fmtRupee = (n) => `₹${(n ?? 0).toLocaleString("en-IN")}`;

export default function FinancePanel({ partner, onPartnerUpdate }) {
  const [liveCodTotal, setLiveCodTotal]     = useState(0);
  const [liveCodLoading, setLiveCodLoading] = useState(false);
  const [showUpiModal, setShowUpiModal]     = useState(false);
  const [paidLoading, setPaidLoading]       = useState(false);
  const [paidSuccess, setPaidSuccess]       = useState(false);

  // ── Single source of truth: DB field settlementPending ───────────────────
  // isPending comes directly from DB via 8s poll in parent — no local state
  const isPending = !!partner.settlementPending;

  const loadCod = async () => {
    // If partner already said I Paid → always 0, no recalculation ever
    if (partner.settlementPending) {
      setLiveCodTotal(0);
      return;
    }
    setLiveCodLoading(true);
    try {
      const res = await fetch("/api/orders?all=true");
      const all = await res.json();
      if (!Array.isArray(all)) return;

      const cutoff = partner.lastSettledAt ? new Date(partner.lastSettledAt) : null;

      const total = all
        .filter(o => {
          if (o.assignedPartner !== partner.phoneNumber) return false;
          if (o.status !== "delivered") return false;
          if (!isCod(o.paymentMethod)) return false;
          if (cutoff && o.deliveredAt && new Date(o.deliveredAt) <= cutoff) return false;
          return true;
        })
        .reduce((sum, o) => sum + (o.totalPrice ?? 0), 0);

      setLiveCodTotal(total);
    } catch {}
    finally { setLiveCodLoading(false); }
  };

  // Fires on every partner update from 8s poll
  useEffect(() => {
    loadCod();
    const id = setInterval(loadCod, 30_000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partner.phoneNumber, partner.lastSettledAt, partner.settlementPending]);

  const handleIPaid = async () => {
    if (liveCodTotal === 0) return;
    setPaidLoading(true);
    const amount = liveCodTotal;
    // Instantly lock UI before API call
    setLiveCodTotal(0);
    try {
      await fetch("/api/delivery-partners", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber:           partner.phoneNumber,
          settlementPending:     true,
          settlementAmount:      amount,
          settlementRequestedAt: new Date().toISOString(),
        }),
      });
      setPaidSuccess(true);
      onPartnerUpdate?.();
      setTimeout(() => setPaidSuccess(false), 3000);
    } catch {}
    finally { setPaidLoading(false); }
  };

  const adminUpiId = partner.adminUpiId || "admin@upi";

  // Display amount — if pending always 0, driven by DB not local state
  const displayAmount = isPending ? 0 : liveCodTotal;
  const showButtons   = !isPending && displayAmount > 0;

  return (
    <>
      <div className="bg-white border border-gray-100 rounded-2xl px-4 py-3 shadow-sm space-y-3">

        {/* Cash Collected row */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-lg flex-shrink-0">
            💵
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Cash Collected</p>
            {liveCodLoading
              ? <div className="h-4 w-14 bg-gray-100 rounded animate-pulse mt-0.5" />
              : <p className="text-base font-black text-amber-600">{fmtRupee(displayAmount)}</p>
            }
          </div>
          {isPending && (
            <span className="text-[10px] font-black text-orange-500 bg-orange-50 border border-orange-200 px-2 py-1 rounded-lg">
              ⏳ Pending
            </span>
          )}
          {!isPending && displayAmount === 0 && partner.lastSettledAt && (
            <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-lg">
              ✅ Settled
            </span>
          )}
        </div>

        {/* Pending notice */}
        {isPending && (
          <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-xl px-3 py-2">
            <span className="text-base">⏳</span>
            <p className="text-xs font-black text-orange-600">Payment notified — waiting for admin confirmation</p>
          </div>
        )}

        {/* Action buttons — only when not pending and has cash */}
        {showButtons && (
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowUpiModal(true)}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-violet-50 border border-violet-200 text-violet-700 text-xs font-black hover:bg-violet-100 transition-all"
            >
              📲 Deposit via UPI
            </button>
            <button
              type="button"
              onClick={handleIPaid}
              disabled={paidLoading}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black transition-all border ${
                paidSuccess
                  ? "bg-emerald-50 border-emerald-200 text-emerald-600"
                  : "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
              }`}
            >
              {paidLoading ? "⏳ Sending..." : paidSuccess ? "✅ Notified!" : "✅ I Paid!"}
            </button>
          </div>
        )}

      </div>

      {/* UPI Modal */}
      {showUpiModal && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
          onClick={() => setShowUpiModal(false)}
        >
          <div
            className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-6 space-y-5"
            onClick={e => e.stopPropagation()}
          >
            <div className="text-center space-y-1">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-2xl mx-auto shadow-lg shadow-violet-200">
                📲
              </div>
              <h3 className="text-lg font-black text-gray-900 mt-3">Deposit Cash</h3>
              <p className="text-sm text-gray-400">Send {fmtRupee(displayAmount)} to admin UPI</p>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 text-center space-y-2">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">UPI ID</p>
              <p className="text-xl font-black text-gray-900 break-all">{adminUpiId}</p>
              <button
                type="button"
                onClick={() => navigator.clipboard?.writeText(adminUpiId)}
                className="text-xs font-bold text-violet-600 hover:text-violet-800 transition-colors"
              >
                📋 Copy UPI ID
              </button>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
              <span className="text-2xl">💵</span>
              <div>
                <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Amount to Send</p>
                <p className="text-2xl font-black text-amber-600">{fmtRupee(displayAmount)}</p>
              </div>
            </div>

            <p className="text-xs text-gray-400 text-center">
              After sending, tap <span className="font-black text-gray-600">"I Paid!"</span> to notify the admin.
            </p>

            <button
              type="button"
              onClick={() => setShowUpiModal(false)}
              className="w-full py-3 rounded-2xl bg-gray-100 text-gray-500 font-black text-sm hover:bg-gray-200 transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}