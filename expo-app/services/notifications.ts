import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { apiPost, apiDelete } from '@/config/api';

/**
 * Push token registration against the real backend (see
 * backend/src/routes/device.routes.ts -> DeviceController).
 *
 * POST /devices and DELETE /devices/:token both run through
 * optionalAuthenticateUser on the server, so this works identically for
 * guests and signed-in members - never gate it behind sign-in.
 */

interface RegisterDeviceResponse {
  id: number;
  token: string;
  platform: string | null;
  csgId: number | null;
  topics: string[];
  [key: string]: unknown;
}

/** Reads the EAS project id from app.json (expo.extra.eas.projectId). */
function getEasProjectId(): string | undefined {
  return (
    Constants.expoConfig?.extra?.eas?.projectId ??
    // Fallback for the bare/manifest2 shape some builds expose.
    (Constants as any)?.easConfig?.projectId
  );
}

/**
 * Requests notification permissions (if not already granted) and registers
 * the resulting Expo push token with the backend. No-ops safely on
 * simulators/emulators and whenever permission is denied - this must never
 * throw or crash the app, push notifications are a nice-to-have.
 *
 * Returns the Expo push token on success, or null if registration didn't
 * happen (simulator, denied permission, missing project id, network error).
 */
export async function registerForPushNotifications(): Promise<string | null> {
  try {
    if (!Device.isDevice) {
      // Simulators/emulators cannot receive push notifications.
      return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return null;
    }

    const projectId = getEasProjectId();
    if (!projectId) {
      // No EAS project id configured yet (app.json -> expo.extra.eas.projectId).
      // getExpoPushTokenAsync would throw without it, so bail out quietly.
      return null;
    }

    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    await apiPost<RegisterDeviceResponse>('/devices', {
      token,
      platform: Platform.OS,
      topics: [],
    });

    return token;
  } catch {
    // Never let push registration crash the app.
    return null;
  }
}

/** Deregisters a push token from the backend (e.g. on sign-out). */
export async function unregisterPushToken(token: string): Promise<void> {
  try {
    await apiDelete<{ id: number }>(`/devices/${encodeURIComponent(token)}`);
  } catch {
    // Best-effort - a stale token left on the server is harmless.
  }
}
