import { connectDB } from '../../lib/mongodb.js';
import User from '../../models/User.js';

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get('shopId');

    const users = await User.find({}).select('reviews').lean();

    const reviews = [];
    for (const user of users) {
      for (const review of (user.reviews || [])) {
        if (!shopId || review.shopId === shopId) reviews.push(review);
      }
    }
    reviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return Response.json(reviews);
  } catch (error) {
    return Response.json([], { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const { phone, review } = await request.json();

    const user = await User.findOne({ phoneNumber: phone });
    if (!user) return Response.json({ error: 'User not found' }, { status: 404 });

    if (!user.reviews) user.reviews = [];

    // Prevent duplicate review
    const exists = user.reviews.find(r =>
      r.type === review.type &&
      r.orderId === review.orderId &&
      (review.type === 'shop' ? r.shopId === review.shopId : r.productId === review.productId)
    );
    if (exists) return Response.json({ error: 'Already reviewed' }, { status: 409 });

    user.reviews.unshift(review);
    await user.save();
    return Response.json({ success: true, review });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}