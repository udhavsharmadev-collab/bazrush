import { connectDB } from '../../lib/mongodb.js';
import User from '../../models/User.js';
import admin from 'firebase-admin';

// Initialize Firebase Admin
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export async function POST(request) {
  try {
    const { phone, fcmToken, title, body } = await request.json();

    let token = fcmToken;

    if (!token && phone) {
      await connectDB();
      const user = await User.findOne({ phoneNumber: phone }).lean();
      token = user?.fcmToken;
    }

    if (!token) {
      return Response.json({ error: 'No FCM token found' }, { status: 404 });
    }

    const message = {
      notification: { title, body },
      token,
    };

    const result = await admin.messaging().send(message);
    return Response.json({ success: true, result });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}