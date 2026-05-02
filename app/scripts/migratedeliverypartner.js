import { connectDB } from '../lib/mongodb.js';
import DeliveryPartner from '../models/DeliveryPartner.js';
import deliveryPartnersJSON from '../data/delivery-partners.json' assert { type: 'json' };

async function migrate() {
  await connectDB();

  const entries = Array.isArray(deliveryPartnersJSON)
    ? deliveryPartnersJSON
    : Object.values(deliveryPartnersJSON);

  for (const partner of entries) {
    if (!partner.phoneNumber) continue;
    await DeliveryPartner.findOneAndUpdate(
      { phoneNumber: partner.phoneNumber },
      { ...partner },
      { upsert: true, new: true }
    );
    console.log(`✅ Migrated partner: ${partner.phoneNumber}`);
  }

  console.log('✅ Delivery partners migration done!');
  process.exit(0);
}

migrate().catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});