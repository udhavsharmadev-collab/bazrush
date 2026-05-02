import mongoose from 'mongoose';

const OrderItemSchema = new mongoose.Schema({
  key: String, name: String, price: Number, quantity: Number,
  selectedColor: mongoose.Schema.Types.Mixed,
  selectedSize: mongoose.Schema.Types.Mixed,
  imageId: String,
  productId: String,
}, { _id: false });

const OrderShopSchema = new mongoose.Schema({
  // Primary fields used by OrdersPage / OrdersTab
  shopId:      String,
  shopName:    String,
  shopCategory: String,
  shopPhoto:   String,
  shopAddress: String,
  subtotal:    Number,
  items:       [OrderItemSchema],

  // Alternate field names that seller shops may use — stored here so they
  // round-trip correctly even if checkout saves them under the seller's naming
  id:          String,   // seller ShopSchema uses "id" not "shopId"
  name:        String,   // in case shopName wasn't mapped
  photo:       String,   // in case shopPhoto wasn't mapped
  mainPhotoId: String,   // seller ShopSchema uses this for the photo
  category:    String,
  address:     String,
}, {
  _id: false,
  strict: false,  // never silently drop unknown fields — accept anything checkout saves
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
  items: { type: Array, default: [] }, // flat item list some checkout flows save
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

const UserSchema = new mongoose.Schema({
  phoneNumber: { type: String, required: true, unique: true },
  name: String, age: String, email: String,
  address: String, lat: Number, lng: Number, password: String,
  cart: { type: Array, default: [] },
  orders: { type: [OrderSchema], default: [] },
  reviews: { type: Array, default: [] },
}, { timestamps: true });

export default mongoose.models.User || mongoose.model('User', UserSchema);