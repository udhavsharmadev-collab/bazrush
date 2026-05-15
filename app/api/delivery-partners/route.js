import { connectDB } from '../../lib/mongodb.js';
import DeliveryPartner from '../../models/DeliveryPartner.js';

function safePartner(partner) {
  const obj = typeof partner.toObject === 'function' ? partner.toObject() : { ...partner };
  const { password, passwordHash, ...rest } = obj;
  rest.hasPassword = !!(password && password.length > 0);
  return rest;
}

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const phoneNumber = searchParams.get('phoneNumber');

    if (phoneNumber) {
      const partner = await DeliveryPartner.findOne({ phoneNumber });
      if (!partner) return Response.json({ error: 'Partner not found' }, { status: 404 });
      return Response.json({ partner: safePartner(partner) });
    }

    const all = await DeliveryPartner.find({}).lean();
    const shaped = {};
    for (const p of all) {
      const { password, passwordHash, ...rest } = p;
      shaped[p.phoneNumber] = { ...rest, hasPassword: !!(password && password.length > 0) };
    }
    return Response.json(shaped);
  } catch {
    return Response.json({ error: 'Failed to read partners' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();
    const { action, phoneNumber, password, name, vehicleType, vehicleNumber } = body;

    if (action === 'lookup') {
      if (!phoneNumber) return Response.json({ error: 'Phone number required' }, { status: 400 });
      const partner = await DeliveryPartner.findOne({ phoneNumber });
      if (!partner) return Response.json({ error: 'Partner not found' }, { status: 404 });
      return Response.json({ partner: safePartner(partner) });
    }

    if (action === 'login') {
      if (!phoneNumber || !password) return Response.json({ error: 'Phone and password required' }, { status: 400 });
      const partner = await DeliveryPartner.findOne({ phoneNumber });
      if (!partner) return Response.json({ error: 'Partner not found' }, { status: 404 });
      if (!partner.password) return Response.json({ error: 'NO_PASSWORD' }, { status: 403 });
      if (password !== partner.password) return Response.json({ error: 'Incorrect password' }, { status: 401 });
      return Response.json({ success: true, partner: safePartner(partner) });
    }

    if (!phoneNumber || !name) return Response.json({ error: 'Phone number and name required' }, { status: 400 });
    if (!password || password.length < 6) return Response.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    if (!vehicleNumber?.trim()) return Response.json({ error: 'Vehicle number is required' }, { status: 400 });

    const existing = await DeliveryPartner.findOne({ phoneNumber });
    if (existing) return Response.json({ error: 'Partner already exists — please login' }, { status: 400 });

    const partner = await DeliveryPartner.create({
      phoneNumber, name,
      vehicleType: vehicleType || 'bike',
      vehicleNumber: vehicleNumber.trim().toUpperCase(),
      password,
    });

    return Response.json({ success: true, partner: safePartner(partner) });
  } catch {
    return Response.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    await connectDB();
    const body = await request.json();
    const { phoneNumber, password, action, ...updateData } = body;

    if (!phoneNumber) return Response.json({ error: 'Phone number required' }, { status: 400 });

    const partner = await DeliveryPartner.findOne({ phoneNumber });
    if (!partner) return Response.json({ error: 'Partner not found' }, { status: 404 });

    // ── Confirm COD payment (admin) — sets lastSettledAt, clears pending ─────
    if (action === 'confirmPayment') {
      partner.lastSettledAt         = new Date();
      partner.settlementPending     = false;
      partner.settlementAmount      = 0;
      partner.settlementRequestedAt = null;
      await partner.save();
      return Response.json({ success: true, partner: safePartner(partner) });
    }

    if (password) {
      if (password.length < 6) return Response.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
      partner.password = password;
    }

    const { phoneNumber: _p, createdAt: _c, password: _pw, passwordHash: _ph, ...safeUpdates } = updateData;
    Object.assign(partner, safeUpdates);
    await partner.save();

    return Response.json({ success: true, partner: safePartner(partner) });
  } catch {
    return Response.json({ error: 'Failed to update partner' }, { status: 500 });
  }
}

// ── PATCH — partner marks themselves as paid ──────────────────────────────────
export async function PATCH(request) {
  try {
    await connectDB();
    const body = await request.json();
    const { phoneNumber, ...fields } = body;

    if (!phoneNumber) return Response.json({ error: 'phoneNumber required' }, { status: 400 });

    const partner = await DeliveryPartner.findOne({ phoneNumber });
    if (!partner) return Response.json({ error: 'Partner not found' }, { status: 404 });

    const allowed = ['settlementPending', 'settlementAmount', 'settlementRequestedAt', 'lastSettledAt', 'adminUpiId'];
    for (const key of allowed) {
      if (key in fields) partner[key] = fields[key];
    }
    await partner.save();

    return Response.json({ success: true, partner: safePartner(partner) });
  } catch {
    return Response.json({ error: 'Failed to update partner' }, { status: 500 });
  }
}