import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { apiPost, apiDelete } from '@/config/api';

/**
 * Push notifications, end to end.
 *
 * The token is registered with the backend (POST /devices, see
 * backend/src/routes/device.routes.ts) together with the topics the member
 * switched on. Two things used to be missing, and together they meant almost
 * nothing arrived:
 *  - topics were always sent as [], so the Verse / Live / Sermons toggles in
 *    Settings changed nothing a server could see;
 *  - the token was only registered at launch, before sign-in, so it was never
 *    linked to the member's account - and group updates, approvals and
 *    anything else aimed at a person reach people through that link.
 * Now the token is re-registered whenever those inputs change: at launch, on
 * sign-in, on sign-out, and on every toggle.
 */

/** The only topics that exist. Mirrors backend/src/config/pushTopics.ts. */
export type PushTopic = 'verse' | 'live' | 'sermons';
export type NotifPrefs = Record<PushTopic, boolean>;
export const DEFAULT_NOTIF_PREFS: NotifPrefs = { verse: true, live: true, sermons: false };

/** Where the member's toggles are stored (also services/auth.tsx guestKeys.notifications). */
export const NOTIF_PREFS_KEY = 'guest:notifications';
const TOKEN_KEY = 'push:token';

/**
 * Foreground display. Without a handler, a push that arrives while the app is
 * open is dropped silently - including "you've been approved" while someone is
 * sitting on the group page waiting for it.
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function getEasProjectId(): string | undefined {
  return (
    Constants.expoConfig?.extra?.eas?.projectId ??
    // Fallback for the bare/manifest2 shape some builds expose.
    (Constants as { easConfig?: { projectId?: string } })?.easConfig?.projectId
  );
}

async function readPrefs(): Promise<NotifPrefs> {
  try {
    const raw = await AsyncStorage.getItem(NOTIF_PREFS_KEY);
    return raw ? { ...DEFAULT_NOTIF_PREFS, ...(JSON.parse(raw) as Partial<NotifPrefs>) } : DEFAULT_NOTIF_PREFS;
  } catch {
    return DEFAULT_NOTIF_PREFS;
  }
}

const topicsFrom = (prefs: NotifPrefs): PushTopic[] =>
  (Object.keys(prefs) as PushTopic[]).filter((t) => prefs[t]);

/**
 * Registers (or refreshes) this device's token with the member's current
 * topics - linked to their account when they're signed in, because the API
 * client attaches their token. Asks for permission only when `askPermission`
 * is set, so a background refresh never pops a system prompt.
 *
 * Never throws: push is a nice-to-have and must not break sign-in or Settings.
 */
export async function syncPushRegistration(
  { askPermission = false, prefs }: { askPermission?: boolean; prefs?: NotifPrefs } = {},
): Promise<string | null> {
  try {
    if (!Device.isDevice) return null; // simulators can't receive pushes

    let { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted' && askPermission) {
      ({ status } = await Notifications.requestPermissionsAsync());
    }
    if (status !== 'granted') return null;

    const projectId = getEasProjectId();
    if (!projectId) return null;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Notifications',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    await apiPost('/devices', {
      token,
      platform: Platform.OS,
      topics: topicsFrom(prefs ?? (await readPrefs())),
    });
    await AsyncStorage.setItem(TOKEN_KEY, token);
    return token;
  } catch {
    return null;
  }
}

/** Launch-time registration; the one place the permission prompt may appear. */
export const registerForPushNotifications = () => syncPushRegistration({ askPermission: true });

/**
 * Unlinks this device from the account on sign-out, by deleting its token row
 * so the next (guest) registration starts clean. Re-registering alone is not
 * enough: the server deliberately never clears an account link on a guest
 * registration, so a shared phone would otherwise keep receiving the previous
 * member's group updates and approvals.
 */
export async function unlinkPushFromAccount(): Promise<void> {
  try {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    if (token) await apiDelete(`/devices/${encodeURIComponent(token)}`);
  } catch {
    // Best effort - a stale link only means an extra notification.
  }
}

/**
 * The expo-router path a notification should open, if it carries one. Only
 * in-app paths are honoured, so a push can never send someone to a web page.
 */
export function deepLinkFrom(response: Notifications.NotificationResponse | null): string | null {
  const url = response?.notification.request.content.data?.url;
  return typeof url === 'string' && url.startsWith('/') && !url.startsWith('//') ? url : null;
}
