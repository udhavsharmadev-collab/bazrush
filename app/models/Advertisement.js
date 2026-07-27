import mongoose from 'mongoose';

// Kept as its own collection (not bolted onto SellerSchema) on purpose —
// last time a feature was added as loose fields on an existing schema
// (ShopSchema.overrideUntil/overrideStatus, ProductSchema.videoId) Mongoose's
// strict mode silently dropped them because they weren't declared. A fresh,
// explicitly-defined schema avoids that whole class of bug.

const AdImageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

const AdvertisementSchema = new mongoose.Schema(
  {
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Seller',
      required: true,
      unique: true, // one ad "slot" per seller — adjust if you want multiple
    },
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop' },
    title: { type: String, default: '', trim: true, maxlength: 60 },
    linkUrl: { type: String, default: '' }, // where tapping the banner sends customers (defaults to the seller's shop page if empty)
    images: {
      type: [AdImageSchema],
      default: [],
      validate: {
        validator: (arr) => arr.length <= 6,
        message: 'Maximum 6 images per carousel.',
      },
    },
    isActive: { type: Boolean, default: false }, // seller has to explicitly turn it on
  },
  { timestamps: true }
);

export default mongoose.models.Advertisement ||
  mongoose.model('Advertisement', AdvertisementSchema);