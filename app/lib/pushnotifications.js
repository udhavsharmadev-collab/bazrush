export async function initPushNotifications(userPhone) {
  try {
    const { Capacitor } = await import('@capacitor/core');
    if (!Capacitor.isNativePlatform()) return;

    const { initializeApp } = await import('firebase/app');
    const { getMessaging, getToken } = await import('firebase/messaging');

    const app = initializeApp({
      apiKey: "AIzaSyB-ACI2LRV2TUZSpNkzrS0i41-d4v-XT3Y",
      projectId: "bazrush-52795",
      messagingSenderId: "941664723098",
      appId: "1:941664723098:android:f746c5530f2f6476d3e950"
    });

    const messaging = getMessaging(app);
    const token = await getToken(messaging);
    
    if (token && userPhone) {
      await fetch(`/api/delivery-partners`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: userPhone, fcmToken: token }),
      });
    }
  } catch(e) {
    console.log('Push failed:', e);
  }
}
// it will work im sure