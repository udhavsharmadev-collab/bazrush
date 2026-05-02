import { connectDB } from '../lib/mongodb.js';
import User from '../models/User.js';
import usersJSON from '../data/users.json' assert { type: 'json' };

async function migrate() {
  await connectDB();

  for (const [phone, userData] of Object.entries(usersJSON)) {
    await User.findOneAndUpdate(
      { phoneNumber: phone },
      { ...userData },
      { upsert: true, new: true }
    );
  }

  console.log('Migration done!');
  process.exit(0);
}

migrate();