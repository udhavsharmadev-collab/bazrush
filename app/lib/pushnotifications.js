import { Capacitor } from '@capacitor/core';

export async function initPushNotifications(userPhone) {
  // Only run on native app, not website
  if (!Capacitor.isNativePlatform()) return;

  const { PushNotifications } = await import('@capacitor/push-notifications');

  // Request permission
  const permission = await PushNotifications.requestPermissions();
  if (permission.receive !== 'granted') return;

  await PushNotifications.register();

  // Save FCM token to your backend
  PushNotifications.addListener('registration', async (token) => {
    console.log('FCM Token:', token.value);
    if (userPhone) {
      await fetch(`/api/users/${encodeURIComponent(userPhone)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fcmToken: token.value }),
      });
    }
  });

  // Notification received while app is open
  PushNotifications.addListener('pushNotificationReceived', (notification) => {
    alert(`${notification.title}: ${notification.body}`);
  });

  // Notification tapped
  PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
    console.log('Notification tapped:', action);
  });
}