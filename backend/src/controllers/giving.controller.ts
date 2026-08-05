// backend/src/controllers/giving.controller.ts
import { Request, Response } from 'express';
import { GivingService, CreateBankAccountRequest, UpdateBankAccountRequest } from '../services/giving.service';
import { PaystackService } from '../services/paystack.service';
import { sendSuccess, sendError } from '../utils/responses';
import { AuthenticatedUserRequest } from '../types';
import { GivingPurpose, GivingTransactionStatus } from '@prisma/client';

// Request-shape interfaces kept local to this controller (not added to
// src/types/index.ts - see backend unit instructions).
interface InitializeGivingBody {
  amount: number;
  email?: string;
  purpose: GivingPurpose;
  projectId?: number;
  anonymous?: boolean;
  callbackUrl?: string;
}

const VALID_PURPOSES: GivingPurpose[] = ['TITHE', 'OFFERING', 'SEED', 'PROJECT'];

export class GivingController {
  // ─── Church bank accounts ───

  static async listBankAccounts(_req: Request, res: Response): Promise<void> {
    try {
      const result = await GivingService.listBankAccounts();
      if (result.success) {
        sendSuccess(res, 'Bank accounts retrieved successfully', result.data);
      } else {
        sendError(res, result.error, 500, result.details);
      }
    } catch (error) {
      sendError(res, 'Failed to retrieve bank accounts', 500, error);
    }
  }

  static async createBankAccount(req: Request, res: Response): Promise<void> {
    try {
      const data: CreateBankAccountRequest = req.body;

      if (!data.bankName || !data.accountName || !data.accountNumber) {
        sendError(res, 'Missing required fields: bankName, accountName, and accountNumber', 400);
        return;
      }

      const result = await GivingService.createBankAccount(data);

      if (result.success) {
        sendSuccess(res, 'Bank account created successfully', result.data, 201);
      } else {
        sendError(res, result.error, 400, result.details);
      }
    } catch (error) {
      sendError(res, 'Failed to create bank account', 500, error);
    }
  }

