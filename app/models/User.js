import mongoose from 'mongoose';

const OrderItemSchema = new mongoose.Schema({
  key: String, name: String, price: Number, quantity: Number,
  selectedColor: mongoose.Schema.Types.Mixed,
  selectedSize: mongoose.Schema.Types.Mixed,
  imageId: String,
  productId: String,
}, { _id: false });

const OrderShopSchema = new mongoose.Schema({
  shopId:      String,
  shopName:    String,
  shopCategory: String,
  shopPhoto:   String,
  shopAddress: String,
  subtotal:    Number,
  items:       [OrderItemSchema],

  id:          String,
  name:        String,
  photo:       String,
  mainPhotoId: String,
  category:    String,
  address:     String,
}, {
  _id: false,
  strict: false,
});

const OrderSchema = new mongoose.Schema({
  id: String,
  placedAt: String,
  status: { type: String, default: 'confirmed' },
  paymentMethod: String,
  customer: {
    name: String, phone: String, email: String,
    address: String, lat: Number, lng: Number,
  },
  shops: [OrderShopSchema],
  items: { type: Array, default: [] },
  subtotal: Number,
  deliveryFee: Number,
  deliveryDistanceKm: mongoose.Schema.Types.Mixed,
  platformFee: Number,
  totalPrice: Number,
  totalCount: Number,
  deliveryOtp: String,
  assignedPartner: String,
  assignedPartnerName: String,
}, { _id: false });

// Wishlist item — stores enough info to render the card without extra fetches
const WishlistItemSchema = new mongoose.Schema({
  id:          { type: String, required: true },
  name:        String,
  price:       Number,
  category:    String,
  mainImageId: String,
  stockStatus: String,
  shopId:      String,
}, { _id: false });

const UserSchema = new mongoose.Schema({
  phoneNumber: { type: String, required: true, unique: true },
  name: String, age: String, email: String,
  address: String, lat: Number, lng: Number, password: String,
  cart:      { type: Array,              default: [] },
  orders:    { type: [OrderSchema],      default: [] },
  reviews:   { type: Array,              default: [] },
  wishlist:  { type: [WishlistItemSchema], default: [] }, // ← new
}, { timestamps: true });

export default mongoose.models.User || mongoose.model('User', UserSchema);