/**
 * codUtils.js
 * Single source of truth for COD cash calculation.
 * Both FinancePanel (delivery boy) and FinanceTab (admin) import from here
 * so they are guaranteed to always show the same number.
 */

export const isCod = (method) => {
  if (!method) return false;
  const m = method.toLowerCase();
  return m === "cod" || m === "cash" || m.includes("cash");
};

/**
 * Calculate pending COD cash for one partner.
 *
 * @param {string}      phoneNumber   - partner's phone
 * @param {object[]}    orders        - full orders array from /api/orders?all=true
 * @param {string|null} codLastResetAt - ISO string from partner object (or null)
 * @returns {number}  total pending cash in rupees
 */
export function calcCodForPartner(phoneNumber, orders, codLastResetAt) {
  // Parse reset boundary once — no buffer, exact timestamp
  const resetAt = codLastResetAt ? new Date(codLastResetAt) : null;

  return orders
    .filter((o) => {
      if (o.assignedPartner !== phoneNumber) return false;
      if (o.status !== "delivered")          return false;
      if (!isCod(o.paymentMethod))           return false;

      // If no reset has ever happened, count everything
      if (!resetAt) return true;

      // Use deliveredAt when present, otherwise updatedAt
      // Both must be stored as ISO strings in the DB
      const ts = o.deliveredAt || o.updatedAt;
      if (!ts) return false;

      return new Date(ts) > resetAt;
    })
    .reduce((sum, o) => sum + (Number(o.totalPrice) || 0), 0);
}

/**
 * Build a { phoneNumber -> codTotal } map for ALL partners at once.
 * Used by FinanceTab so it only loops orders once.
 *
 * @param {object[]} partners - array of partner objects
 * @param {object[]} orders   - full orders array
 * @returns {{ [phoneNumber: string]: number }}
 */
export function buildCodMap(partners, orders) {
  // Index partners by phone for O(1) lookup
  const partnerByPhone = {};
  for (const p of partners) {
    partnerByPhone[p.phoneNumber] = p;
  }

  const codMap = {};

  for (const o of orders) {
    if (o.status !== "delivered")   continue;
    if (!isCod(o.paymentMethod))    continue;

    const key = o.assignedPartner;
    if (!key) continue;

    const partner = partnerByPhone[key];
    if (!partner) continue; // order assigned to unknown partner — skip

    const resetAt = partner.codLastResetAt ? new Date(partner.codLastResetAt) : null;

    const ts = o.deliveredAt || o.updatedAt;
    if (!ts && resetAt) continue; // no timestamp and there's a reset — can't tell, skip

    if (resetAt && new Date(ts) <= resetAt) continue; // delivered before/at reset

    codMap[key] = (codMap[key] || 0) + (Number(o.totalPrice) || 0);
  }

  return codMap;
}