import { connectDB } from '../../lib/mongodb.js';
import User from '../../models/User.js';

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');
    if (!phone) return Response.json({ error: 'phone required' }, { status: 400 });

    const user = await User.findOne({ phoneNumber: phone }).select('cart').lean();
    return Response.json({ cart: user?.cart || [] });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    await connectDB();
    const { phone, cart } = await request.json();
    if (!phone) return Response.json({ error: 'phone required' }, { status: 400 });

    const user = await User.findOneAndUpdate(
      { phoneNumber: phone },
      { $set: { cart } },
      { new: true }
    ).select('cart');

    if (!user) return Response.json({ error: 'User not found' }, { status: 404 });
    return Response.json({ success: true, cart: user.cart });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}