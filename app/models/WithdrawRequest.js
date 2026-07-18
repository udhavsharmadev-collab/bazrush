import mongoose from 'mongoose';

const WithdrawRequestSchema = new mongoose.Schema({
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller', required: true },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  paymentMode: { type: String, enum: ['upi', 'bank'], required: true },
  upiId: { type: String },
  bankDetails: {
    accountHolderName: String,
    accountNumber: String,
    ifsc: String,
    bankName: String,
  },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
}, { timestamps: true });

export default mongoose.models.WithdrawRequest || mongoose.model('WithdrawRequest', WithdrawRequestSchema);