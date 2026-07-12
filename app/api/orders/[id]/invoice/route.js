export const dynamic = 'force-dynamic';

import { connectDB } from '../../../lib/mongodb.js';
import User from '../../../models/User.js';
import { generateInvoicePDF } from '../../../../lib/generateInvoice.js';

export async function GET(request, { params }) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');
    const orderId = params.id;

    if (!phone) {
      return Response.json({ error: 'phone is required' }, { status: 400 });
    }

    const user = await User.findOne({ phoneNumber: phone }).lean();
    if (!user) return Response.json({ error: 'User not found' }, { status: 404 });

    const order = (user.orders || []).find(o => o.id === orderId);
    if (!order) return Response.json({ error: 'Order not found' }, { status: 404 });

    if (order.status !== 'delivered') {
      return Response.json({ error: 'Invoice only available after delivery' }, { status: 400 });
    }

    const pdfBuffer = await generateInvoicePDF(order);

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${order.id}.pdf"`,
      },
    });
  } catch (error) {
    console.error('❌ Invoice generation failed:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}