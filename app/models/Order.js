import mongoose from 'mongoose';

const OrderShopSchema = new mongoose.Schema({
  // Accept BOTH naming conventions
  id:           String,
  shopId:       String,
  shopName:     String,
  name:         String,
  shopCategory: String,
  category:     String,
  shopPhoto:    String,
  photo:        String,
  mainPhotoId:  String,   // ← important! seller shops use this
  shopAddress:  String,
  address:      String,
  items:        [OrderItemSchema],
  subtotal:     Number,
}, { _id: false, strict: false });   // strict:false as belt-and-suspenders

export default mongoose.models.Order || mongoose.model('Order', OrderSchema);