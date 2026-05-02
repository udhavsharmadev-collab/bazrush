"use client";

import { useState, useEffect } from "react";
import { DeliveryMap, StepBar } from "./delivery/Deliverymapcomponents";
import {
  formatDate,
  getRoadDistance,
  buildShopNavUrl,
  buildCustomerNavUrl,
  geocodeAddress,
} from "./DeliveryUtils";

// ── Order Card ────────────────────────────────────────────────────────────────
export function OrderCard({ order, partner, onAccept, onOutForDelivery, onDeliver, onReject }) {
  const [busy, setBusy] = useState(false);
  const [shopCoords, setShopCoords] = useState(null);
  const [geocoding, setGeocoding] = useState(false);
  const [dist, setDist] = useState(null);       // display string e.g. "3.2 km"
  const [distKm, setDistKm] = useState(null);   // raw number for earning calc

  // OTP state
  const [otpInput, setOtpInput] = useState("");
  const [otpError, setOtpError] = useState("");

  const shop = order.shops?.[0];

  const isMine = order.assignedPartner === partner.phoneNumber;
  const isAvailable = !order.assignedPartner && (order.status === "confirmed" || order.status === "preparing");
  const isHeadingToShop = isMine && order.status !== "out_for_delivery" && order.status !== "delivered";
  const isOutForDelivery = isMine && order.status === "out_for_delivery";
  const stepIndex = isOutForDelivery ? 1 : isMine ? 0 : -1;

  // Geocode shop address for Leaflet map when order is mine
  useEffect(() => {
    if (!isMine || !shop?.shopAddress || shopCoords) return;
    setGeocoding(true);
    geocodeAddress(shop.shopAddress).then((coords) => {
      setShopCoords(coords);
      setGeocoding(false);
    });
  }, [isMine, shop?.shopAddress]);

  // ✅ Real road distance via OSRM — also extract raw km for earning calc
  useEffect(() => {
    let cancelled = false;
    const fetchDist = async () => {
      let fromLat, fromLng, toLat, toLng;
      if (isOutForDelivery && shopCoords) {
        fromLat = shopCoords.lat; fromLng = shopCoords.lng;
        toLat = order.customer?.lat; toLng = order.customer?.lng;
      } else if ((isHeadingToShop || isAvailable) && partner.lat && shopCoords) {
        fromLat = partner.lat; fromLng = partner.lng;
        toLat = shopCoords.lat; toLng = shopCoords.lng;
      } else {
        return;
      }
      const result = await getRoadDistance(fromLat, fromLng, toLat, toLng);
      if (!cancelled && result) {
        setDist(result); // e.g. "3.2 km"
        // Parse raw km number from the string for earning calculation
        const parsed = parseFloat(result);
        if (!isNaN(parsed)) setDistKm(parsed);
      }
    };
    fetchDist();
    return () => { cancelled = true; };
  }, [shopCoords, isOutForDelivery, isHeadingToShop, isAvailable, partner.lat, partner.lng, order.customer?.lat, order.customer?.lng]);

  if (!shop) return null;

  const shopNavUrl = buildShopNavUrl(shop.shopName, shop.shopAddress, partner.lat, partner.lng);
  const customerNavUrl = buildCustomerNavUrl(shop.shopName, shop.shopAddress, order.customer?.lat, order.customer?.lng);

  const mapConfig = isOutForDelivery
    ? { fromLat: shopCoords?.lat, fromLng: shopCoords?.lng, toLat: order.customer?.lat, toLng: order.customer?.lng, toLabel: order.customer?.name || "Customer", toEmoji: "📍", toColor: "#ef4444" }
    : { fromLat: partner.lat, fromLng: partner.lng, toLat: shopCoords?.lat, toLng: shopCoords?.lng, toLabel: shop.shopName, toEmoji: "🏪", toColor: "#f59e0b" };

  const wrap = async (fn) => { setBusy(true); await fn(); setBusy(false); };

  // ── Generate 4-digit OTP and pass it up when marking out for delivery ──
  const handleOutForDelivery = async () => {
    const otp = String(Math.floor(1000 + Math.random() * 9000));
    await onOutForDelivery(order, otp);
  };

  // ── Verify OTP then pass distKm up so parent can compute earning ──
  const handleDeliver = async () => {
    if (!order.deliveryOtp) {
      await onDeliver(order, distKm);
      return;
    }
    if (otpInput.trim() !== String(order.deliveryOtp)) {
      setOtpError("❌ Wrong OTP. Ask the customer for the correct code.");
      return;
    }
    setOtpError("");
    await onDeliver(order, distKm);
  };

  // Preview earning for this order (shown on active card)
  const previewEarning = distKm != null
    ? 20 + Math.round(5 * distKm)
    : null;

  return (
    <div className={`rounded-2xl overflow-hidden border bg-white transition-all duration-200 ${
      isMine ? "border-purple-200 shadow-xl shadow-purple-50" : "border-gray-100 shadow-sm hover:shadow-md"
    }`}>

      {/* Header */}
      <div className={`px-4 py-3 flex items-center justify-between ${
        isMine ? "bg-gradient-to-r from-purple-600 to-purple-700" : "bg-gray-50 border-b border-gray-100"
      }`}>
        <div>
          <p className={`text-[11px] font-mono font-bold ${isMine ? "text-purple-200" : "text-gray-400"}`}>{order.id}</p>
          <p className={`text-[10px] mt-0.5 ${isMine ? "text-purple-100" : "text-gray-400"}`}>{formatDate(order.placedAt)}</p>
        </div>
        <div className="flex items-center gap-2">
          {dist && (
            <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${isMine ? "bg-white/20 text-white" : "bg-purple-100 text-purple-600"}`}>
              📍 {dist}
            </span>
          )}
          {/* Earning preview badge on active orders */}
          {isMine && previewEarning != null && (
            <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">
              ~₹{previewEarning}
            </span>
          )}
          <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${
            isAvailable ? "bg-amber-50 text-amber-600 border-amber-200" :
            isHeadingToShop ? "bg-blue-50 text-blue-600 border-blue-200" :
            "bg-purple-50 text-purple-600 border-purple-200"
          }`}>
            {isAvailable ? "🟡 New" : isHeadingToShop ? "🏪 Pickup" : "🛵 On way"}
          </span>
        </div>
      </div>

      <div className="p-4 space-y-3">

        {isMine && <StepBar step={stepIndex} />}

        {/* Destination banners */}
        {isHeadingToShop && (
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5">
            <span className="text-2xl">🏪</span>
            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest">Head to shop</p>
              <p className="text-sm font-black text-gray-800 capitalize truncate">{shop.shopName}</p>
              <p className="text-[10px] text-gray-500 truncate">{shop.shopAddress}</p>
            </div>
            <a
              href={shopNavUrl} target="_blank" rel="noreferrer"
              className="flex-shrink-0 px-3 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-black text-[10px] rounded-xl shadow-md shadow-purple-100 hover:scale-105 transition-all"
            >
              🧭 Nav
            </a>
          </div>
        )}

        {isOutForDelivery && (
          <div className="flex items-center gap-3 bg-purple-50 border border-purple-100 rounded-xl px-3 py-2.5">
            <span className="text-2xl">📍</span>
            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-black text-purple-500 uppercase tracking-widest">Deliver to customer</p>
              <p className="text-sm font-black text-gray-800 truncate">{order.customer?.name}</p>
              <p className="text-[10px] text-gray-500 truncate">{order.customer?.address}</p>
            </div>
            <a
              href={customerNavUrl} target="_blank" rel="noreferrer"
              className="flex-shrink-0 px-3 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-black text-[10px] rounded-xl shadow-md shadow-purple-100 hover:scale-105 transition-all"
            >
              🧭 Nav
            </a>
          </div>
        )}

        {isAvailable && (
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
              <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest mb-1">Pickup from</p>
              <p className="text-xs font-black text-gray-800 capitalize truncate">{shop.shopName}</p>
              <p className="text-[10px] text-gray-500 truncate">{shop.shopAddress}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Deliver to</p>
              <p className="text-xs font-black text-gray-800 truncate">{order.customer?.name}</p>
              <p className="text-[10px] text-gray-500 truncate">{order.customer?.address}</p>
            </div>
          </div>
        )}

        {/* Leaflet map — always visible on active orders */}
        {isMine && (
          geocoding ? (
            <div className="h-20 bg-purple-50 rounded-2xl border border-purple-100 flex items-center justify-center gap-2 text-xs text-purple-400 font-bold">
              <div className="w-3 h-3 border-2 border-purple-300 border-t-purple-600 rounded-full animate-spin" />
              Getting shop location...
            </div>
          ) : (
            <DeliveryMap
              fromLat={mapConfig.fromLat} fromLng={mapConfig.fromLng}
              toLat={mapConfig.toLat} toLng={mapConfig.toLng}
              toLabel={mapConfig.toLabel}
              toEmoji={mapConfig.toEmoji} toColor={mapConfig.toColor}
            />
          )
        )}

        {/* Items */}
        <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Items</p>
          <div className="space-y-1.5">
            {shop.items.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-gray-700 font-semibold capitalize truncate flex-1">{item.name}</span>
                <span className="text-gray-400 text-xs mx-2">×{item.quantity}</span>
                <span className="font-black text-purple-700">₹{item.price * item.quantity}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 pt-2 border-t border-gray-200">
            <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Total</span>
            <span className="font-black text-purple-700">₹{shop.subtotal}</span>
          </div>
        </div>

        {/* ── OTP Entry — only when out for delivery ── */}
        {isOutForDelivery && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">🔐</span>
              <div>
                <p className="text-xs font-black text-blue-700">Enter Delivery OTP</p>
                <p className="text-[10px] text-blue-400">Ask the customer for their 4-digit OTP</p>
              </div>
            </div>
            <input
              type="number"
              value={otpInput}
              onChange={(e) => {
                setOtpError("");
                setOtpInput(e.target.value.slice(0, 4));
              }}
              placeholder="_ _ _ _"
              className="w-full text-center text-2xl font-black tracking-[0.5em] border-2 border-blue-200 bg-white rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-blue-800 placeholder-blue-200"
            />
            {otpError && (
              <p className="text-xs font-bold text-red-500 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                {otpError}
              </p>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2 pt-1">
          {isAvailable && (
            <>
              <button
                onClick={() => wrap(() => onAccept(order))} disabled={busy}
                className="flex-1 py-3.5 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-black text-sm rounded-2xl shadow-lg shadow-purple-200 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {busy ? "..." : "✅ Accept"}
              </button>
              <button
                onClick={() => onReject(order)} disabled={busy}
                className="px-5 py-3.5 bg-red-50 hover:bg-red-100 text-red-500 font-black text-sm rounded-2xl border border-red-200 hover:border-red-300 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
              >
                ✕ Reject
              </button>
            </>
          )}
          {isHeadingToShop && (
            <button
              onClick={() => wrap(handleOutForDelivery)} disabled={busy}
              className="flex-1 py-3.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-black text-sm rounded-2xl shadow-lg shadow-blue-100 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {busy ? "..." : "🛵 Out for Delivery"}
            </button>
          )}
          {isOutForDelivery && (
            <button
              onClick={() => wrap(handleDeliver)} disabled={busy || otpInput.length < 4}
              className="flex-1 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-sm rounded-2xl shadow-lg shadow-emerald-100 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {busy ? "..." : "🎉 Mark Delivered"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Delivered Card ────────────────────────────────────────────────────────────
export function DeliveredCard({ order }) {
  const shop = order.shops?.[0];
  // ✅ Use saved earning from order record (set at delivery time with km-based formula)
  const earning = order.partnerEarning ?? Math.max(20, Math.round((shop?.subtotal || 0) * 0.1));
  const distKm = order.deliveryDistanceKm;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
      <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-2xl flex-shrink-0">🎉</div>
      <div className="flex-1 min-w-0">
        <p className="font-black text-gray-800 text-sm truncate">{order.customer?.name}</p>
        <p className="text-[10px] text-gray-400 font-mono truncate">{order.id}</p>
        <p className="text-[10px] text-gray-400">{formatDate(order.placedAt)}</p>
        {distKm != null && (
          <p className="text-[10px] text-purple-400 font-bold mt-0.5">📍 {distKm.toFixed(1)} km • ₹20 base + ₹{Math.round(5 * distKm)} km bonus</p>
        )}
      </div>
      <div className="text-right flex-shrink-0">
        <p className="font-black text-purple-700">₹{shop?.subtotal}</p>
        <p className="text-[10px] text-emerald-600 font-bold mt-0.5">+₹{earning} earned</p>
      </div>
    </div>
  );
}