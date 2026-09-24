import axios, { AxiosError, AxiosRequestConfig } from 'axios';
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
const PRIMARY_API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? (__DEV__ ? 'http://localhost:5000/api' : PRODUCTION_API_URL);

/**
 * Optional second host, tried once when the primary is unreachable *at the
 * infrastructure level* (DNS/TLS failure, or a proxy 404/5xx that isn't our
 * own JSON envelope).
 *
 * This exists because of a concrete App Store rejection: the reviewed build
 * pointed at a Railway domain that had no live deployment behind it, so the
 * Railway edge answered every call with its own body
 * `{"status":"error","code":404,"message":"Application not found"}`. One dead
 * host took down sign-up, sign-in and every content screen at once, with no
 * way to repoint the app short of a new binary. Set
 * EXPO_PUBLIC_API_FALLBACK_URL in eas.json to a mirror and the app rides
 * through the next outage of either host.
 */
const FALLBACK_API_URL = process.env.EXPO_PUBLIC_API_FALLBACK_URL ?? null;

export const api = axios.create({
  baseURL: PRIMARY_API_URL,
  // iPads on hotel/venue wifi (and the App Review lab) are slower than a
  // developer's desk. 15s was tight enough to time out a cold backend.
  timeout: 25000,
});

/** Where we're currently pointed. Flips to the fallback after a failover. */
let activeBaseUrl = PRIMARY_API_URL;

/** Origin without the trailing `/api` — used for links to backend web pages. */
export function getApiOrigin(): string {
  return activeBaseUrl.replace(/\/api\/?$/, '');
}

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

/** Copy shown when the problem is ours/the network's, never the raw upstream text. */
const NETWORK_MESSAGE =
  "We couldn't reach The Beacon Centre. Check your internet connection and try again.";
const SERVER_MESSAGE =
  'The Beacon Centre is having a problem at our end. Please try again in a moment.';

/**
 * Is this body actually one of *our* responses? A proxy, CDN or load balancer
 * standing in front of the backend will happily return JSON with a `message`
 * field of its own; trusting it verbatim is how "Application not found" —
 * Railway's words, about its own routing table — ended up on a sign-up form as
 * if the user had done something wrong.
 */
function isEnvelope(body: unknown): body is ApiEnvelope<unknown> {
  return !!body && typeof body === 'object' && typeof (body as any).success === 'boolean';
}

/** Extracts a clean, human-readable message from a failed request. */
function extractErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const axiosErr = err as AxiosError<unknown>;
    const response = axiosErr.response;

    // No response at all: DNS, TLS, airplane mode, timeout.
    if (!response) return NETWORK_MESSAGE;

    const body = response.data;
    if (isEnvelope(body)) {
      return body.error ?? body.message ?? SERVER_MESSAGE;
    }

    // A response that isn't ours means we never reached the app — an edge
    // proxy, a captive portal, an HTML error page. Say so in our own words.
    if (response.status === 401 || response.status === 403) {
      return 'Your session has expired. Please sign in again.';
    }
    return SERVER_MESSAGE;
  }
  if (err instanceof Error && err.message) return err.message;
  return NETWORK_MESSAGE;
}

/**
 * Did we fail *before* our API got a say? Transport failures and edge-proxy
 * pages only — never a real 4xx from our own backend, which is a decision it
 * has already made and won't reverse on a retry.
 */
function isInfrastructureFailure(err: unknown): boolean {
  if (!axios.isAxiosError(err)) return false;
  const response = (err as AxiosError<unknown>).response;
  if (!response) return true; // network error / timeout
  if (isEnvelope(response.data)) return false; // our API answered, and it meant it
  // Anything else at this point is a proxy/edge page: 404 from a routing
  // table, 502/503/504 from a cold or missing deployment, Cloudflare 52x.
  return response.status === 404 || response.status >= 500;
}

const IDEMPOTENT = new Set(['get', 'head', 'options', 'put', 'delete']);

/**
 * Retrying a POST is only safe when we know the backend never saw it. A 404
 * from a routing table and a dead socket both mean that; a 502 or 504 does
 * not — the request may have been handled and the response lost — so a
 * write is left alone there rather than risk running twice.
 */
function isSafeToReplay(err: unknown, method: string): boolean {
  if (!isInfrastructureFailure(err)) return false;
  if (IDEMPOTENT.has(method.toLowerCase())) return true;
  const response = (err as AxiosError<unknown>).response;
  return !response || response.status === 404;
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Single funnel for every call: one retry against the current host, then one
 * attempt against the fallback host if there is one. A fallback that works
 * sticks, so the rest of the session doesn't pay the failed-primary cost on
 * every screen.
 */
async function request<T>(config: AxiosRequestConfig): Promise<T> {
  const method = config.method ?? 'get';
  let lastError: unknown;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await api.request<ApiEnvelope<T>>(config);
      return unwrap(response.data);
    } catch (err) {
      lastError = err;
      if (!isSafeToReplay(err, method)) break;
      if (attempt === 0) await delay(700);
    }
  }

  if (FALLBACK_API_URL && activeBaseUrl !== FALLBACK_API_URL && isSafeToReplay(lastError, method)) {
    try {
      const response = await api.request<ApiEnvelope<T>>({ ...config, baseURL: FALLBACK_API_URL });
      activeBaseUrl = FALLBACK_API_URL;
      api.defaults.baseURL = FALLBACK_API_URL;
      return unwrap(response.data);
    } catch (err) {
      lastError = err;
    }
  }

  throw new Error(extractErrorMessage(lastError));
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
  if (!isEnvelope(envelope)) {
    // A 2xx that isn't our envelope is still not our API talking.
    throw new Error(SERVER_MESSAGE);
  }
  if (!envelope.success) {
    throw new Error(envelope.error ?? envelope.message ?? 'Request failed');
  }
  return envelope.data as T;
}

export async function apiGet<T>(path: string, params?: Record<string, any>): Promise<T> {
  return request<T>({ method: 'get', url: `${path}${buildQueryString(params)}` });
}

export async function apiPost<T>(path: string, body?: any): Promise<T> {
  return request<T>({ method: 'post', url: path, data: body });
}

export async function apiPut<T>(path: string, body?: any): Promise<T> {
  return request<T>({ method: 'put', url: path, data: body });
}

export async function apiPatch<T>(path: string, body?: any): Promise<T> {
  return request<T>({ method: 'patch', url: path, data: body });
}

export async function apiDelete<T>(path: string, params?: Record<string, any>): Promise<T> {
  return request<T>({ method: 'delete', url: `${path}${buildQueryString(params)}` });
}
