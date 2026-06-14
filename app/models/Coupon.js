import mongoose from 'mongoose';

const CouponSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  sellerPhone: { type: String, required: true },
  code: { type: String, required: true, uppercase: true, trim: true },
  minCartValue: { type: Number, default: 0 },
  discountAmount: { type: Number, required: true },
}, { timestamps: true });

export default mongoose.models.Coupon || mongoose.model('Coupon', CouponSchema);