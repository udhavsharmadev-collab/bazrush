"use client";

import { useEffect, useRef } from "react";

// ── Leaflet Map ───────────────────────────────────────────────────────────────
export function DeliveryMap({
  fromLat, fromLng, toLat, toLng,
  fromLabel = "You", fromEmoji = "🛵", fromColor = "#7c3aed",
  toLabel, toEmoji, toColor,
}) {
  const ref  = useRef(null);
  const inst = useRef(null);

  useEffect(() => {
    // Don't boot until we have real coords
    if (!ref.current || !fromLat || !fromLng || !toLat || !toLng) return;

    const boot = () => {
      // Always destroy old instance first — this was the bug
      if (inst.current) {
        inst.current.remove();
        inst.current = null;
      }
      if (!window.L || !ref.current) return;

      const L = window.L;

      const centerLat = (fromLat + toLat) / 2;
      const centerLng = (fromLng + toLng) / 2;

      const map = L.map(ref.current, {
        center: [centerLat, centerLng],
        zoom: 14,
        zoomControl: true,
        scrollWheelZoom: false,
      });
      inst.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "",
        maxZoom: 19,
      }).addTo(map);

      const mk = (emoji, color) =>
        L.divIcon({
          html: `<div style="background:${color};width:36px;height:36px;border-radius:50%;border:3px solid white;box-shadow:0 3px 12px rgba(0,0,0,.22);display:flex;align-items:center;justify-content:center;font-size:16px">${emoji}</div>`,
          className: "",
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        });

      L.marker([fromLat, fromLng], { icon: mk(fromEmoji, fromColor) })
        .addTo(map)
        .bindPopup(`<b>${fromLabel}</b>`);

      L.marker([toLat, toLng], { icon: mk(toEmoji, toColor) })
        .addTo(map)
        .bindPopup(`<b>${toLabel}</b>`);

      L.polyline([[fromLat, fromLng], [toLat, toLng]], {
        color: "#7c3aed",
        weight: 3,
        dashArray: "8 5",
        opacity: 0.8,
      }).addTo(map);

      // Use setTimeout so the map container is fully painted before fitBounds
      setTimeout(() => {
        if (!inst.current) return;
        map.fitBounds([[fromLat, fromLng], [toLat, toLng]], { padding: [44, 44] });
        map.invalidateSize();
      }, 100);
    };

    // Load Leaflet CSS
    if (!document.getElementById("lf-css")) {
      const l = document.createElement("link");
      l.id = "lf-css";
      l.rel = "stylesheet";
      l.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(l);
    }

    // Load Leaflet JS then boot
    if (window.L) {
      boot();
    } else if (!document.getElementById("lf-js")) {
      const s = document.createElement("script");
      s.id = "lf-js";
      s.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      s.onload = boot;
      document.head.appendChild(s);
    } else {
      // Script tag exists but L not ready yet — poll
      const iv = setInterval(() => {
        if (window.L) { clearInterval(iv); boot(); }
      }, 80);
    }

    return () => {
      if (inst.current) {
        inst.current.remove();
        inst.current = null;
      }
    };
  // ✅ ALL coords + labels in deps — any change triggers a full map rebuild
  }, [fromLat, fromLng, toLat, toLng, fromLabel, fromEmoji, fromColor, toLabel, toEmoji, toColor]);

  if (!fromLat || !fromLng || !toLat || !toLng) {
    return (
      <div className="h-20 bg-purple-50 rounded-2xl border border-purple-100 flex items-center justify-center gap-2 text-xs text-purple-400 font-bold">
        <div className="w-3 h-3 border-2 border-purple-300 border-t-purple-600 rounded-full animate-spin" />
        Getting location...
      </div>
    );
  }

  return (
    <div
      ref={ref}
      style={{
        height: 220,
        borderRadius: 16,
        overflow: "hidden",
        zIndex: 0,
        border: "1px solid #e9d5ff",
      }}
    />
  );
}

// ── Step Bar ──────────────────────────────────────────────────────────────────
export function StepBar({ step }) {
  const steps = [
    { icon: "✅", label: "Accepted" },
    { icon: "🛵", label: "On the way" },
    { icon: "🎉", label: "Delivered" },
  ];
  return (
    <div className="flex items-center">
      {steps.map((s, i) => (
        <div key={i} className="flex items-center flex-1">
          <div className="flex flex-col items-center">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs border-2 transition-all ${
              i <= step ? "border-purple-500 bg-purple-50" : "border-gray-200 bg-gray-50"
            }`}>
              {s.icon}
            </div>
            <p className={`text-[9px] font-bold mt-0.5 whitespace-nowrap ${
              i <= step ? "text-purple-600" : "text-gray-300"
            }`}>
              {s.label}
            </p>
          </div>
          {i < steps.length - 1 && (
            <div className={`flex-1 h-0.5 mb-3 mx-1 rounded-full ${
              i < step ? "bg-purple-400" : "bg-gray-200"
            }`} />
          )}
        </div>
      ))}
    </div>
  );
}