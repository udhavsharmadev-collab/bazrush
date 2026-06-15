import mongoose from 'mongoose';

const CouponSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  sellerPhone: { type: String, required: true },
  code: { type: String, required: true, uppercase: true, trim: true },
  minCartValue: { type: Number, default: 0 },
  type: { type: String, enum: ['discount', 'product'], default: 'discount' },
  discountAmount: { type: Number },
  rewardType: { type: String, enum: ['free', 'percent'] },
  rewardValue: { type: Number },
  productId: { type: String },
  productName: { type: String },
  productImage: { type: String },
}, { timestamps: true });

export default mongoose.models.Coupon || mongoose.model('Coupon', CouponSchema);