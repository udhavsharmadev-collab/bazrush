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
  const [alreadyPending, setAlreadyPending] = useState(false);

  // ── COD loader — IDENTICAL logic to admin FinanceTab ─────────────────────
  // Admin uses: skip if placedAt <= lastSettledAt
  // We use the same here so both sides always show the same number
  const loadCod = async (settledAt) => {
    setLiveCodLoading(true);
    try {
      const res = await fetch("/api/orders?all=true");
      const all = await res.json();
      if (!Array.isArray(all)) return;

      const cutoff = settledAt ? new Date(settledAt) : null;

      const total = all
        .filter(o => {
          if (o.assignedPartner !== partner.phoneNumber) return false;
          if (o.status !== "delivered") return false;
          if (!isCod(o.paymentMethod)) return false;
          // ✅ Same as admin: use placedAt vs lastSettledAt
          if (cutoff && o.placedAt && new Date(o.placedAt) <= cutoff) return false;
          return true;
        })
        .reduce((sum, o) => sum + (o.totalPrice ?? 0), 0);

      setLiveCodTotal(total);
    } catch {}
    finally { setLiveCodLoading(false); }
  };

  // Re-run immediately when lastSettledAt changes (admin confirmed → parent
  // 10s poll pushes fresh partner here → this fires → total resets to ₹0)
  useEffect(() => {
    loadCod(partner.lastSettledAt);

    const id = setInterval(() => loadCod(partner.lastSettledAt), 30_000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partner.phoneNumber, partner.lastSettledAt]);

  // Sync pending badge
  useEffect(() => {
    setAlreadyPending(!!partner.settlementPending);
  }, [partner.settlementPending]);

  const handleIPaid = async () => {
    if (liveCodTotal === 0) return;
    setPaidLoading(true);
    try {
      const res = await fetch("/api/delivery-partners", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: partner.phoneNumber,
          settlementPending: true,
          settlementAmount: liveCodTotal,
          settlementRequestedAt: new Date().toISOString(),
        }),
      });
      if (res.ok) {
        setPaidSuccess(true);
        setAlreadyPending(true);
        onPartnerUpdate?.();
        setTimeout(() => setPaidSuccess(false), 3000);
      }
    } catch {}
    finally { setPaidLoading(false); }
  };

  const adminUpiId = partner.adminUpiId || "admin@upi";

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
              : <p className="text-base font-black text-amber-600">{fmtRupee(liveCodTotal)}</p>
            }
          </div>
          {alreadyPending && (
            <span className="text-[10px] font-black text-orange-500 bg-orange-50 border border-orange-200 px-2 py-1 rounded-lg">
              ⏳ Pending
            </span>
          )}
          {!alreadyPending && liveCodTotal === 0 && partner.lastSettledAt && (
            <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-lg">
              ✅ Settled
            </span>
          )}
        </div>

        {/* Action buttons — only show if there's cash to deposit */}
        {liveCodTotal > 0 && (
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
              disabled={paidLoading || alreadyPending}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black transition-all border ${
                paidSuccess
                  ? "bg-emerald-50 border-emerald-200 text-emerald-600"
                  : alreadyPending
                  ? "bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
              }`}
            >
              {paidLoading ? "⏳ Sending..." : paidSuccess ? "✅ Notified!" : alreadyPending ? "✅ Notified" : "✅ I Paid!"}
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
              <p className="text-sm text-gray-400">Send {fmtRupee(liveCodTotal)} to admin UPI</p>
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
                <p className="text-2xl font-black text-amber-600">{fmtRupee(liveCodTotal)}</p>
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