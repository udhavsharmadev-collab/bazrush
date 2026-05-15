export const dynamic = 'force-dynamic';

import { connectDB } from '../../../lib/mongodb.js';
import DeliveryPartner from '../../../models/DeliveryPartner.js';

// Strip password before sending to client, add hasPassword flag
function safePartner(partner) {
  const obj = typeof partner.toObject === 'function' ? partner.toObject() : { ...partner };
  const { password, ...rest } = obj;
  rest.hasPassword = !!(password && password.length > 0);
  return rest;
}

// ── GET /api/delivery-partners/[phoneNumber] ──────────────────────────────────
export async function GET(request, { params }) {
  try {
    await connectDB();
    const raw = decodeURIComponent(params.phoneNumber);
    // Accept both "9876543210" and "+919876543210"
    const phoneNumber = raw.startsWith('+91') ? raw : '+91' + raw;
    const partner = await DeliveryPartner.findOne({ phoneNumber });
    if (!partner) return Response.json({ error: 'Partner not found' }, { status: 404 });
    return Response.json({ partner: safePartner(partner) });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// ── PATCH /api/delivery-partners/[phoneNumber] ────────────────────────────────
// action: "login"           → compare plain text password
// action: "change-password" → verify current, save new plain text
// (no action)               → general field update
export async function PATCH(request, { params }) {
  try {
    await connectDB();
    const raw = decodeURIComponent(params.phoneNumber);
    const phoneNumber = raw.startsWith('+91') ? raw : '+91' + raw;
    const body = await request.json();
    const { action, ...rest } = body;

    const partner = await DeliveryPartner.findOne({ phoneNumber });
    if (!partner) return Response.json({ error: 'Partner not found' }, { status: 404 });

    // ── LOGIN ─────────────────────────────────────────────────────────────────
    if (action === 'login') {
      const { password } = rest;
      if (!password)
        return Response.json({ error: 'Password is required' }, { status: 400 });
      if (!partner.password)
        return Response.json({ error: 'NO_PASSWORD' }, { status: 403 });
      if (password !== partner.password)
        return Response.json({ error: 'Incorrect password' }, { status: 401 });
      return Response.json({ success: true, partner: safePartner(partner) });
    }

    // ── CHANGE PASSWORD ───────────────────────────────────────────────────────
    if (action === 'change-password') {
      const { currentPassword, newPassword } = rest;
      if (!currentPassword || !newPassword)
        return Response.json({ error: 'Both current and new password required' }, { status: 400 });
      if (newPassword.length < 6)
        return Response.json({ error: 'New password must be at least 6 characters' }, { status: 400 });
      if (currentPassword !== partner.password)
        return Response.json({ error: 'Current password is incorrect' }, { status: 401 });
      partner.password = newPassword;
      await partner.save();
      return Response.json({ success: true, partner: safePartner(partner) });
    }

    // ── GENERAL UPDATE ────────────────────────────────────────────────────────
    const { phoneNumber: _p, createdAt: _c, password: _pw, ...safeUpdates } = rest;
    const updated = await DeliveryPartner.findOneAndUpdate(
      { phoneNumber },
      { $set: safeUpdates },
      { new: true }
    );
    return Response.json({ success: true, partner: safePartner(updated) });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}