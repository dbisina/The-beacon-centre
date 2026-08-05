import React, { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiPost, apiDelete, AUTH_TOKEN_KEY } from '@/config/api';

/**
 * The app's own lightweight auth: name + email + a 4-6 digit passcode (not a
 * password) - see backend/src/services/appUserAuth.service.ts. The token is
 * a long-lived JWT with no refresh flow, so a signed-in session persists
 * until the user taps "Sign out" themselves, not on any timer.
 *
 * The archived Firebase implementation at ../_archived/auth.firebase.tsx is
 * a different, heavier path (password reset, guest-data merge flow) that
 * isn't used here - this is the real, active implementation.
 */

type Mode = 'loading' | 'guest' | 'member';

type StubUser = { email?: string | null; displayName?: string | null } | null;

type Ctx = {
  mode: Mode;
  user: StubUser;
  isMember: boolean;
  signUp: (name: string, email: string, passcode: string) => Promise<void>;
  signIn: (email: string, passcode: string) => Promise<void>;
  logOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  continueAsGuest: () => Promise<void>;
  hasOnboarded: boolean;
};

const AuthCtx = createContext<Ctx | undefined>(undefined);
const ONBOARDED = 'guest:onboarded';
const USER_KEY = 'tbc_auth_user';

type AuthApiResponse = { user: { id: number; email: string | null; name: string | null }; token: string };

export function AuthProvider({ children }: { children: ReactNode }) {
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const [mode, setMode] = useState<Mode>('loading');
  const [user, setUser] = useState<StubUser>(null);

  useEffect(() => {
    (async () => {
      const [onboarded, token, storedUser] = await Promise.all([
        AsyncStorage.getItem(ONBOARDED),
        AsyncStorage.getItem(AUTH_TOKEN_KEY),
        AsyncStorage.getItem(USER_KEY),
      ]);
      setHasOnboarded(onboarded === '1');
      if (token && storedUser) {
        const parsed = JSON.parse(storedUser);
        setUser({ email: parsed.email, displayName: parsed.name });
        setMode('member');
      } else {
        setMode('guest');
      }
    })();
  }, []);

  const persistSession = async (res: AuthApiResponse) => {
    await AsyncStorage.multiSet([
      [AUTH_TOKEN_KEY, res.token],
      [USER_KEY, JSON.stringify(res.user)],
      [ONBOARDED, '1'],
    ]);
    setUser({ email: res.user.email, displayName: res.user.name });
    setHasOnboarded(true);
    setMode('member');
  };

  const value = useMemo<Ctx>(
    () => ({
      mode,
      user,
      isMember: mode === 'member',
      hasOnboarded,
      async signUp(name: string, email: string, passcode: string) {
        const res = await apiPost<AuthApiResponse>('/auth/signup', { name, email, passcode });
        await persistSession(res);
      },
      async signIn(email: string, passcode: string) {
        const res = await apiPost<AuthApiResponse>('/auth/login', { email, passcode });
        await persistSession(res);
      },
      async logOut() {
        await AsyncStorage.multiRemove([AUTH_TOKEN_KEY, USER_KEY]);
        setUser(null);
        setMode('guest');
      },
      async deleteAccount() {
        await apiDelete('/auth/me');
        await AsyncStorage.multiRemove([AUTH_TOKEN_KEY, USER_KEY]);
        setUser(null);
        setMode('guest');
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
