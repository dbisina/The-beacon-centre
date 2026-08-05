import { apiPost } from '@/config/api';

/**
 * Prayer requests and contact messages.
 *
 * Both endpoints are guest-friendly (backend's optionalAuthenticateUser
 * middleware) - config/api.ts's request interceptor attaches a Firebase ID
 * token when signed in and sends nothing for guests, so no auth handling is
 * needed here. See backend/src/routes/prayerRequest.routes.ts and
 * /contact.routes.ts, and their controllers/services for the exact contract.
 */

export type ContactCategory = 'GENERAL' | 'CSG' | 'PRAYER' | 'TECHNICAL' | 'OTHER';
export type PrayerRequestStatus = 'NEW' | 'IN_PROGRESS' | 'HANDLED';
export type ContactMessageStatus = 'NEW' | 'HANDLED';

export interface PrayerRequest {
  id: number;
  appUserId: number | null;
  name: string | null;
  body: string;
  isPrivate: boolean;
  status: PrayerRequestStatus;
  handledByAdminId: number | null;
  handledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ContactMessage {
  id: number;
  appUserId: number | null;
  name: string;
  email: string;
  phone: string | null;
  category: ContactCategory;
  csgId: number | null;
  message: string;
  status: ContactMessageStatus;
  handledByAdminId: number | null;
  handledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SubmitPrayerRequestParams {
  /** Optional - the backend stores null when omitted. */
  name?: string;
  body: string;
  /** Defaults to true server-side when omitted. */
  isPrivate?: boolean;
}

/** POST /api/prayer-requests. Works for guests - no sign-in required. */
export async function submitPrayerRequest(
  params: SubmitPrayerRequestParams
): Promise<PrayerRequest> {
  return apiPost<PrayerRequest>('/prayer-requests', params);
}

export interface SubmitContactParams {
  name: string;
  email: string;
  phone?: string;
  /** Defaults to 'GENERAL' server-side when omitted. */
  category?: ContactCategory;
  /** Required by the backend when category is 'CSG' (400s otherwise) - not enforced here. */
  csgId?: number;
  message: string;
}

/** POST /api/contact. Works for guests - no sign-in required. */
export async function submitContact(params: SubmitContactParams): Promise<ContactMessage> {
  return apiPost<ContactMessage>('/contact', params);
}
