import { connectDB } from '../../../lib/mongodb.js';
import Seller from '../../../models/Seller.js';

export async function POST(request) {
  try {
    await connectDB();
    const { phoneOrEmail, password } = await request.json();

    if (!phoneOrEmail || !password) {
      return Response.json({ error: 'Phone/Email and password required' }, { status: 400 });
    }

    const seller = await Seller.findOne({
      $or: [{ phoneNumber: phoneOrEmail }, { email: phoneOrEmail }],
    });

    if (!seller) return Response.json({ error: 'Seller not found. Please register first' }, { status: 404 });
    if (seller.password !== password) return Response.json({ error: 'Invalid password' }, { status: 401 });

    const sellerObj = seller.toObject();
    delete sellerObj.password;
    delete sellerObj.confirmPassword;

    return Response.json({ success: true, message: 'Login successful', seller: sellerObj });
  } catch (error) {
    console.error('Login error:', error);
    return Response.json({ error: 'Login failed' }, { status: 500 });
  }
}