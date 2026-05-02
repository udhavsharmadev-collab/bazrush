export const dynamic = 'force-dynamic';

import { connectDB } from '../../lib/mongodb.js';
import User from '../../models/User.js';
import Product from '../../models/Product.js';

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const phone  = searchParams.get('phone');
    const shopId = searchParams.get('shopId');
    const all    = searchParams.get('all');

    // ── Customer: their own orders ─────────────────────────────────────────
    if (phone) {
      const user = await User.findOne({ phoneNumber: phone }).lean();
      return Response.json(user?.orders || []);
    }

    // ── Delivery partner: ALL orders across every user ─────────────────────
    // Used by DeliveryOrders.jsx polling — replaces the old /api/users hack
    if (all === 'true') {
      const users = await User.find(
        { 'orders.0': { $exists: true } },
        { phoneNumber: 1, orders: 1, lat: 1, lng: 1 }
      ).lean();

      const results = [];
      for (const user of users) {
        for (const o of user.orders || []) {
          if (!o.shops?.length) continue;
          results.push({
            ...o,
            customer: {
              ...o.customer,
              lat: o.customer?.lat || user.lat,
              lng: o.customer?.lng || user.lng,
            },
            customerPhone: user.phoneNumber,
          });
        }
      }
      results.sort((a, b) => new Date(b.placedAt) - new Date(a.placedAt));
      return Response.json(results);
    }

    // ── Seller: orders for their shops ─────────────────────────────────────
    if (shopId) {
      const shopIds = shopId.split(',').map(s => s.trim()).filter(Boolean);

      const users = await User.find({
        $or: [
          { 'orders.shops.shopId': { $in: shopIds } },
          { 'orders.shops.id':     { $in: shopIds } },
        ],
      }).select('phoneNumber orders').lean();

      const results = [];
      for (const user of users) {
        for (const order of user.orders || []) {
          for (const shopEntry of order.shops || []) {
            const entryId = shopEntry.shopId || shopEntry.id;
            if (!shopIds.includes(entryId)) continue;
            results.push({
              orderId:             order.id,
              placedAt:            order.placedAt,
              status:              order.status,
              paymentMethod:       order.paymentMethod,
              customer:            order.customer,
              customerPhone:       user.phoneNumber,
              shop: {
                ...shopEntry,
                shopId:    entryId,
                shopName:  shopEntry.shopName  || shopEntry.name  || 'Shop',
                shopPhoto: shopEntry.shopPhoto || shopEntry.mainPhotoId || shopEntry.photo || '',
              },
              totalPrice:          order.totalPrice,
              deliveryOtp:         order.deliveryOtp,
              assignedPartner:     order.assignedPartner,
              assignedPartnerName: order.assignedPartnerName,
            });
          }
        }
      }
      results.sort((a, b) => new Date(b.placedAt) - new Date(a.placedAt));
      return Response.json(results);
    }

    return Response.json([]);
  } catch (error) {
    console.error('❌ GET orders failed:', error.message);
    return Response.json([]);
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const { phone, order } = await request.json();

    const user = await User.findOne({ phoneNumber: phone });
    if (!user) return Response.json({ error: 'User not found' }, { status: 404 });

    const stockErrors = [];
    for (const item of order.items || []) {
      const product = await Product.findOne({ id: item.productId });
      if (!product) continue;
      const qty = item.quantity || 1;
      if (product.stockStatus !== 'in_stock' || product.stockQuantity < qty) {
        stockErrors.push(`"${product.name}" only has ${product.stockQuantity} left in stock.`);
        continue;
      }
      product.stockQuantity -= qty;
      if (product.stockQuantity <= 0) {
        product.stockQuantity = 0;
        product.stockStatus   = 'out_of_stock';
      }
      await product.save();
    }

    if (stockErrors.length > 0) {
      return Response.json({ error: 'Stock unavailable', details: stockErrors }, { status: 409 });
    }

    user.orders.unshift(order);
    await user.save();

    return Response.json({ success: true, order });
  } catch (error) {
    console.error('❌ POST order failed:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// ── Seller (status) + Delivery partner (assign/otp/deliver) ──────────────────
export async function PATCH(request) {
  try {
    await connectDB();
    const body = await request.json();
    const { customerPhone, orderId, ...patch } = body;

    if (!customerPhone || !orderId) {
      return Response.json({ error: 'customerPhone and orderId are required' }, { status: 400 });
    }

    delete patch.id;
    delete patch.placedAt;
    delete patch.customerPhone;

    const user = await User.findOne({ phoneNumber: customerPhone });
    if (!user) return Response.json({ error: 'User not found' }, { status: 404 });

    const order = user.orders.find(o => o.id === orderId);
    if (!order) return Response.json({ error: 'Order not found' }, { status: 404 });

    Object.assign(order, patch);
    await user.save();

    console.log(`✅ Order ${orderId} patched: ${Object.keys(patch).join(', ')}`);
    return Response.json({ success: true, orderId, order });
  } catch (error) {
    console.error('❌ PATCH order failed:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}