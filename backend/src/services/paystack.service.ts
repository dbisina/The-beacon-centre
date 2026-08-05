// backend/src/services/paystack.service.ts
// Thin wrapper over Paystack's REST API. Deliberately fails loudly when
// PAYSTACK_SECRET_KEY isn't set rather than faking a success response - this
// codebase already has one bad precedent for silent fake-success fallbacks
// (AuthService.fallbackLogin's hardcoded dev credentials); giving should not
// repeat that mistake.
import axios from 'axios';
import crypto from 'crypto';

const PAYSTACK_BASE_URL = 'https://api.paystack.co';

const getSecretKey = (): string => {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) {
    throw new Error('Paystack is not configured (PAYSTACK_SECRET_KEY unset)');
  }
  return key;
};

export interface PaystackInitializeParams {
  email: string;
  amountKobo: number;
  reference: string;
  metadata?: Record<string, any>;
  callbackUrl?: string;
}

export interface PaystackInitializeResult {
  authorizationUrl: string;
  accessCode: string;
  reference: string;
}

export interface PaystackVerifyResult {
  status: 'success' | 'failed' | 'abandoned' | string;
  reference: string;
  amountKobo: number;
  currency: string;
  paidAt: string | null;
  channel: string | null;
  customerEmail: string;
  authorization?: {
    authorizationCode: string;
    cardType?: string;
    last4?: string;
    bank?: string;
    expMonth?: string;
    expYear?: string;
  };
  raw: any;
}

export class PaystackService {
  static async initializeTransaction(params: PaystackInitializeParams): Promise<PaystackInitializeResult> {
    const secretKey = getSecretKey();

    const response = await axios.post(
      `${PAYSTACK_BASE_URL}/transaction/initialize`,
      {
        email: params.email,
        amount: params.amountKobo,
        reference: params.reference,
        metadata: params.metadata,
        callback_url: params.callbackUrl,
      },
      { headers: { Authorization: `Bearer ${secretKey}` } }
    );

    const { authorization_url, access_code, reference } = response.data.data;
    return { authorizationUrl: authorization_url, accessCode: access_code, reference };
  }

  static async verifyTransaction(reference: string): Promise<PaystackVerifyResult> {
    const secretKey = getSecretKey();

    const response = await axios.get(
      `${PAYSTACK_BASE_URL}/transaction/verify/${encodeURIComponent(reference)}`,
      { headers: { Authorization: `Bearer ${secretKey}` } }
    );

    const data = response.data.data;
    return {
      status: data.status,
      reference: data.reference,
      amountKobo: data.amount,
      currency: data.currency,
      paidAt: data.paid_at,
      channel: data.channel,
      customerEmail: data.customer?.email,
      authorization: data.authorization
        ? {
            authorizationCode: data.authorization.authorization_code,
            cardType: data.authorization.card_type,
            last4: data.authorization.last4,
            bank: data.authorization.bank,
            expMonth: data.authorization.exp_month,
            expYear: data.authorization.exp_year,
          }
        : undefined,
      raw: data,
    };
  }

  // Verifies the `x-paystack-signature` header against the *raw* request
  // body bytes (HMAC-SHA512 with the secret key) - see server.ts's
  // express.json({ verify }) capture of req.rawBody for why raw bytes matter.
  static verifyWebhookSignature(rawBody: Buffer, signatureHeader: string | undefined): boolean {
    if (!signatureHeader) return false;
    const secretKey = getSecretKey();
    const hash = crypto.createHmac('sha512', secretKey).update(rawBody).digest('hex');
    return hash === signatureHeader;
  }
}
