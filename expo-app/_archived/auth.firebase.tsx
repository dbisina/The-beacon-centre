import React, { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  sendPasswordResetEmail,
  User,
} from 'firebase/auth';
import { auth } from '@/config/firebase';
// NOTE: services/userData.ts exports mergeGuestDataToBackend(), the backend
// call mergeGuestData() below is meant to make once guest saves/notes carry
// a contentType — see its doc comment. Not imported here yet since nothing
// currently produces data in that shape.

/**
 * Auth with a real guest mode.
 *
 * The design's rule is that nothing is gated. So the app never waits on auth
 * and never redirects an unauthenticated user: `mode` is 'guest' until Firebase
 * says otherwise, and every guest action writes to AsyncStorage under
 * `guest:*`. On sign-in we hand those local records to the server (see
 * mergeGuestData) so a member who finally signs up keeps their saves.
 */

type Mode = 'loading' | 'guest' | 'member';

type Ctx = {
  mode: Mode;
  user: User | null;
  isMember: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  logOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  changePassword: (next: string) => Promise<void>;
  /** Explicitly stay a guest — remembered so onboarding doesn't reappear. */
  continueAsGuest: () => Promise<void>;
  hasOnboarded: boolean;
};

const AuthCtx = createContext<Ctx | undefined>(undefined);
const ONBOARDED = 'guest:onboarded';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<Mode>('loading');
  const [user, setUser] = useState<User | null>(null);
  const [hasOnboarded, setHasOnboarded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDED).then((v) => setHasOnboarded(v === '1'));
    // Never blocks the UI: we flip to 'guest' the moment Firebase reports null.
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setMode(u ? 'member' : 'guest');
    });
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      mode,
      user,
      isMember: mode === 'member',
      hasOnboarded,
      async signUp(email, password) {
        const { user: u } = await createUserWithEmailAndPassword(auth, email, password);
        // upsertUser() is gone - the backend auto-provisions an AppUser row
        // server-side the first time this user's ID token hits any endpoint.
        await mergeGuestData(u.uid);
      },
      async signIn(email, password) {
        const { user: u } = await signInWithEmailAndPassword(auth, email, password);
        await mergeGuestData(u.uid);
      },
      logOut: () => signOut(auth),
      resetPassword: (email) => sendPasswordResetEmail(auth, email),
      async changePassword(next) {
        if (!auth.currentUser) throw new Error('Not signed in');
        await updatePassword(auth.currentUser, next);
      },
      async continueAsGuest() {
        await AsyncStorage.setItem(ONBOARDED, '1');
        setHasOnboarded(true);
      },
    }),
    [mode, user, hasOnboarded]
  );

  return React.createElement(AuthCtx.Provider, { value }, children);
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

/* ------------------------------------------------------- guest local store --- */

export const guestKeys = {
  saves: 'guest:saves',
  notes: 'guest:notes',
  progress: 'guest:progress',
  csg: 'guest:csg',
  notifications: 'guest:notifications',
} as const;

export async function readGuest<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export async function writeGuest(key: string, value: unknown) {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

/**
 * Called right after sign-in/up. Reads everything the guest accumulated and
 * pushes it to the backend (POST /api/users/me/merge-guest-data, see
 * services/userData.ts) under the now-signed-in Firebase user (the request
 * is authenticated by the ID token config/api.ts attaches automatically —
 * the uid itself isn't sent, the backend resolves "me" from the token).
 *
 * guestKeys.saves is a bare string[] and guestKeys.notes a bare
 * Record<string, string> — neither encodes which of the backend's
 * ContentType values ('DEVOTIONAL' | 'VIDEO_SERMON' | 'AUDIO_SERMON' |
 * 'ANNOUNCEMENT') an id/key belongs to, and as of this writing nothing under
 * app/ actually calls writeGuest(guestKeys.saves, ...) or
 * writeGuest(guestKeys.notes, ...) yet (the bookmark/notes buttons in
 * app/devotional.tsx and app/player/message.tsx are still unwired UI), so
 * there is no real guest data or call-site convention to inspect for a
 * mapping. Guessing a single contentType here would risk silently filing
 * someone's saves/notes under the wrong content type on the backend, so we
 * skip the merge (and deliberately do NOT clear the guest keys) until a
 * guest-mode save/note feature actually exists and can tag its entries with
 * a contentType at write time. That future write path should switch to
 * writeGuest(guestKeys.saves, [{ contentType, contentId }, ...]) and
 * writeGuest(guestKeys.notes, [{ contentType, contentId, body }, ...]) so
 * this function can pass them straight through to mergeGuestDataToBackend(),
 * e.g.:
 *
 *   const result = await mergeGuestDataToBackend({ saves, notes });
 *   await AsyncStorage.multiRemove([guestKeys.saves, guestKeys.notes]);
 *   return result;
 */
export async function mergeGuestData(_uid: string) {
  const saves = await readGuest<string[]>(guestKeys.saves, []);
  const notes = await readGuest<Record<string, string>>(guestKeys.notes, {});
  if (!saves.length && !Object.keys(notes).length) return;

  console.warn(
    'mergeGuestData: guest saves/notes have no contentType encoded yet - skipping backend merge',
    { saveCount: saves.length, noteCount: Object.keys(notes).length }
  );
}
