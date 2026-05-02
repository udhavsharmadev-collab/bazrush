// ── Helpers ───────────────────────────────────────────────────────────────────
export function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

export async function getRoadDistance(fromLat, fromLng, toLat, toLng) {
  if (!fromLat || !toLat) return null;
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=false`;
    const res = await fetch(url);
    const data = await res.json();
    const meters = data?.routes?.[0]?.distance;
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

// ── Google Maps nav URL builders ──────────────────────────────────────────────
export function buildShopNavUrl(shopName, shopAddress, currentLat, currentLng) {
  const query = encodeURIComponent(`${shopName}, ${shopAddress}`);
  if (currentLat && currentLng) {
    return `https://www.google.com/maps/dir/${currentLat},${currentLng}/${query}`;
  }
  return `https://www.google.com/maps/search/${query}`;
}

export function buildCustomerNavUrl(shopName, shopAddress, customerLat, customerLng) {
  const shopQuery = encodeURIComponent(`${shopName}, ${shopAddress}`);
  return `https://www.google.com/maps/dir/${shopQuery}/${customerLat},${customerLng}`;
}

// ── Nominatim geocode ─────────────────────────────────────────────────────────
const geocodeCache = {};
export async function geocodeAddress(address) {
  if (!address) return null;
  if (geocodeCache[address]) return geocodeCache[address];
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
      { headers: { "Accept-Language": "en" } }
    );
    const data = await res.json();
    if (data?.[0]) {
      const coords = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
      geocodeCache[address] = coords;
      return coords;
    }
  } catch {}
  return null;
}