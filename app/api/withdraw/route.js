import { connectDB } from '../../lib/mongodb.js';
import Seller from '../../models/Seller.js';
import WithdrawRequest from '../../models/WithdrawRequest.js';

export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();
    const { phoneNumber, name, phone, address, paymentMode, upiId, bankDetails, amount } = body;

    if (!phoneNumber) return Response.json({ error: 'Phone number required' }, { status: 400 });

    const seller = await Seller.findOne({ phoneNumber });
    if (!seller) return Response.json({ error: 'Seller not found' }, { status: 404 });

    if (!name || !phone || !address || !paymentMode || !amount) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }
    if (paymentMode === 'upi' && !upiId) {
      return Response.json({ error: 'UPI ID is required' }, { status: 400 });
    }
    if (paymentMode === 'bank' && (!bankDetails?.accountNumber || !bankDetails?.ifsc || !bankDetails?.accountHolderName)) {
      return Response.json({ error: 'Bank details incomplete' }, { status: 400 });
    }

    const withdrawRequest = await WithdrawRequest.create({
      seller: seller._id, name, phone, address, paymentMode, upiId, bankDetails, amount,
    });

    return Response.json({ success: true, message: 'Withdrawal request submitted', request: withdrawRequest });
  } catch (error) {
    console.error('POST withdraw error:', error);
    return Response.json({ error: 'Failed to submit withdrawal request' }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    await connectDB();
    const url = new URL(request.url);
    const phoneNumber = url.searchParams.get('phoneNumber');
    const all = url.searchParams.get('all');

    if (all === 'true') {
      const requests = await WithdrawRequest.find({})
        .populate('seller', 'name phoneNumber email')
        .sort({ createdAt: -1 })
        .lean();
      return Response.json({ requests });
    }

    if (!phoneNumber) return Response.json({ error: 'Phone number required' }, { status: 400 });

    const seller = await Seller.findOne({ phoneNumber });
    if (!seller) return Response.json({ error: 'Seller not found' }, { status: 404 });

    const requests = await WithdrawRequest.find({ seller: seller._id }).sort({ createdAt: -1 }).lean();
    return Response.json({ requests });
  } catch (error) {
    console.error('GET withdraw error:', error);
    return Response.json({ error: 'Failed to fetch withdrawal requests' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    await connectDB();
    const { id, status } = await request.json();

    if (!id || !status) return Response.json({ error: 'id and status are required' }, { status: 400 });
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return Response.json({ error: 'Invalid status' }, { status: 400 });
    }

    const updated = await WithdrawRequest.findByIdAndUpdate(id, { status }, { new: true })
      .populate('seller', 'name phoneNumber email');
    if (!updated) return Response.json({ error: 'Withdrawal request not found' }, { status: 404 });

    return Response.json({ success: true, request: updated });
  } catch (error) {
    console.error('PATCH withdraw error:', error);
    return Response.json({ error: 'Failed to update withdrawal request' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    await connectDB();
    const { id, phoneNumber } = await request.json();

    if (!id || !phoneNumber) return Response.json({ error: 'id and phoneNumber required' }, { status: 400 });

    const seller = await Seller.findOne({ phoneNumber });
    if (!seller) return Response.json({ error: 'Seller not found' }, { status: 404 });

    const reqDoc = await WithdrawRequest.findById(id);
    if (!reqDoc) return Response.json({ error: 'Request not found' }, { status: 404 });
    if (String(reqDoc.seller) !== String(seller._id)) {
      return Response.json({ error: 'Not authorized' }, { status: 403 });
    }
    if (reqDoc.status !== 'pending') {
      return Response.json({ error: 'Only pending requests can be cancelled' }, { status: 400 });
    }

    await WithdrawRequest.findByIdAndDelete(id);
    return Response.json({ success: true });
  } catch (error) {
    console.error('DELETE withdraw error:', error);
    return Response.json({ error: 'Failed to cancel withdrawal request' }, { status: 500 });
  }
}