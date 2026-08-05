import { apiGet, apiPost } from '@/config/api';

/**
 * Giving (donations): church bank accounts (default/manual path), projects
 * (fundraising campaigns), and Paystack-backed card giving (alternative
 * path). See backend/src/routes/giving.routes.ts + project.routes.ts and
 * their controllers/services for the exact contract.
 *
 * Money fields: the backend stores amounts in kobo as Postgres BigInt
 * columns. Express's JSON serializer stringifies BigInt (see
 * backend/src/server.ts's `BigInt.prototype.toJSON` shim), so
 * targetAmount/raisedAmount/amount all arrive here as numeric *strings* in
 * kobo, not numbers - convert/divide by 100 at render time if you need Naira.
 * `initializeGiving`'s `amount` param is the one exception: it's a plain
 * Naira number sent to POST /giving/initialize, which the backend itself
 * converts to kobo.
 */

/**
 * Never actually loaded — app/give/pay.tsx's WebView intercepts any
 * navigation starting with this prefix (Paystack appends
 * `?reference=...&trxref=...`) and calls verifyGiving() instead of letting
 * it load.
 */
export const GIVING_CALLBACK_URL = 'https://thebeaconcentre.app/giving/callback';

export type GivingPurpose = 'TITHE' | 'OFFERING' | 'SEED' | 'PROJECT';
export type GivingTransactionStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'ABANDONED';

export interface ChurchBankAccount {
  id: number;
  bankName: string;
  accountName: string;
  accountNumber: string;
  instructions: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectWithProgress {
  id: number;
  title: string;
  blurb: string | null;
  description: string | null;
  imageUrl: string | null;
  cloudinaryPublicId: string | null;
  /** Kobo, as a string - see the module-level note on BigInt serialization. */
  targetAmount: string;
  /** Kobo, as a string - see the module-level note on BigInt serialization. */
  raisedAmount: string;
  donorCount: number;
  deadline: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  /** Server-computed: min(round(raisedAmount / targetAmount * 100), 100). */
  progressPct: number;
}

export interface GivingTransaction {
  id: number;
  reference: string;
  appUserId: number | null;
  email: string;
  /** Kobo, as a string - see the module-level note on BigInt serialization. */
  amount: string;
  currency: string;
  purpose: GivingPurpose;
  projectId: number | null;
  anonymous: boolean;
  status: GivingTransactionStatus;
  channel: string | null;
  metadata: unknown;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
  /** Only present on /giving/history, which includes the related project. */
  project?: { title: string } | null;
}

/** GET /api/giving/bank-accounts (public). The default giving option - manual bank transfer. */
export async function fetchBankAccounts(): Promise<ChurchBankAccount[]> {
  return apiGet<ChurchBankAccount[]>('/giving/bank-accounts');
}

/** GET /api/projects (public). Fundraising campaigns, each with a computed progressPct. */
export async function fetchProjects(): Promise<ProjectWithProgress[]> {
  return apiGet<ProjectWithProgress[]>('/projects');
}

export interface InitializeGivingParams {
  /** Naira, not kobo - the backend converts to kobo internally. */
  amount: number;
  /**
   * Required for guests (the backend 400s without it). Signed-in users may
   * omit it - the backend defaults to their account email - but it never
   * hurts to pass it through if you have it.
   */
  email?: string;
  purpose: GivingPurpose;
  /** Required when purpose is 'PROJECT'. */
  projectId?: number;
  anonymous?: boolean;
  /**
   * Where Paystack redirects after checkout, with `?reference=...&trxref=...`
   * appended. app/give/pay.tsx watches for this exact prefix in the checkout
   * WebView's navigation to detect completion — it never actually loads, we
   * intercept and call verifyGiving() instead.
   */
  callbackUrl?: string;
}

export interface InitializeGivingResult {
  authorizationUrl: string;
  reference: string;
}

/**
 * POST /api/giving/initialize. Starts a Paystack (card) giving transaction
 * and returns the checkout URL to open in a webview.
 *
 * If Paystack isn't configured on the backend yet, this rejects with a 503
 * whose message is surfaced as-is (e.g. "Card giving is not configured yet,
 * please use bank transfer") - let it propagate to the UI rather than
 * swallowing it, so the user is pointed at bank transfer instead.
 */
export async function initializeGiving(
  params: InitializeGivingParams
): Promise<InitializeGivingResult> {
  return apiPost<InitializeGivingResult>('/giving/initialize', {
    callbackUrl: GIVING_CALLBACK_URL,
    ...params,
  });
}

/**
 * POST /api/giving/verify. Call this after the user returns from the
 * Paystack checkout webview redirect, passing the `reference` it gave back.
 * Returns the updated transaction record (status SUCCESS/FAILED).
 */
export async function verifyGiving(reference: string): Promise<GivingTransaction> {
  return apiPost<GivingTransaction>('/giving/verify', { reference });
}

/** GET /api/giving/history. Requires sign-in - successful transactions only, newest first. */
export async function fetchGivingHistory(): Promise<GivingTransaction[]> {
  return apiGet<GivingTransaction[]>('/giving/history');
}