  static async updateBankAccount(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const data: UpdateBankAccountRequest = req.body;

      if (isNaN(id)) {
        sendError(res, 'Invalid bank account ID', 400);
        return;
      }

      const result = await GivingService.updateBankAccount(id, data);

      if (result.success) {
        sendSuccess(res, 'Bank account updated successfully', result.data);
      } else {
        const statusCode = result.error === 'Bank account not found' ? 404 : 400;
        sendError(res, result.error, statusCode, result.details);
      }
    } catch (error) {
      sendError(res, 'Failed to update bank account', 500, error);
    }
  }

  static async deleteBankAccount(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        sendError(res, 'Invalid bank account ID', 400);
        return;
      }

      const result = await GivingService.deleteBankAccount(id);

      if (result.success) {
        sendSuccess(res, 'Bank account deleted successfully', result.data);
      } else {
        const statusCode = result.error === 'Bank account not found' ? 404 : 500;
        sendError(res, result.error, statusCode, result.details);
      }
    } catch (error) {
      sendError(res, 'Failed to delete bank account', 500, error);
    }
  }

  // ─── Paystack ───

  static async initialize(req: AuthenticatedUserRequest, res: Response): Promise<void> {
    try {
      const { amount, email, purpose, projectId, anonymous, callbackUrl } = req.body as InitializeGivingBody;

      if (typeof amount !== 'number' || !(amount > 0)) {
        sendError(res, 'A valid amount (in Naira) is required', 400);
        return;
      }

      if (!purpose || !VALID_PURPOSES.includes(purpose)) {
        sendError(res, `purpose must be one of: ${VALID_PURPOSES.join(', ')}`, 400);
        return;
      }

      const resolvedEmail = req.appUser?.email || email;
      if (!resolvedEmail) {
        sendError(res, 'email is required when not signed in', 400);
        return;
      }

      if (purpose === 'PROJECT' && !projectId) {
        sendError(res, 'projectId is required when purpose is PROJECT', 400);
        return;
      }

      const result = await GivingService.initializeTransaction({
        amount,
        email: resolvedEmail,
        purpose,
        projectId,
        anonymous,
        appUserId: req.appUser?.id,
        callbackUrl,
      });

      if (result.success) {
        sendSuccess(res, 'Giving transaction initialized successfully', result.data, 201);
      } else {
        const statusCode = result.error.includes('not configured')
          ? 503
          : result.error === 'Project not found'
          ? 404
          : 400;
        sendError(res, result.error, statusCode, result.details);
      }
    } catch (error) {
      sendError(res, 'Failed to initialize giving transaction', 500, error);
    }
  }

  static async verify(req: Request, res: Response): Promise<void> {
    try {
      const reference = (req.body?.reference || req.query?.reference) as string | undefined;

      if (!reference) {
        sendError(res, 'reference is required', 400);
        return;
      }

      const result = await GivingService.verifyTransaction(reference);

      if (result.success) {
        sendSuccess(res, 'Transaction verified successfully', result.data);
      } else {
        const statusCode =
          result.error === 'Transaction not found'
            ? 404
            : result.error.includes('not configured')
            ? 503
            : 400;
        sendError(res, result.error, statusCode, result.details);
      }
    } catch (error) {
      sendError(res, 'Failed to verify transaction', 500, error);
    }
  }

  // No authenticate/authenticateUser middleware - Paystack calls this
  // directly. Always acknowledges quickly (200) once the signature checks
  // out, per Paystack's webhook expectations.
  static async webhook(req: Request, res: Response): Promise<void> {
    try {
      const signatureHeader = req.headers['x-paystack-signature'] as string | undefined;
      const rawBody = (req as any).rawBody;

      let isValid = false;
      try {
        isValid = PaystackService.verifyWebhookSignature(rawBody, signatureHeader);
      } catch (err) {
        console.warn('Giving webhook: signature verification unavailable (Paystack not configured)', err);
        isValid = false;
      }

      if (!isValid) {
        sendError(res, 'Invalid webhook signature', 400);
        return;
      }

      const event = req.body?.event;
      const reference = req.body?.data?.reference;

      if (event === 'charge.success' && reference) {
        try {
          const result = await GivingService.verifyTransaction(reference);
          if (!result.success) {
            console.warn(`Giving webhook: charge.success processing did not succeed for ${reference}:`, result.error);
          }
        } catch (err) {
          console.error(`Giving webhook: error processing charge.success for ${reference}`, err);
        }
      }

      sendSuccess(res, 'Webhook processed', { received: true });
    } catch (error) {
      console.error('Giving webhook: handler error', error);
      // Still ack - Paystack expects a fast 200 even on a minor internal issue.
      sendSuccess(res, 'Webhook processed', { received: true });
    }
  }

  // ─── Giving history / saved cards ───

  static async getHistory(req: AuthenticatedUserRequest, res: Response): Promise<void> {
    try {
      if (!req.appUser) {
        sendError(res, 'Authentication required', 401);
        return;
      }

      const result = await GivingService.getHistory(req.appUser.id);

      if (result.success) {
        sendSuccess(res, 'Giving history retrieved successfully', result.data);
      } else {
        sendError(res, result.error, 500, result.details);
      }
    } catch (error) {
      sendError(res, 'Failed to retrieve giving history', 500, error);
    }
  }

  static async getMethods(req: AuthenticatedUserRequest, res: Response): Promise<void> {
    try {
      if (!req.appUser) {
        sendError(res, 'Authentication required', 401);
        return;
      }

      const result = await GivingService.getMethods(req.appUser.id);

      if (result.success) {
        sendSuccess(res, 'Payment methods retrieved successfully', result.data);
      } else {
        sendError(res, result.error, 500, result.details);
      }
    } catch (error) {
      sendError(res, 'Failed to retrieve payment methods', 500, error);
    }
  }

  static async deleteMethod(req: AuthenticatedUserRequest, res: Response): Promise<void> {
    try {
      if (!req.appUser) {
        sendError(res, 'Authentication required', 401);
        return;
      }

      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        sendError(res, 'Invalid payment method ID', 400);
        return;
      }

      const result = await GivingService.deleteMethod(id, req.appUser.id);

      if (result.success) {
        sendSuccess(res, 'Payment method deleted successfully', result.data);
      } else {
        const statusCode = result.error === 'Payment method not found' ? 404 : 500;
        sendError(res, result.error, statusCode, result.details);
      }
    } catch (error) {
      sendError(res, 'Failed to delete payment method', 500, error);
    }
  }

  // ─── Admin ledger ───

  static async getAdminTransactions(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const status = req.query.status as GivingTransactionStatus | undefined;
      const purpose = req.query.purpose as GivingPurpose | undefined;
      const projectId = req.query.projectId ? parseInt(req.query.projectId as string) : undefined;

      const result = await GivingService.getAdminTransactions({ page, limit, status, purpose, projectId });

      if (result.success) {
        sendSuccess(res, 'Giving transactions retrieved successfully', result.data);
      } else {
        sendError(res, result.error, 500, result.details);
      }
    } catch (error) {
      sendError(res, 'Failed to retrieve giving transactions', 500, error);
    }
  }
}
