# The Beacon Centre — mobile app

Expo (SDK 51) + expo-router rebuild of the church app, on the design in
`../Beacon Centre App.dc.html`. Reads the **same Firebase project** the current
app and admin panel already use, so content published from the admin shows up
here with no migration.

## Run it

```bash
cd expo-app
npm install
npx expo start          # then press i / a, or scan with Expo Go
```

Optional — move the keys out of source (they currently fall back to the same
literals the old `config/firebaseConfig.js` had):

```bash
# .env
EXPO_PUBLIC_FIREBASE_API_KEY=…
EXPO_PUBLIC_FIREBASE_PROJECT_ID=thebeaconcentre-40f9a
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=thebeaconcentre-40f9a.appspot.com
EXPO_PUBLIC_FIREBASE_SENDER_ID=…
EXPO_PUBLIC_FIREBASE_APP_ID=…
EXPO_PUBLIC_YOUTUBE_API_KEY=…
EXPO_PUBLIC_YOUTUBE_CHANNEL_ID=UCkQOKzc2rrzMqfLhC6M93gA
```

## Fitting every phone

There is no per-device branching anywhere in this app. Three mechanisms cover
the whole Android + iOS range:

**1. `theme/index.ts` — the scale layer.** Everything sizes through `s()`
(space), `ms()` (proportional) and `fs()` (type), against a 390×844 baseline
and **clamped to 0.86–1.3**. A Galaxy A14 at 360dp gets 0.92×; a Pixel 9 Pro XL
gets 1.11×; nothing is ever cramped or cartoonish. `useResponsive()` subscribes
to `useWindowDimensions`, so a **Z Fold unfolding, a tablet rotating, or Android
split-screen re-renders with fresh numbers** instead of stale module values.

**2. Real safe-area insets.** `SafeAreaProvider` + `useSafeAreaInsets()` in the
`Screen` shell and the tab bar. That one path covers the iPhone notch and
Dynamic Island, Samsung/Pixel punch-holes, Android 3-button nav, the gesture
bar, and Huawei's status bar — none of it hard-coded.

**3. A centred content column.** Above 520dp the layout stops stretching and
centres, so tablets, unfolded foldables and landscape don't produce
2000px-wide text lines.

Also handled: every touch target is ≥44pt (iOS HIG) / 48dp (Material) via
`HIT`; `allowFontScaling={false}` with our own capped OS-font-scale multiplier
in `fs()`, so a user at 200% system text doesn't break fixed-height rows;
`edgeToEdgeEnabled` for Android 15; `softwareKeyboardLayoutMode: "pan"` so
Android keyboards don't squash the sign-up form.

## Structure

```
app/
  _layout.tsx            fonts, splash, providers, stack
  index.tsx              first-launch gate → onboarding or tabs
  (tabs)/                Home · Watch · Listen · Give · News + floating pill bar
  player/                shorts (WebView) · message (WebView + chapters) · audio
  onboarding/            welcome + 3 cards · signup · setup
  live.tsx  csg.tsx  devotional.tsx  settings.tsx
  give/pay.tsx  give/receipt.tsx
components/ui.tsx        Screen, Text, Card, Btn, Chip, Progress, MediaTile…
theme/index.ts           scale layer, colour, type, radius, shadow
services/
  api.ts                 Firestore + Storage reads
  youtube.ts             live check, uploads, shorts/full split, durations
  auth.tsx               Firebase auth + real guest mode
  player.tsx             expo-av audio, resume position, queue
config/firebase.ts       app / db / storage / auth + collection names
data/content.ts          placeholder content — every screen falls back to it
```

## Colour rule

Ink + white + warm paper carry every screen. **Teal `#41BBAC` is the only
accent** — it marks the one thing to touch and progress fills; teal *type* on
light uses `#1C6462` for contrast. **Magenta appears exactly twice**: the verse
card on Home and the verse block in the reader. **Red only** for the live dot
and the SHORT badge. Don't add a fourth colour.

## Two upstream bugs fixed here

- **Live was never live.** `app/(tabs)/live.tsx` builds a `search?eventType=live`
  URL, never calls it, then shows the first item of the *uploads playlist* and
  labels it live. `services/youtube.ts → checkLive()` does the real check; when
  the church isn't streaming, the Live screen shows the schedule.
- **First play did nothing.** `app/context/audio.tsx` read the stale
  `currentSong` state inside `playSong` instead of the incoming `song`, and its
  cleanup effect unloaded the sound on every change, racing the new one.
  `services/player.tsx` holds the sound in a ref and unloads before creating.

## What is not built

See **`../unmade.md`** — every endpoint the design assumes and the backend
doesn't have yet, grouped by feature. The big ones: all of giving/Paystack,
Community Groups, push notifications, and server-side saves/notes/progress.
Everything has a local fallback, so the app runs today; none of it syncs.
