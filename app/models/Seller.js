import mongoose from 'mongoose';

const TimingDaySchema = new mongoose.Schema({
  open: String, close: String, closed: Boolean,
}, { _id: false });

const ShopSchema = new mongoose.Schema({
  id: String,
  shopName: String,
  ownerName: String,
  category: String,
  address: String,
  mainPhotoId: String,
  photoIds: [String],
  isOpen: { type: Boolean, default: true },
  timing: {
    Monday: TimingDaySchema, Tuesday: TimingDaySchema, Wednesday: TimingDaySchema,
    Thursday: TimingDaySchema, Friday: TimingDaySchema, Saturday: TimingDaySchema, Sunday: TimingDaySchema,
  },
  createdAt: String,
  updatedAt: String,
}, { _id: false });

const SellerSchema = new mongoose.Schema({
  phoneNumber: { type: String, required: true, unique: true },
  name: String, age: String, gstin: String,
  password: String, confirmPassword: String, email: String,
  shops: { type: [ShopSchema], default: [] },
}, { timestamps: true });

export default mongoose.models.Seller || mongoose.model('Seller', SellerSchema);