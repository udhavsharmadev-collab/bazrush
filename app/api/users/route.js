import { connectDB } from '../../lib/mongodb.js';
import User from '../../models/User.js';

// Only kept for any legacy calls — new code should use /api/users/[phoneNumber]
export async function GET() {
  try {
    await connectDB();
    const users = await User.find({}).lean();
    const shaped = {};
    for (const u of users) shaped[u.phoneNumber] = u;
    return Response.json(shaped);
  } catch (error) {
    return Response.json({}, { status: 500 });
  }
}