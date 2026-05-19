import { PushNotifications } from '@capacitor/push-notifications';

export async function initPushNotifications() {
  // Request permission
  const permission = await PushNotifications.requestPermissions();
  
  if (permission.receive === 'granted') {
    await PushNotifications.register();
  }

  // Get FCM token
  PushNotifications.addListener('registration', async (token) => {
    console.log('FCM Token:', token.value);
    // Save token to your backend
    const phone = localStorage.getItem('userPhone'); // adjust based on your auth
    if (phone) {
      await fetch(`/api/users/${phone}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fcmToken: token.value }),
      });
    }
  });

  // Handle notification received while app is open
  PushNotifications.addListener('pushNotificationReceived', (notification) => {
    console.log('Notification received:', notification);
  });

  // Handle notification tap
  PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
    console.log('Notification tapped:', action);
  });
}