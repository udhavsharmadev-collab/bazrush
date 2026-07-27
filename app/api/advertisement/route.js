import { connectDB } from '../../lib/mongodb.js';
import Advertisement from '../../models/Advertisement.js';
import { NextResponse } from 'next/server';

// GET
//   /api/advertisement?sellerPhone=...  -> that seller's own ad (dashboard), active or not
//   /api/advertisement                  -> every active seller's ad (homepage), public
export async function GET(request) {
  try {
    await connectDB();
    const sellerPhone = request.nextUrl.searchParams.get('sellerPhone');

    if (sellerPhone) {
      let ad = await Advertisement.findOne({ sellerPhone }).lean();
      if (!ad) ad = { title: '', linkUrl: '', images: [], isActive: false };
      return NextResponse.json({ ad });
    }

    const ads = await Advertisement.find({ isActive: true, 'images.0': { $exists: true } })
      .sort({ updatedAt: -1 })
      .limit(20)
      .lean();
    return NextResponse.json({ ads });
  } catch (error) {
    console.error('Fetch advertisement error:', error);
    return NextResponse.json({ error: 'Failed to read advertisement' }, { status: 500 });
  }
}

// PUT — create or update the calling seller's ad. Body must include sellerPhone.
export async function PUT(request) {
  try {
    await connectDB();
    const body = await request.json();

    if (!body.sellerPhone) return NextResponse.json({ error: 'sellerPhone required' }, { status: 400 });

    const title = (body.title || '').trim();
    const linkUrl = body.linkUrl || '';
    const isActive = !!body.isActive;
    const images = Array.isArray(body.images) ? body.images : [];

    if (images.length > 6) {
      return NextResponse.json({ error: 'Maximum 6 images per carousel' }, { status: 400 });
    }

    const cleanImages = images.map((img, i) => ({ imageId: img.imageId, order: i }));

    const ad = await Advertisement.findOneAndUpdate(
      { sellerPhone: body.sellerPhone },
      { sellerPhone: body.sellerPhone, title, linkUrl, images: cleanImages, isActive },
      { upsert: true, new: true, runValidators: true }
    );

    return NextResponse.json({ success: true, ad });
  } catch (error) {
    console.error('Save advertisement error:', error);
    return NextResponse.json({ error: 'Failed to save advertisement' }, { status: 500 });
  }
}