import mongoose from 'mongoose';

const TimingSchema = new mongoose.Schema({
  open: String,
  close: String,
  closed: Boolean,
});

const ShopSchema = new mongoose.Schema({
  shopName: String,
  ownerName: String,
  sellerPhone: String,
  category: String,
  address: String,
  mainPhotoId: String,
  photoIds: [String],
  isOpen: Boolean,
  timing: {
    Monday: TimingSchema,
    Tuesday: TimingSchema,
    Wednesday: TimingSchema,
    Thursday: TimingSchema,
    Friday: TimingSchema,
    Saturday: TimingSchema,
    Sunday: TimingSchema,
  },
}, { timestamps: true });

export default mongoose.models.Shop || mongoose.model('Shop', ShopSchema);