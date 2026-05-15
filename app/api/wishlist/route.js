// app/api/wishlist/route.js
import { connectDB } from '../../lib/mongodb.js';
import User from '../../models/User.js';

// GET /api/wishlist?phone=+91xxxxxxxxxx
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');
    if (!phone) return Response.json({ error: 'phone required' }, { status: 400 });

    await connectDB();
    const user = await User.findOne({ phoneNumber: phone }).lean();

    // Debug: log what we searched for and whether we found it
    console.log('[Wishlist GET] phone:', phone, '| user found:', !!user, '| wishlist count:', user?.wishlist?.length ?? 0);

    return Response.json({ wishlist: user?.wishlist || [] });
  } catch (err) {
    console.error('[Wishlist GET] error:', err);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST /api/wishlist
// Body: { phone, product }
export async function POST(request) {
  try {
    const { phone, product } = await request.json();
    if (!phone || !product?.id) return Response.json({ error: 'phone and product required' }, { status: 400 });

    await connectDB();

    // Pull first to prevent duplicates, then push fresh
    await User.updateOne({ phoneNumber: phone }, { $pull: { wishlist: { id: product.id } } });
    const result = await User.updateOne({ phoneNumber: phone }, { $push: { wishlist: product } });

    console.log('[Wishlist POST] phone:', phone, '| matched:', result.matchedCount, '| product:', product.id);

    if (result.matchedCount === 0) {
      // User not found — means phone format mismatch between auth and DB
      console.error('[Wishlist POST] No user found for phone:', phone);
      return Response.json({ error: 'User not found. Check phone format.' }, { status: 404 });
    }

    return Response.json({ success: true });
  } catch (err) {
    console.error('[Wishlist POST] error:', err);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}

// DELETE /api/wishlist
// Body: { phone, productId }
export async function DELETE(request) {
  try {
    const { phone, productId } = await request.json();
    if (!phone || !productId) return Response.json({ error: 'phone and productId required' }, { status: 400 });

    await connectDB();
    const result = await User.updateOne(
      { phoneNumber: phone },
      { $pull: { wishlist: { id: productId } } }
    );

    console.log('[Wishlist DELETE] phone:', phone, '| matched:', result.matchedCount, '| productId:', productId);

    return Response.json({ success: true });
  } catch (err) {
    console.error('[Wishlist DELETE] error:', err);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}