import { connectDB } from '../../lib/mongodb.js';
import DeliveryPartner from '../../models/DeliveryPartner.js';

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const phoneNumber = searchParams.get('phoneNumber');

    if (phoneNumber) {
      const partner = await DeliveryPartner.findOne({ phoneNumber }).lean();
      if (!partner) return Response.json({ error: 'Partner not found' }, { status: 404 });
      return Response.json({ partner });
    }

    const all = await DeliveryPartner.find({}).lean();
    const shaped = {};
    for (const p of all) shaped[p.phoneNumber] = p;
    return Response.json(shaped);
  } catch {
    return Response.json({ error: 'Failed to read partners' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const { phoneNumber, name, vehicleType, vehicleNumber } = await request.json();

    if (!phoneNumber || !name) return Response.json({ error: 'Phone number and name required' }, { status: 400 });

    const existing = await DeliveryPartner.findOne({ phoneNumber });
    if (existing) return Response.json({ error: 'Partner already exists — please login' }, { status: 400 });

    const partner = await DeliveryPartner.create({
      phoneNumber, name,
      vehicleType: vehicleType || 'bike',
      vehicleNumber: vehicleNumber || '',
    });
    return Response.json({ success: true, partner });
  } catch {
    return Response.json({ error: 'Failed to register partner' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    await connectDB();
    const body = await request.json();
    const { phoneNumber, ...updateData } = body;

    if (!phoneNumber) return Response.json({ error: 'Phone number required' }, { status: 400 });

    const partner = await DeliveryPartner.findOne({ phoneNumber });
    if (!partner) return Response.json({ error: 'Partner not found' }, { status: 404 });

    const { phoneNumber: _p, createdAt: _c, ...safeUpdates } = updateData;
    Object.assign(partner, safeUpdates);
    await partner.save();
    return Response.json({ success: true, partner });
  } catch {
    return Response.json({ error: 'Failed to update partner' }, { status: 500 });
  }
}