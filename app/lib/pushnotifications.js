import { Capacitor } from '@capacitor/core';

export async function initPushNotifications(userPhone) {
  if (!Capacitor.isNativePlatform()) return;

  const { PushNotifications } = await import('@capacitor/push-notifications');

  // ✅ Attach ALL listeners FIRST, before any permission/register calls
  PushNotifications.addListener('registration', async (token) => {
    console.log('FCM Token:', token.value);
    try {
      await fetch('/api/delivery-partners', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: userPhone, fcmToken: token.value }),
      });
    } catch (e) {
      console.log('Token save failed:', e);
    }
  });

  PushNotifications.addListener('registrationError', (error) => {
    console.log('Registration error:', error);
  });

  PushNotifications.addListener('pushNotificationReceived', (notification) => {
    // ✅ Never use alert() here — it can crash on Android
    console.log('Notification received:', notification.title, notification.body);
  });

  PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
    console.log('Notification tapped:', action);
  });

  // ✅ Request permission AFTER listeners are set up
  const permission = await PushNotifications.requestPermissions();
  if (permission.receive !== 'granted') return;

  // ✅ Small delay before register — lets the native bridge stabilize
  await new Promise(res => setTimeout(res, 300));
  await PushNotifications.register();
}