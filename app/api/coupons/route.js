import { connectDB } from '../../lib/mongodb.js';
import Coupon from '../../models/Coupon.js';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    await connectDB();
    const sellerPhone = request.nextUrl.searchParams.get('sellerPhone');

    if (!sellerPhone) return NextResponse.json({ error: 'sellerPhone required' }, { status: 400 });

    const coupons = await Coupon.find({ sellerPhone }).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ coupons });
  } catch (error) {
    console.error('Fetch coupons error:', error);
    return NextResponse.json({ error: 'Failed to read coupons' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();

    if (!body.sellerPhone) return NextResponse.json({ error: 'sellerPhone required' }, { status: 400 });
    if (!body.code || !body.code.trim()) return NextResponse.json({ error: 'Coupon code required' }, { status: 400 });

    const discountAmount = parseFloat(body.discountAmount);
    const minCartValue = parseFloat(body.minCartValue) || 0;

    if (!discountAmount || discountAmount <= 0) {
      return NextResponse.json({ error: 'Invalid discount amount' }, { status: 400 });
    }

    const code = body.code.trim().toUpperCase();

    const existing = await Coupon.findOne({ sellerPhone: body.sellerPhone, code });
    if (existing) {
      return NextResponse.json({ error: 'A coupon with this code already exists' }, { status: 409 });
    }

    const newCoupon = await Coupon.create({
      id: Date.now().toString(),
      sellerPhone: body.sellerPhone,
      code,
      minCartValue,
      discountAmount,
    });

    return NextResponse.json({ success: true, coupon: newCoupon });
  } catch (error) {
    console.error('Create coupon error:', error);
    return NextResponse.json({ error: 'Failed to create coupon' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    await connectDB();
    const couponId = request.nextUrl.searchParams.get('id');
    const sellerPhone = request.nextUrl.searchParams.get('sellerPhone');

    if (!couponId) return NextResponse.json({ error: 'Coupon ID required' }, { status: 400 });
    if (!sellerPhone) return NextResponse.json({ error: 'sellerPhone required' }, { status: 400 });

    const deleted = await Coupon.findOneAndDelete({ id: couponId, sellerPhone });
    if (!deleted) return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete coupon error:', error);
    return NextResponse.json({ error: 'Failed to delete coupon' }, { status: 500 });
  }
}