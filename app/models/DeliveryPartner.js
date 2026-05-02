import mongoose from 'mongoose';

const DeliveryPartnerSchema = new mongoose.Schema({
  phoneNumber: { type: String, required: true, unique: true },
  name: String,
  vehicleType: { type: String, default: 'bike' },
  vehicleNumber: { type: String, default: '' },
  isOnline: { type: Boolean, default: false },
  totalDeliveries: { type: Number, default: 0 },
  totalEarnings: { type: Number, default: 0 },
  lat: Number, lng: Number,
}, { timestamps: true });

export default mongoose.models.DeliveryPartner || mongoose.model('DeliveryPartner', DeliveryPartnerSchema);