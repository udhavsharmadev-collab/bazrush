import { Capacitor } from '@capacitor/core';



export async function initPushNotifications(userPhone) {
  try {
    const { Capacitor } = await import('@capacitor/core');
    if (!Capacitor.isNativePlatform()) return;

    const { PushNotifications } = await import('@capacitor/push-notifications');

    const permission = await PushNotifications.requestPermissions();
    if (permission.receive !== 'granted') return;

    // Don't register yet, just confirm permission works
    console.log('Permission granted!');

  } catch(e) {
    console.log('Push failed:', e);
  }
}