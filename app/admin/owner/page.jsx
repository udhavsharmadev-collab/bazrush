"use client";

import { useState, useEffect, useCallback } from "react";
import OverviewTab, { Spinner } from "./owneroverviewtab";
import { ShopsTab, PartnersTab, SellersTab } from "./ownertabs";
import FinanceTab from "./financepage";
import ClassyOwnerAuth from "./classyauth";

const APIS = {
  sellers:          "/api/sellers",
  users:            "/api/users",
  deliveryPartners: "/api/delivery-partners",
  orders:           "/api/orders?all=true",
};

export default function ClassyOwnerPanel() {
  const [authed, setAuthed] = useState(false);
  const [tab, setTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState({ users: {}, sellers: [], partners: {}, allOrders: [] });

  const load = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const [usersRes, sellersRes, partnersRes, ordersRes] = await Promise.all([
        fetch(APIS.users),
        fetch(APIS.sellers),
        fetch(APIS.deliveryPartners),
        fetch(APIS.orders),
      ]);

      const [usersData, sellersData, partnersData, ordersData] = await Promise.all([
        usersRes.json(),
        sellersRes.json(),
        partnersRes.json(),
        ordersRes.json(),
      ]);

      setData({
        users:     usersData   || {},
        sellers:   Array.isArray(sellersData) ? sellersData : [],
        partners:  partnersData || {},
        allOrders: Array.isArray(ordersData)  ? ordersData  : [],
      });
    } catch {
      setError("Failed to load data — check your API routes.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Only fetch data once the owner has passed all 3 auth steps
  useEffect(() => {
    if (authed) load();
  }, [authed, load]);

  const tabs = [
    { id: "overview", label: "Overview",  emoji: "📊" },
    { id: "shops",    label: "Shops",     emoji: "🏪" },
    { id: "partners", label: "Partners",  emoji: "🛵" },
    { id: "sellers",  label: "Sellers",   emoji: "👨‍💼" },
    { id: "finance",  label: "Finance",   emoji: "💰" },
  ];

  // ── Show auth gate until all 3 steps pass ──────────────────────────────
  if (!authed) return <ClassyOwnerAuth onAuthenticated={() => setAuthed(true)} />;

  // ── Owner panel (unchanged) ────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">

      {/* Purple gradient header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 shadow-xl shadow-purple-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center font-black text-white text-sm">
                C
              </div>
              <div>
                <span className="font-black text-white text-lg leading-none">Classy</span>
                <span className="ml-2 text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  Owner
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-purple-200 text-xs font-semibold">Live</span>
            </div>
          </div>

          {/* Tabs sit flush at bottom of header */}
          <div className="flex gap-1">
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-5 py-3 text-sm font-black rounded-t-xl transition-all ${
                  tab === t.id
                    ? "bg-gray-50 text-purple-700"
                    : "text-purple-200 hover:text-white hover:bg-white/10"
                }`}
              >
                <span className="mr-1.5">{t.emoji}</span>{t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Page content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600 font-semibold">
            ⚠️ {error}
          </div>
        )}

        {loading ? (
          <Spinner />
        ) : (
          <>
            {tab === "overview" && <OverviewTab data={data} onRefresh={() => load(true)} refreshing={refreshing} />}
            {tab === "shops"    && <ShopsTab    data={data} />}
            {tab === "partners" && <PartnersTab data={data} />}
            {tab === "sellers"  && <SellersTab  data={data} />}
            {tab === "finance"  && <FinanceTab  />}
          </>
        )}
      </div>
    </div>
  );
}