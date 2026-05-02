import { connectDB } from '../../../lib/mongodb.js';
import User from '../../../models/User.js';

export async function POST(req) {
  try {
    await connectDB();
    const { phone, password } = await req.json();

    if (!phone || !password) {
      return Response.json({ error: 'Phone and password are required' }, { status: 400 });
    }
    if (password.length < 6) {
      return Response.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const user = await User.findOne({ phoneNumber: phone });
    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    user.password = password;
    await user.save();

    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
