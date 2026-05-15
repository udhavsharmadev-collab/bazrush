// ── Helpers ───────────────────────────────────────────────────────────────────
export function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

// ── Road distance via OSRM ────────────────────────────────────────────────────
export async function getRoadDistance(fromLat, fromLng, toLat, toLng) {
  if (!fromLat || !toLat) return null;
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=false`;
    const res = await fetch(url);
    const data = await res.json();
    const meters  = data?.routes?.[0]?.distance;
    const seconds = data?.routes?.[0]?.duration;
    if (!meters) return null;
    const dist = meters < 1000
      ? `${Math.round(meters)}m`
      : `${(meters / 1000).toFixed(1)}km`;
    const mins = Math.round(seconds / 60);
    return `${dist} · ${mins} min`;
  } catch {
    return null;
  }
}

// ── getRoadDistanceKm ─────────────────────────────────────────────────────────
export async function getRoadDistanceKm(fromLat, fromLng, toLat, toLng) {
  if (!fromLat || !toLat) return null;
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=false`;
    const res = await fetch(url);
    const data = await res.json();
    const meters = data?.routes?.[0]?.distance;
    if (!meters) return null;
    return meters / 1000;
  } catch {
    return null;
  }
}

// ── Google Maps nav URL builders ──────────────────────────────────────────────
export function buildShopNavUrl(shopName, shopAddress, currentLat, currentLng) {
  const query = encodeURIComponent(`${shopName}, ${shopAddress}`);
  if (currentLat && currentLng) {
    return `https://www.google.com/maps/dir/${currentLat},${currentLng}/${query}`;
  }
  return `https://www.google.com/maps/search/${query}`;
}

export function buildCustomerNavUrl(shopLat, shopLng, customerAddress) {
  const dest = encodeURIComponent(customerAddress);
  if (shopLat && shopLng) {
    return `https://www.google.com/maps/dir/${shopLat},${shopLng}/${dest}`;
  }
  return `https://www.google.com/maps/search/${dest}`;
}

// ── Panipat bounds ────────────────────────────────────────────────────────────
const PANIPAT_LAT = 29.3909;
const PANIPAT_LNG = 76.9635;
const MAX_DIST_DEG = 0.15;

// bbox: min_lon,min_lat,max_lon,max_lat (~10km around Panipat)
const PHOTON_BBOX = "76.8635,29.2909,77.0635,29.4909";
const NOMINATIM_VIEWBOX = "76.8635,29.2909,77.0635,29.4909";

function isNearPanipat(lat, lng) {
  return (
    Math.abs(lat - PANIPAT_LAT) < MAX_DIST_DEG &&
    Math.abs(lng - PANIPAT_LNG) < MAX_DIST_DEG
  );
}

// ── Geocode cache ─────────────────────────────────────────────────────────────
const geocodeCache = {};

// ── geocodeAddress ────────────────────────────────────────────────────────────
export async function geocodeAddress(address) {
  if (!address) return null;

  // ALWAYS enrich with Panipat context
  const enriched = address.toLowerCase().includes("panipat")
    ? address.trim()
    : `${address.trim()}, Panipat, Haryana, India`;

  if (geocodeCache[enriched]) return geocodeCache[enriched];

  // ── 1. Photon bbox locked to Panipat ─────────────────────────────────────
  try {
    const res = await fetch(
      `https://photon.komoot.io/api/?q=${encodeURIComponent(enriched)}&limit=5&lang=en&bbox=${PHOTON_BBOX}`,
      { headers: { "Accept-Language": "en" } }
    );
    const data = await res.json();
    for (const feature of data?.features || []) {
      const [lng, lat] = feature.geometry.coordinates;
      if (isNearPanipat(lat, lng)) {
        const coords = { lat, lng };
        geocodeCache[enriched] = coords;
        return coords;
      }
    }
  } catch {}

  // ── 2. Nominatim bounded to Panipat ──────────────────────────────────────
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(enriched)}&limit=5&countrycodes=in&viewbox=${NOMINATIM_VIEWBOX}&bounded=1`,
      { headers: { "Accept-Language": "en", "User-Agent": "DeliveryApp/1.0" } }
    );
    const data = await res.json();
    for (const item of data || []) {
      const lat = parseFloat(item.lat);
      const lng = parseFloat(item.lon);
      if (isNearPanipat(lat, lng)) {
        const coords = { lat, lng };
        geocodeCache[enriched] = coords;
        return coords;
      }
    }
  } catch {}

  // ── 3. Nominatim India only, pick nearest to Panipat ─────────────────────
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(enriched)}&limit=5&countrycodes=in`,
      { headers: { "Accept-Language": "en", "User-Agent": "DeliveryApp/1.0" } }
    );
    const data = await res.json();
    let best = null;
    let bestDist = Infinity;
    for (const item of data || []) {
      const lat = parseFloat(item.lat);
      const lng = parseFloat(item.lon);
      const d = Math.abs(lat - PANIPAT_LAT) + Math.abs(lng - PANIPAT_LNG);
      if (d < bestDist) { bestDist = d; best = { lat, lng }; }
    }
    if (best) {
      geocodeCache[enriched] = best;
      return best;
    }
  } catch {}

  // ── 4. Hard fallback — Panipat center (never Hyderabad again) ────────────
  console.warn(`[Geocode] Failed to resolve "${enriched}", using Panipat center`);
  const fallback = { lat: PANIPAT_LAT, lng: PANIPAT_LNG };
  geocodeCache[enriched] = fallback;
  return fallback;
}

// ── geocodeAddressWithContext ──────────────────────────────────────────────────
export async function geocodeAddressWithContext(address, _cityHint) {
  return geocodeAddress(address);
}

// ── extractCity ───────────────────────────────────────────────────────────────
export function extractCity(address) {
  if (!address) return "";
  const parts = address.split(",").map((p) => p.trim());
  for (let i = parts.length - 1; i >= 0; i--) {
    if (parts[i] && !/^\d/.test(parts[i])) return parts[i];
  }
  return parts[parts.length - 1] || "";
}