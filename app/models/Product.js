import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema({
  id: { type: String, unique: true },
  shopId: String, sellerPhone: String, name: String, category: String,
  sizes: [String], colors: [String], colorImageIds: [String],
  price: Number,
  mainImageId: String, imageIds: [String],
  stockQuantity: { type: Number, default: 0 },
  stockStatus: { type: String, enum: ['in_stock', 'out_of_stock'], default: 'out_of_stock' },
}, { timestamps: true });

export default mongoose.models.Product || mongoose.model('Product', ProductSchema);