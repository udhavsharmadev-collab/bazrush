import { connectDB } from '../../lib/mongodb.js';
import Seller from '../../models/Seller.js';

// Normalise a single shop object so the UI always gets consistent fields
function normaliseShop(s) {
  return {
    ...s,
    id:       s.id       || s.shopId || '',
    shopId:   s.shopId   || s.id     || '',
    shopName: s.shopName || s.name   || '',
    name:     s.name     || s.shopName || '',
  };
}

export async function GET(request) {
  try {
    await connectDB();
    const url         = new URL(request.url);
    const phoneNumber = url.searchParams.get('phoneNumber');
    const email       = url.searchParams.get('email');
    const shopId      = url.searchParams.get('shopId');

    if (phoneNumber) {
      const seller = await Seller.findOne({ phoneNumber }).lean();
      if (!seller) return Response.json({ error: 'Seller not found' }, { status: 404 });
      return Response.json({
        seller: {
          ...seller,
          shops: (seller.shops || []).map(normaliseShop),
        },
      });
    }

    if (email) {
      const seller = await Seller.findOne({ email }).lean();
      if (!seller) return Response.json({ error: 'Seller not found' }, { status: 404 });
      return Response.json({
        seller: {
          ...seller,
          shops: (seller.shops || []).map(normaliseShop),
        },
      });
    }

    if (shopId) {
      // Match against both 'shops.id' and 'shops.shopId'
      const seller = await Seller.findOne({
        $or: [{ 'shops.id': shopId }, { 'shops.shopId': shopId }],
      }).lean();
      if (!seller) return Response.json({ shop: null }, { status: 404 });
      const shop = seller.shops.find(s => s.id === shopId || s.shopId === shopId);
      return Response.json({ shop: { ...normaliseShop(shop), ownerName: seller.name } });
    }

    const sellers = await Seller.find({}).lean();
    return Response.json(
      sellers.map(seller => ({
        ...seller,
        shops: (seller.shops || []).map(normaliseShop),
      }))
    );
  } catch (error) {
    console.error('GET sellers error:', error);
    return Response.json({ error: 'Failed to read sellers' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();
    const { phoneNumber, email, ...sellerData } = body;

    const existing = await Seller.findOne({ phoneNumber });
    if (existing) {
      return Response.json(
        { error: 'User already exists - Please login instead' },
        { status: 400 }
      );
    }

    const seller = await Seller.create({ phoneNumber, email, ...sellerData });
    return Response.json({ success: true, message: 'Seller registered successfully', seller });
  } catch (error) {
    console.error('POST sellers error:', error);
    return Response.json({ error: 'Failed to register seller' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    await connectDB();
    const body = await request.json();
    const { phoneNumber, shop, shops, ...updateData } = body;

    if (!phoneNumber) return Response.json({ error: 'Phone number required' }, { status: 400 });

    const seller = await Seller.findOne({ phoneNumber });
    if (!seller) return Response.json({ error: 'Seller not found' }, { status: 404 });

    if (shop && typeof shop === 'object') {
      if (!shop.shopName || !shop.address || !shop.category) {
        return Response.json(
          { error: 'Shop name, address, and category required' },
          { status: 400 }
        );
      }
      const newShop = {
        id:        Date.now().toString(),
        shopId:    Date.now().toString(), // store both so either lookup works
        ...shop,
        shopName:  shop.shopName || shop.name || '',
        name:      shop.name     || shop.shopName || '',
        createdAt: new Date().toISOString(),
      };
      seller.shops.push(newShop);
    }

    if (shops && Array.isArray(shops)) {
      seller.shops = shops.map(s => ({
        ...s,
        id:      s.id      || s.shopId || Date.now().toString(),
        shopId:  s.shopId  || s.id     || Date.now().toString(),
        shopName: s.shopName || s.name || '',
        name:     s.name    || s.shopName || '',
      }));
    }

    Object.assign(seller, updateData);
    await seller.save();
    return Response.json({
      success: true,
      message: 'Seller updated successfully',
      seller: {
        ...seller.toObject(),
        shops: (seller.shops || []).map(normaliseShop),
      },
    });
  } catch (error) {
    console.error('PUT sellers error:', error);
    return Response.json({ error: 'Failed to update seller' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    await connectDB();
    const body = await request.json();
    const { phoneNumber, updatedData } = body;

    if (!phoneNumber) return Response.json({ error: 'Phone number required' }, { status: 400 });

    const seller = await Seller.findOne({ phoneNumber });
    if (!seller) return Response.json({ error: 'Seller not found' }, { status: 404 });

    const { phoneNumber: _p, createdAt: _c, ...safeUpdates } = updatedData || {};
    Object.assign(seller, safeUpdates);
    await seller.save();
    return Response.json({
      success: true,
      message: 'Profile updated successfully',
      seller: {
        ...seller.toObject(),
        shops: (seller.shops || []).map(normaliseShop),
      },
    });
  } catch (error) {
    console.error('PATCH sellers error:', error);
    return Response.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}