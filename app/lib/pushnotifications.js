export async function initPushNotifications(userPhone) {
  try {
    const { Capacitor } = await import('@capacitor/core');
    if (!Capacitor.isNativePlatform()) return;

    const { PushNotifications } = await import('@capacitor/push-notifications');

    PushNotifications.addListener('registration', async (token) => {
      if (!userPhone || !token?.value) return;
      try {
        await fetch(`/api/delivery-partners`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phoneNumber: userPhone, fcmToken: token.value }),
        });
      } catch(e) {}
    });

    PushNotifications.addListener('registrationError', (err) => {
      console.log('reg error', JSON.stringify(err));
    });

    PushNotifications.addListener('pushNotificationReceived', (n) => {
      console.log('notification', n.title);
    });

    const permission = await PushNotifications.requestPermissions();
    if (permission.receive !== 'granted') return;

    await new Promise(r => setTimeout(r, 1000));

    try {
      await PushNotifications.register();
    } catch(e) {
      console.log('register failed:', e);
      // Don't crash — just log
    }

  } catch(e) {
    console.log('push init failed:', e);
  }
}