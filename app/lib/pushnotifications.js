import { Capacitor } from '@capacitor/core';

export async function initPushNotifications(userPhone) {
  if (!Capacitor.isNativePlatform()) return;

  try {
    const { PushNotifications } = await import('@capacitor/push-notifications');

    const permission = await PushNotifications.requestPermissions();
    if (permission.receive !== 'granted') return;

    // Wait 2 seconds before registering
    await new Promise(resolve => setTimeout(resolve, 2000));

    await PushNotifications.register();

    PushNotifications.addListener('registration', async (token) => {
      console.log('FCM Token:', token.value);
      if (userPhone) {
        await fetch(`/api/users/${encodeURIComponent(userPhone)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fcmToken: token.value }),
        });
        await fetch(`/api/delivery-partners`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phoneNumber: userPhone, fcmToken: token.value }),
        });
      }
    });

    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      alert(`${notification.title}: ${notification.body}`);
    });

    PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      console.log('Notification tapped:', action);
    });

  } catch(e) {
    console.log('Push notifications failed:', e);
  }
}