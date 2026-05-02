export const dynamic = 'force-dynamic';

import { connectDB } from '../../../lib/mongodb.js';
import User from '../../../models/User.js';

export async function GET(request, { params }) {
  try {
    await connectDB();
    const { phone: rawPhone } = await params;
    const phone = decodeURIComponent(rawPhone);
    const user = await User.findOne({ phoneNumber: phone }).lean();
    if (!user) return Response.json({ error: 'User not found' }, { status: 404 });
    return Response.json(user);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    await connectDB();
    const { phone: rawPhone } = await params;
    const phone = decodeURIComponent(rawPhone);
    const body = await request.json();
    const user = await User.findOneAndUpdate(
      { phoneNumber: phone },
      { ...body, phoneNumber: phone },
      { upsert: true, new: true }
    );
    return Response.json({ success: true, user });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    await connectDB();
    const { phone: rawPhone } = await params;
    const phone = decodeURIComponent(rawPhone);
    const body = await request.json();
    const user = await User.findOne({ phoneNumber: phone });
    if (!user) return Response.json({ error: 'User not found' }, { status: 404 });
    Object.assign(user, body);
    await user.save();
    return Response.json({ success: true, user });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}