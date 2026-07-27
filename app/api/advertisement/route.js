import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb'; // TODO: swap for your actual db connect helper if named differently
import Advertisement from '@/models/Advertisement';
import { getSellerIdFromRequest } from '@/lib/auth'; // TODO: replace with whatever you already use in /api/seller/profile — make sure it resolves to null (not throw) when there's no seller cookie, since the homepage hits this route unauthenticated

// GET
//   - called with a seller session (dashboard)  -> returns { success, ad } for that seller, active or not
//   - called with no seller session (homepage)   -> returns { success, ads } — every seller's active carousel
export async function GET(req) {
  try {
    await connectDB();
    const sellerId = await getSellerIdFromRequest(req).catch(() => null);

    if (sellerId) {
      let ad = await Advertisement.findOne({ sellerId });
      if (!ad) ad = { title: '', linkUrl: '', images: [], isActive: false };
      return NextResponse.json({ success: true, ad });
    }

    const ads = await Advertisement.find({ isActive: true, 'images.0': { $exists: true } })
      .populate('shopId', 'name slug') // adjust fields to whatever ShopSchema actually exposes
      .sort({ updatedAt: -1 })
      .limit(20)
      .lean();
    return NextResponse.json({ success: true, ads });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT — seller-only, saves their own ad
export async function PUT(req) {
  try {
    await connectDB();
    const sellerId = await getSellerIdFromRequest(req);
    if (!sellerId) return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });

    const body = await req.json();
    const { title = '', linkUrl = '', images = [], isActive = false } = body;

    if (images.length > 6) {
      return NextResponse.json({ success: false, error: 'Maximum 6 images per carousel' }, { status: 400 });
    }

    const cleanImages = images.map((img, i) => ({ url: img.url, publicId: img.publicId, order: i }));

    const ad = await Advertisement.findOneAndUpdate(
      { sellerId },
      { sellerId, title, linkUrl, images: cleanImages, isActive },
      { upsert: true, new: true, runValidators: true }
    );

    return NextResponse.json({ success: true, ad });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}