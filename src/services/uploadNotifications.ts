/**
 * "Upload finished" notification.
 *
 * The upload completes in about two seconds on the same screen, so this is a
 * local notification — no push token, no server. It is posted on a
 * HIGH-importance channel so Android drops the banner down over the app, and
 * tapping it returns to Home.
 *
 * Everything here is best-effort: notifications are a bonus on top of the
 * success sheet, never a reason for an upload to fail.
 */
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const CHANNEL_ID = 'uploads';
const NATIVE = Platform.OS !== 'web';

let handlerReady = false;

/**
 * Lets the banner show while the app is open — which is when uploads finish.
 * Without a foreground handler, Android/iOS treat a notification that arrives
 * while the app is in front as "nothing to show". The once-only flag keeps the
 * handler from being installed again on every upload.
 */
function installForegroundHandler() {
  if (!NATIVE || handlerReady) return;
  handlerReady = true;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      // Android only drops the heads-up banner when sound is allowed.
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

/**
 * Creates the channel and asks for permission. Called from the Upload button
 * so the system prompt lands on a deliberate action; a refusal still lets the
 * upload continue.
 */
export async function prepareUploadNotifications(): Promise<void> {
  if (!NATIVE) return;
  installForegroundHandler();

  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
        name: 'Uploads',
        description: 'Exam paper upload results',
        importance: Notifications.AndroidImportance.HIGH,
        enableVibrate: true,
        vibrationPattern: [0, 160, 100, 160],
        lightColor: '#E3E2C3',
        sound: 'default',
        showBadge: false,
      });
    }

    const permission = await Notifications.getPermissionsAsync();
    if (permission.granted || !permission.canAskAgain) return;

    await Notifications.requestPermissionsAsync({
      ios: { allowAlert: true, allowSound: true, allowBadge: false },
    });
  } catch {
    // Ignored on purpose — see the file header.
  }
}

/** Posts "‹paper› uploaded successfully." with the app mark as its icon. */
export async function notifyUploadComplete(title: string): Promise<void> {
  if (!NATIVE) return;
  installForegroundHandler();

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Upload complete',
        body: `${title} uploaded successfully.`,
        // Read again by the tap listener below to ignore unrelated banners.
        data: { screen: 'home' },
        color: '#E3E2C3',
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      // `{ channelId }` with no time/date means "deliver now, on this channel".
      // Android needs the channel here; iOS ignores it.
      trigger: { channelId: CHANNEL_ID },
    });
  } catch {
    // Ignored on purpose — see the file header.
  }
}

/**
 * Calls `onTap` when the upload notification is tapped; returns an unsubscribe
 * function. Other notifications are ignored via the `screen` data key.
 */
export function addUploadNotificationTapListener(onTap: () => void): () => void {
  if (!NATIVE) return () => {};

  const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
    if (response.notification.request.content.data?.screen === 'home') onTap();
  });

  return () => subscription.remove();
}

/** Clears the banner once the user has acknowledged the upload in the app. */
export function dismissUploadNotifications(): void {
  if (!NATIVE) return;
  void Notifications.dismissAllNotificationsAsync().catch(() => {});
}
