export const dynamic = 'force-dynamic';

import { connectDB } from '../../../lib/mongodb.js';
import DeliveryPartner from '../../../models/DeliveryPartner.js';

export async function GET(request, { params }) {
  try {
    await connectDB();
    const phoneNumber = decodeURIComponent(params.phoneNumber);
    const partner = await DeliveryPartner.findOne({ phoneNumber }).lean();
    if (!partner) return Response.json({ error: 'Partner not found' }, { status: 404 });
    return Response.json({ partner });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    await connectDB();
    const phoneNumber = decodeURIComponent(params.phoneNumber);
    const body = await request.json();
    const { phoneNumber: _p, createdAt: _c, ...safeUpdates } = body;

    const partner = await DeliveryPartner.findOneAndUpdate(
      { phoneNumber },
      { $set: safeUpdates },
      { new: true }
    );
    if (!partner) return Response.json({ error: 'Partner not found' }, { status: 404 });
    return Response.json({ success: true, partner });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}