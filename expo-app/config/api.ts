import axios, { AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Base URL for the real backend (Express + Prisma + PostgreSQL), used for
 * all content/feature data.
 *
 * NOTE: "localhost" only resolves on the machine running this bundler. When
 * testing on a physical device or emulator, set EXPO_PUBLIC_API_URL (in your
 * .env / eas secrets) to your machine's LAN IP (e.g. http://192.168.1.23:5000/api)
 * or your deployed backend URL instead.
 */
const PRODUCTION_API_URL = 'https://the-beacon-centre-production.up.railway.app/api';

/**
 * EXPO_PUBLIC_* vars are inlined at bundle time, so a release build with the var
 * unset bakes whatever this fallback is and there is no way to change it short of
 * shipping a new binary. That is exactly how a store build ended up pointing at
 * localhost. Only fall back to localhost in dev; a release build with no env set
 * defaults to production rather than to a URL that can never resolve on a phone.
 */
const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? (__DEV__ ? 'http://localhost:5000/api' : PRODUCTION_API_URL);

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

/**
 * Auth token storage key - see services/auth.tsx, which is what actually
 * writes this on sign-in/sign-up and clears it on logout. Read fresh from
 * storage on every request rather than cached in memory, so a logout in one
 * part of the app can't leave a stale token attached to an in-flight call.
 */
export const AUTH_TOKEN_KEY = 'tbc_auth_token';

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Standard backend envelope (see backend/src/utils/responses.ts):
 *   { success: boolean, message?: string, data?: T, error?: string, errors?: any }
 */
interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  errors?: any;
}

/** Extracts a clean, human-readable message from a failed request. */
function extractErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const axiosErr = err as AxiosError<ApiEnvelope<unknown>>;
    const payload = axiosErr.response?.data;
    if (payload?.error) return payload.error;
    if (payload?.message) return payload.message;
    if (axiosErr.message) return axiosErr.message;
  }
  if (err instanceof Error) return err.message;
  return 'Network request failed';
}

function buildQueryString(params?: Record<string, any>): string {
  if (!params) return '';
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    searchParams.append(key, String(value));
  });
  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

/** Unwraps `response.data.data` on success; throws a clean Error otherwise. */
function unwrap<T>(envelope: ApiEnvelope<T>): T {
  if (!envelope.success) {
    throw new Error(envelope.error ?? envelope.message ?? 'Request failed');
  }
  return envelope.data as T;
}

export async function apiGet<T>(path: string, params?: Record<string, any>): Promise<T> {
  try {
    const response = await api.get<ApiEnvelope<T>>(`${path}${buildQueryString(params)}`);
    return unwrap(response.data);
  } catch (err) {
    throw new Error(extractErrorMessage(err));
  }
}

export async function apiPost<T>(path: string, body?: any): Promise<T> {
  try {
    const response = await api.post<ApiEnvelope<T>>(path, body);
    return unwrap(response.data);
  } catch (err) {
    throw new Error(extractErrorMessage(err));
  }
}

export async function apiPut<T>(path: string, body?: any): Promise<T> {
  try {
    const response = await api.put<ApiEnvelope<T>>(path, body);
    return unwrap(response.data);
  } catch (err) {
    throw new Error(extractErrorMessage(err));
  }
}

export async function apiPatch<T>(path: string, body?: any): Promise<T> {
  try {
    const response = await api.patch<ApiEnvelope<T>>(path, body);
    return unwrap(response.data);
  } catch (err) {
    throw new Error(extractErrorMessage(err));
  }
}

export async function apiDelete<T>(path: string, params?: Record<string, any>): Promise<T> {
  try {
    const response = await api.delete<ApiEnvelope<T>>(`${path}${buildQueryString(params)}`);
    return unwrap(response.data);
  } catch (err) {
    throw new Error(extractErrorMessage(err));
  }
}
