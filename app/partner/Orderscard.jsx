"use client";

import { useState, useEffect } from "react";
import { DeliveryMap, StepBar } from "./delivery/Deliverymapcomponents";
import {
  formatDate,
  getRoadDistance,
  buildShopNavUrl,
  geocodeAddressWithContext,
  extractCity,
} from "./DeliveryUtils";

// ── helpers ───────────────────────────────────────────────────────────────────
const isCod = (method) => {
  if (!method) return false;
  const m = method.toLowerCase();
  return m === "cod" || m === "cash" || m.includes("cash");
};

const PaymentBadge = ({ method, size = "sm" }) => {
  const cod = isCod(method);
  if (!method) return null;
  return (
    <span
      className={`font-black uppercase tracking-wide ${
        size === "xs" ? "text-[10px]" : "text-xs"
      } ${cod ? "text-amber-600" : "text-emerald-600"}`}
    >
      {cod ? "💵 Cash on Delivery" : "✅ Paid Online"}
    </span>
  );
};

// ── Order Card ────────────────────────────────────────────────────────────────
export function OrderCard({ order, partner, onAccept, onOutForDelivery, onDeliver, onReject }) {
  const [busy, setBusy] = useState(false);
  const [shopCoords, setShopCoords] = useState(null);
  const [customerCoords, setCustomerCoords] = useState(null);
  const [dist, setDist] = useState(null);
  const [distKm, setDistKm] = useState(null);

  const [otpInput, setOtpInput] = useState("");
  const [otpError, setOtpError] = useState("");

  const shop = order.shops?.[0];

  const isMine           = order.assignedPartner === partner.phoneNumber;
  const isAvailable      = !order.assignedPartner && (order.status === "confirmed" || order.status === "preparing");
  const isHeadingToShop  = isMine && order.status !== "out_for_delivery" && order.status !== "delivered";
  const isOutForDelivery = isMine && order.status === "out_for_delivery";
  const stepIndex        = isOutForDelivery ? 1 : isMine ? 0 : -1;

  const cityHint = extractCity(shop?.shopAddress || "");
  const cod      = isCod(order.paymentMethod);

  // ── STEP 1: Geocode shop ───────────────────────────────────────────────────
  useEffect(() => {
    if (!isMine || !shop?.shopAddress || shopCoords) return;
    geocodeAddressWithContext(shop.shopAddress, "").then(setShopCoords);
  }, [isMine, shop?.shopAddress]);

  // ── STEP 2: Geocode customer ALWAYS from address string ───────────────────
  useEffect(() => {
    if (!isOutForDelivery) return;
    setCustomerCoords(null);
    if (order.customer?.address) {
      geocodeAddressWithContext(order.customer.address, cityHint).then((c) => {
        if (c) setCustomerCoords(c);
      });
    }
  }, [isOutForDelivery, order.customer?.address, cityHint]);

  // ── STEP 3: Reset dist on status change ───────────────────────────────────
  useEffect(() => {
    setDist(null);
    setDistKm(null);
  }, [order.status]);

  // ── STEP 4: OSRM distance ─────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    const fromLat = isOutForDelivery ? shopCoords?.lat    : partner.lat;
    const fromLng = isOutForDelivery ? shopCoords?.lng    : partner.lng;
    const toLat   = isOutForDelivery ? customerCoords?.lat : shopCoords?.lat;
    const toLng   = isOutForDelivery ? customerCoords?.lng : shopCoords?.lng;

    if (!fromLat || !fromLng || !toLat || !toLng) return;

    getRoadDistance(fromLat, fromLng, toLat, toLng).then((result) => {
      if (cancelled || !result) return;
      setDist(result);
      const parsed = parseFloat(result);
      if (!isNaN(parsed)) setDistKm(parsed);
    });

    return () => { cancelled = true; };
  }, [shopCoords, customerCoords, isOutForDelivery, partner.lat, partner.lng]);

  if (!shop) return null;

  // ── Nav URLs ────────────────────────────────────────────────────────────────
  const shopNavUrl     = buildShopNavUrl(shop.shopName, shop.shopAddress, partner.lat, partner.lng);
  const shopAsText     = encodeURIComponent(`${shop.shopName}, ${shop.shopAddress}`);
  const customerAsText = encodeURIComponent(order.customer?.address || order.customer?.name || "");
  const customerNavUrl = `https://www.google.com/maps/dir/${shopAsText}/${customerAsText}`;

  // ── Map config ──────────────────────────────────────────────────────────────
  const mapConfig = isOutForDelivery
    ? {
        fromLat:   shopCoords?.lat,
        fromLng:   shopCoords?.lng,
        fromLabel: shop.shopName,
        fromEmoji: "🏪",
        fromColor: "#f59e0b",
        toLat:     customerCoords?.lat,
        toLng:     customerCoords?.lng,
        toLabel:   order.customer?.address || order.customer?.name || "Customer",
        toEmoji:   "📍",
        toColor:   "#ef4444",
      }
    : {
        fromLat:   partner.lat,
        fromLng:   partner.lng,
        fromLabel: "You",
        fromEmoji: "🛵",
        fromColor: "#7c3aed",
        toLat:     shopCoords?.lat,
        toLng:     shopCoords?.lng,
        toLabel:   shop.shopName,
        toEmoji:   "🏪",
        toColor:   "#f59e0b",
      };

  const mapReady = Boolean(mapConfig.fromLat && mapConfig.fromLng && mapConfig.toLat && mapConfig.toLng);

  const wrap = async (fn) => { setBusy(true); await fn(); setBusy(false); };

  const handleOutForDelivery = async () => {
    const otp = String(Math.floor(1000 + Math.random() * 9000));
    await onOutForDelivery(order, otp);
  };

  const handleDeliver = async () => {
    if (!order.deliveryOtp) { await onDeliver(order, distKm); return; }
    if (otpInput.trim() !== String(order.deliveryOtp)) {
      setOtpError("❌ Wrong OTP. Ask the customer for the correct code.");
      return;
    }
    setOtpError("");
    await onDeliver(order, distKm);
  };

  const previewEarning = distKm != null ? Math.max(20, 20 + Math.round(5 * distKm)) : null;

  // ── Price breakdown ────────────────────────────────────────────────────────
  const itemsTotal  = order.shops?.reduce((sum, s) => sum + (s.subtotal || 0), 0) ?? shop.subtotal;
  const deliveryFee = order.deliveryFee ?? null;
  const totalPrice  = order.totalPrice ?? null;

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
          {isMine && previewEarning != null && (
            <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">
              ~₹{previewEarning}
            </span>
          )}
          {order.paymentMethod && (
            <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${
              cod
                ? "bg-amber-50 text-amber-600 border-amber-200"
                : "bg-emerald-50 text-emerald-600 border-emerald-200"
            }`}>
              {cod ? "💵 COD" : "✅ Paid"}
            </span>
          )}
          <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${
            isAvailable     ? "bg-amber-50 text-amber-600 border-amber-200" :
            isHeadingToShop ? "bg-blue-50 text-blue-600 border-blue-200" :
                              "bg-purple-50 text-purple-600 border-purple-200"
          }`}>
            {isAvailable ? "🟡 New" : isHeadingToShop ? "🏪 Pickup" : "🛵 On way"}
          </span>
        </div>
      </div>

      <div className="p-4 space-y-3">

        {isMine && <StepBar step={stepIndex} />}

        {/* Heading to shop */}
        {isHeadingToShop && (
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5">
            <span className="text-2xl">🏪</span>
            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest">Head to shop</p>
              <p className="text-sm font-black text-gray-800 capitalize truncate">{shop.shopName}</p>
              <p className="text-[10px] text-gray-500 truncate">{shop.shopAddress}</p>
            </div>
            <a href={shopNavUrl} target="_blank" rel="noreferrer"
              className="flex-shrink-0 px-3 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-black text-[10px] rounded-xl shadow-md shadow-purple-100 hover:scale-105 transition-all">
              🧭 Nav
            </a>
          </div>
        )}

        {/* Out for delivery — customer location */}
        {isOutForDelivery && (
          <div className="flex items-center gap-3 bg-purple-50 border border-purple-100 rounded-xl px-3 py-2.5">
            <span className="text-2xl">📍</span>
            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-black text-purple-500 uppercase tracking-widest">Deliver to customer</p>
              <p className="text-sm font-black text-gray-800 truncate">{order.customer?.name}</p>
              <p className="text-[10px] text-gray-500 truncate">{order.customer?.address}</p>
            </div>
            <a href={customerNavUrl} target="_blank" rel="noreferrer"
              className="flex-shrink-0 px-3 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-black text-[10px] rounded-xl shadow-md shadow-purple-100 hover:scale-105 transition-all">
              🧭 Nav
            </a>
          </div>
        )}

        {/* Collect cash banner (COD + out for delivery) */}
        {isOutForDelivery && cod && (
          <div className="flex items-center gap-3 bg-amber-50 border-2 border-amber-300 rounded-2xl px-4 py-3">
            <span className="text-3xl">💵</span>
            <div>
              <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Collect cash from customer</p>
              <p className="text-lg font-black text-amber-800">₹{totalPrice ?? (itemsTotal + (deliveryFee || 0))}</p>
            </div>
          </div>
        )}

        {/* Available preview */}
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

        {/* Leaflet map */}
        {isMine && (
          !mapReady ? (
            <div className="h-20 bg-purple-50 rounded-2xl border border-purple-100 flex items-center justify-center gap-2 text-xs text-purple-400 font-bold">
              <div className="w-3 h-3 border-2 border-purple-300 border-t-purple-600 rounded-full animate-spin" />
              Getting location...
            </div>
          ) : (
            <DeliveryMap
              key={`${order.status}-${customerCoords?.lat}-${customerCoords?.lng}`}
              fromLat={mapConfig.fromLat}     fromLng={mapConfig.fromLng}
              fromLabel={mapConfig.fromLabel}  fromEmoji={mapConfig.fromEmoji}  fromColor={mapConfig.fromColor}
              toLat={mapConfig.toLat}          toLng={mapConfig.toLng}
              toLabel={mapConfig.toLabel}      toEmoji={mapConfig.toEmoji}      toColor={mapConfig.toColor}
            />
          )
        )}

        {/* Items + price breakdown */}
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

          {/* Subtotal — only shown when there are multiple shops */}
          {(order.shops?.length ?? 1) > 1 && (
            <div className="flex justify-between mt-2 pt-2 border-t border-gray-200">
              <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Subtotal</span>
              <span className="font-black text-purple-700">₹{itemsTotal}</span>
            </div>
          )}

          {/* Delivery fee */}
          <div className="flex justify-between mt-2 pt-2 border-t border-gray-200">
            <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Delivery Fee</span>
            {deliveryFee === 0 || deliveryFee === null
              ? <span className="font-black text-emerald-500">FREE</span>
              : <span className="font-black text-purple-700">₹{deliveryFee}</span>
            }
          </div>

          {/* Total paid */}
          <div className="flex justify-between mt-2 pt-2 border-t border-dashed border-gray-300">
            <span className="text-xs font-black text-gray-700 uppercase tracking-widest">Total Paid</span>
            <span className="font-black text-purple-700 text-sm">
              ₹{totalPrice ?? (itemsTotal + (deliveryFee || 0))}
            </span>
          </div>

          {/* Payment method */}
          {order.paymentMethod && (
            <div className="flex justify-between mt-2 pt-2 border-t border-gray-200">
              <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Payment</span>
              <PaymentBadge method={order.paymentMethod} />
            </div>
          )}
        </div>

        {/* OTP */}
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
              type="number" value={otpInput}
              onChange={(e) => { setOtpError(""); setOtpInput(e.target.value.slice(0, 4)); }}
              placeholder="_ _ _ _"
              className="w-full text-center text-2xl font-black tracking-[0.5em] border-2 border-blue-200 bg-white rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-blue-800 placeholder-blue-200"
            />
            {otpError && (
              <p className="text-xs font-bold text-red-500 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{otpError}</p>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2 pt-1">
          {isAvailable && (
            <>
              <button onClick={() => wrap(() => onAccept(order))} disabled={busy}
                className="flex-1 py-3.5 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-black text-sm rounded-2xl shadow-lg shadow-purple-200 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50">
                {busy ? "..." : "✅ Accept"}
              </button>
              <button onClick={() => onReject(order)} disabled={busy}
                className="px-5 py-3.5 bg-red-50 hover:bg-red-100 text-red-500 font-black text-sm rounded-2xl border border-red-200 hover:border-red-300 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50">
                ✕ Reject
              </button>
            </>
          )}
          {isHeadingToShop && (
            <button onClick={() => wrap(handleOutForDelivery)} disabled={busy}
              className="flex-1 py-3.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-black text-sm rounded-2xl shadow-lg shadow-blue-100 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50">
              {busy ? "..." : "🛵 Out for Delivery"}
            </button>
          )}
          {isOutForDelivery && (
            <button onClick={() => wrap(handleDeliver)} disabled={busy || otpInput.length < 4}
              className="flex-1 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-sm rounded-2xl shadow-lg shadow-emerald-100 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50">
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
  const shop    = order.shops?.[0];
  const distKm  = order.deliveryDistanceKm ?? 0;
  const earning = order.partnerEarning ?? Math.max(20, 20 + Math.round(5 * distKm));
  const cod     = isCod(order.paymentMethod);

  const itemsTotal  = order.shops?.reduce((sum, s) => sum + (s.subtotal || 0), 0) ?? shop?.subtotal ?? 0;
  const deliveryFee = order.deliveryFee ?? null;
  const totalPrice  = order.totalPrice ?? (itemsTotal + (deliveryFee || 0));

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
      <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-2xl flex-shrink-0">🎉</div>
      <div className="flex-1 min-w-0">
        <p className="font-black text-gray-800 text-sm truncate">{order.customer?.name}</p>
        <p className="text-[10px] text-gray-400 font-mono truncate">{order.id}</p>
        <p className="text-[10px] text-gray-400">{formatDate(order.placedAt)}</p>
        {distKm > 0 && (
          <p className="text-[10px] text-purple-400 font-bold mt-0.5">
            📍 {distKm.toFixed(1)} km • ₹20 base + ₹{Math.round(5 * distKm)} km bonus
          </p>
        )}
        {order.paymentMethod && (
          <p className={`text-[10px] font-black mt-0.5 ${cod ? "text-amber-500" : "text-emerald-500"}`}>
            {cod ? "💵 Cash collected" : "✅ Paid online"}
          </p>
        )}
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Order Total</p>
        <p className="font-black text-purple-700">₹{totalPrice}</p>
        {deliveryFee !== null && (
          <p className="text-[10px] text-gray-400 mt-0.5">
            {deliveryFee === 0 ? "Free delivery" : `+₹${deliveryFee} delivery`}
          </p>
        )}
        <p className="text-[10px] text-emerald-600 font-bold mt-1">+₹{earning} earned</p>
      </div>
    </div>
  );
}