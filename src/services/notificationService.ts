import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../lib/supabase';

// Configure how notifications are presented when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Push notification permission not granted');
    return null;
  }

  const tokenData = await Notifications.getExpoPushTokenAsync({
    projectId: '9311807a-428e-4f90-8fe1-269b7313596a',
  });

  return tokenData.data;
}

export async function savePushToken(token: string): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const { error } = await supabase
    .from('profiles')
    .update({ push_token: token })
    .eq('id', user.id);

  if (error) {
    console.error('Error saving push token:', error);
  }
}

export async function clearPushToken(): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const { error } = await supabase
    .from('profiles')
    .update({ push_token: null })
    .eq('id', user.id);

  if (error) {
    console.error('Error clearing push token:', error);
  }
}

export async function registerAndSavePushToken(): Promise<void> {
  const token = await registerForPushNotifications();
  if (token) {
    await savePushToken(token);
  }
}

export async function sendPushNotification(
  recipientUserId: string,
  title: string,
  body: string
): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;

  const { error } = await supabase.functions.invoke('send-push-notification', {
    body: {
      recipient_user_id: recipientUserId,
      title,
      body,
    },
  });

  if (error) {
    console.error('Error sending push notification:', error);
  }
}

export function setupNotificationListeners(): () => void {
  // Handle notification taps (when user taps on a notification)
  const responseSubscription =
    Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;

      if (data?.screen === 'friend-requests' || data?.screen === 'notifications') {
        router.push('/notifications' as any);
      }
    });

  return () => {
    responseSubscription.remove();
  };
}
