import { Platform, Linking, Alert } from 'react-native';
import { getApiOrigin } from './api';

/**
 * Where giving happens, and where it is *not allowed* to happen.
 *
 * App Store Review Guideline 3.2.2(iv): an app may not collect charitable
 * donations inside the app unless the organisation is a Benevity- or
 * Candid-approved nonprofit. The Beacon Centre is not (yet) on either list, so
 * on iOS every giving path leaves the app for the web — which the same
 * guideline explicitly permits: "providing a link to your website that
 * launches the default browser or SFSafariViewController for users to make a
 * donation."
 *
 * Android has no such rule. Google Play's payments policy carves out
 * donations, so the in-app flow (bank transfer details, and Paystack card
 * giving when it goes live) stays exactly as it was there. Everything is
 * behind this one flag so the two platforms never drift apart by accident,
 * and so the in-app flow can be switched back on for iOS in one line the day
 * the church is Benevity-approved.
 */
export const IN_APP_GIVING_ALLOWED = Platform.OS !== 'ios';

/**
 * The web giving page. Defaults to the backend's own `/give` page (see
 * backend/src/routes/givingWeb.routes.ts), which renders the same church bank
 * accounts the app used to show in-app, so the link is guaranteed to resolve
 * to something real and stays in step with what an admin edits in the
 * dashboard. Point EXPO_PUBLIC_GIVING_URL at the church's own website
 * instead once it has a giving page.
 */
export const GIVING_WEB_URL = process.env.EXPO_PUBLIC_GIVING_URL ?? `${getApiOrigin()}/give`;

/**
 * Opens giving in the device browser. Deliberately `Linking.openURL` and not
 * a WebView: the guideline is satisfied by leaving the app, and a WebView
 * would be the very thing it prohibits.
 */
export async function openWebGiving(): Promise<void> {
  try {
    await Linking.openURL(GIVING_WEB_URL);
  } catch {
    Alert.alert(
      'Could not open your browser',
      `Please visit ${GIVING_WEB_URL} to give.`
    );
  }
}
