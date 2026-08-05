import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

/**
 * Same Firebase project as the existing app (thebeaconcentre-40f9a) so this
 * client reads the content the admin panel already publishes.
 *
 * The keys live in app.json -> expo.extra via EXPO_PUBLIC_* env vars. Falling
 * back to the literals keeps parity with the current config/firebaseConfig.js
 * while you move them into EAS secrets.
 */
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? 'AIzaSyAJ-vsKxk1UxvWkhZzhEc1fA1-fj0Mskhc',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? 'thebeaconcentre-40f9a.firebaseapp.com',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? 'thebeaconcentre-40f9a',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? 'thebeaconcentre-40f9a.appspot.com',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_SENDER_ID ?? '646351775954',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? '1:646351775954:web:a12a10385834393552650b',
  measurementId: 'G-QTJE0VCJ3G',
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Firebase Auth is intentionally not initialized here - auth is descoped for
// now (guest mode only, see services/auth.tsx). The real init code is
// archived at ../_archived/auth.firebase.tsx.

/** Firestore collection names, exactly as the admin panel writes them. */
export const C = {
  devotionals: 'devotionals',
  dailyQuote: 'dailyQuote',
  announcement: 'announcement',
  audioSermon: 'audioSermon',
  sermon: 'sermon',
  excerpt: 'excerpt',
  // NOTE the repo is inconsistent here: the reader queries 'inspirationals'
  // while the admin uploader writes 'inspirational'. We read the singular
  // (where the data actually is) and expose the alias so you can migrate.
  inspirational: 'inspirational',
  inspirationalLegacy: 'inspirationals',
  goaks: 'goaks',
  article: 'article',
  users: 'Users',
} as const;
