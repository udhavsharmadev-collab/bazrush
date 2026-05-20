import { Capacitor } from '@capacitor/core';

export async function initPushNotifications(userPhone) {
  try {
    const { Capacitor } = await import('@capacitor/core');
    if (!Capacitor.isNativePlatform()) return;

    const { PushNotifications } = await import('@capacitor/push-notifications');

    const permission = await PushNotifications.requestPermissions();
    if (permission.receive !== 'granted') return;

    // Add listeners BEFORE registering
    PushNotifications.addListener('registration', async (token) => {
      console.log('FCM Token:', token.value);
      if (userPhone) {
        try {
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
        } catch(e) {}
      }
    });

    PushNotifications.addListener('registrationError', (error) => {
      console.log('Registration error:', error);
    });

    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      alert(`${notification.title}: ${notification.body}`);
    });

    // Register AFTER listeners are set up
    await PushNotifications.register();

  } catch(e) {
    console.log('Push failed:', e);
  }
}