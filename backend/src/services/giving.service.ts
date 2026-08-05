// backend/src/services/giving.service.ts
import crypto from 'crypto';
import { prisma } from '../config/database';
import { ServiceResponse } from '../types';
import {
  ChurchBankAccount,
  GivingTransaction,
  PaymentMethod,
  GivingPurpose,
  GivingTransactionStatus,
} from '@prisma/client';
import { PaystackService, PaystackVerifyResult } from './paystack.service';

// Request-shape interfaces kept local to this service (not added to
// src/types/index.ts - see backend unit instructions).
export interface CreateBankAccountRequest {
  bankName: string;
  accountName: string;
  accountNumber: string;
  instructions?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export interface UpdateBankAccountRequest extends Partial<CreateBankAccountRequest> {}

export interface InitializeGivingParams {
  amount: number; // Naira, not kobo
  email: string;
  purpose: GivingPurpose;
  projectId?: number;
  anonymous?: boolean;
  appUserId?: number;
  callbackUrl?: string;
}

export interface GivingTransactionAdminFilters {
  page?: number;
  limit?: number;
  status?: GivingTransactionStatus;
  purpose?: GivingPurpose;
  projectId?: number;
}

export interface GivingTransactionWithProjectTitle extends GivingTransaction {
  project: { title: string } | null;
}

export class GivingService {
  // ─── Church bank accounts (default/manual giving path) ───

  static async listBankAccounts(): Promise<ServiceResponse<ChurchBankAccount[]>> {
    try {
      const accounts = await prisma.churchBankAccount.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
      });
      return { success: true, data: accounts };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch bank accounts',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async createBankAccount(data: CreateBankAccountRequest): Promise<ServiceResponse<ChurchBankAccount>> {
    try {
      const account = await prisma.churchBankAccount.create({
        data: {
          bankName: data.bankName,
          accountName: data.accountName,
          accountNumber: data.accountNumber,
          instructions: data.instructions ?? null,
          isActive: data.isActive !== undefined ? data.isActive : true,
          sortOrder: data.sortOrder ?? 0,
        },
      });
      return { success: true, data: account };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to create bank account',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async updateBankAccount(id: number, data: UpdateBankAccountRequest): Promise<ServiceResponse<ChurchBankAccount>> {
    try {
      const existing = await prisma.churchBankAccount.findUnique({ where: { id } });
      if (!existing) {
        return { success: false, error: 'Bank account not found' };
      }

      const updated = await prisma.churchBankAccount.update({
        where: { id },
        data: {
          ...(data.bankName !== undefined && { bankName: data.bankName }),
          ...(data.accountName !== undefined && { accountName: data.accountName }),
          ...(data.accountNumber !== undefined && { accountNumber: data.accountNumber }),
          ...(data.instructions !== undefined && { instructions: data.instructions }),
          ...(data.isActive !== undefined && { isActive: data.isActive }),
          ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
          updatedAt: new Date(),
        },
      });
      return { success: true, data: updated };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to update bank account',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async deleteBankAccount(id: number): Promise<ServiceResponse<{ id: number }>> {
    try {
      const existing = await prisma.churchBankAccount.findUnique({ where: { id } });
      if (!existing) {
        return { success: false, error: 'Bank account not found' };
      }

      await prisma.churchBankAccount.delete({ where: { id } });
      return { success: true, data: { id } };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to delete bank account',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // ─── Paystack (online/alternative giving path) ───

  static async initializeTransaction(
    params: InitializeGivingParams
  ): Promise<ServiceResponse<{ authorizationUrl: string; reference: string }>> {
    try {
      if (params.purpose === 'PROJECT') {
        if (!params.projectId) {
          return { success: false, error: 'projectId is required when purpose is PROJECT' };
        }
        const project = await prisma.project.findUnique({ where: { id: params.projectId } });
        if (!project || !project.isActive) {
          return { success: false, error: 'Project not found' };
        }
      }

      const reference = `TBC-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
      const amountKobo = Math.round(params.amount * 100);

      await prisma.givingTransaction.create({
        data: {
          reference,
          appUserId: params.appUserId,
          email: params.email,
          amount: BigInt(amountKobo),
          purpose: params.purpose,
          projectId: params.purpose === 'PROJECT' ? params.projectId : undefined,
          anonymous: params.anonymous ?? false,
          status: 'PENDING',
        },
      });

      let initResult;
      try {
        initResult = await PaystackService.initializeTransaction({
          email: params.email,
          amountKobo,
          reference,
          metadata: {
            purpose: params.purpose,
            projectId: params.projectId,
            anonymous: params.anonymous ?? false,
          },
          callbackUrl: params.callbackUrl,
        });
      } catch (err) {
        return {
          success: false,
          error: 'Card giving is not configured yet, please use bank transfer',
          details: err instanceof Error ? err.message : 'Unknown error',
        };
      }

      return {
        success: true,
        data: { authorizationUrl: initResult.authorizationUrl, reference },
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to initialize giving transaction',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Shared success-handling logic used by BOTH POST /verify and POST /webhook
  // (charge.success). Idempotent: a transaction already SUCCESS is returned
  // as-is without re-applying side effects.
  static async markTransactionPaid(
    reference: string,
    result: PaystackVerifyResult
  ): Promise<ServiceResponse<GivingTransaction>> {
    try {
      const updated = await prisma.$transaction(async (tx) => {
        const existing = await tx.givingTransaction.findUnique({ where: { reference } });
        if (!existing) {
          throw new Error('Transaction not found');
        }

        if (existing.status === 'SUCCESS') {
          return existing;
        }

        const updatedTxn = await tx.givingTransaction.update({
          where: { reference },
          data: {
            status: 'SUCCESS',
            paidAt: result.paidAt ? new Date(result.paidAt) : new Date(),
            channel: result.channel ?? undefined,
            metadata: result.raw,
          },
        });

        if (updatedTxn.projectId) {
          await tx.project.update({
            where: { id: updatedTxn.projectId },
            data: {
              raisedAmount: { increment: updatedTxn.amount },
              donorCount: { increment: 1 },
            },
          });
        }

        if (result.authorization && updatedTxn.appUserId) {
          await tx.paymentMethod.upsert({
            where: { paystackAuthorizationCode: result.authorization.authorizationCode },
            create: {
              appUserId: updatedTxn.appUserId,
              paystackAuthorizationCode: result.authorization.authorizationCode,
              cardType: result.authorization.cardType,
              last4: result.authorization.last4,
              bank: result.authorization.bank,
              expMonth: result.authorization.expMonth,
              expYear: result.authorization.expYear,
            },
            update: {
              cardType: result.authorization.cardType,
              last4: result.authorization.last4,
              bank: result.authorization.bank,
              expMonth: result.authorization.expMonth,
              expYear: result.authorization.expYear,
            },
          });
        }

        return updatedTxn;
      });

      return { success: true, data: updated };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to mark transaction as paid',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Used by both POST /verify (client-initiated) and POST /webhook
  // (Paystack-initiated) - looks up the transaction, short-circuits if
  // already SUCCESS, otherwise calls Paystack and applies markTransactionPaid
  // on success or marks FAILED otherwise.
  static async verifyTransaction(reference: string): Promise<ServiceResponse<GivingTransaction>> {
    try {
      const existing = await prisma.givingTransaction.findUnique({ where: { reference } });
      if (!existing) {
        return { success: false, error: 'Transaction not found' };
      }

      if (existing.status === 'SUCCESS') {
        return { success: true, data: existing };
      }

      let result: PaystackVerifyResult;
      try {
        result = await PaystackService.verifyTransaction(reference);
      } catch (err) {
        return {
          success: false,
          error: 'Card giving is not configured yet, please use bank transfer',
          details: err instanceof Error ? err.message : 'Unknown error',
        };
      }

      if (result.status === 'success') {
        return this.markTransactionPaid(reference, result);
      }

      await prisma.givingTransaction.update({
        where: { reference },
        data: { status: 'FAILED', metadata: result.raw },
      });

      return {
        success: false,
        error: 'Payment verification failed',
        details: { status: result.status },
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to verify transaction',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // ─── Giving history / saved cards (mobile app, logged-in user) ───

  static async getHistory(appUserId: number): Promise<ServiceResponse<GivingTransactionWithProjectTitle[]>> {
    try {
      const transactions = await prisma.givingTransaction.findMany({
        where: { appUserId, status: 'SUCCESS' },
        orderBy: { paidAt: 'desc' },
        include: { project: { select: { title: true } } },
      });
      return { success: true, data: transactions };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch giving history',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async getMethods(appUserId: number): Promise<ServiceResponse<PaymentMethod[]>> {
    try {
      const methods = await prisma.paymentMethod.findMany({ where: { appUserId } });
      return { success: true, data: methods };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch payment methods',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async deleteMethod(id: number, appUserId: number): Promise<ServiceResponse<{ id: number }>> {
    try {
      const existing = await prisma.paymentMethod.findUnique({ where: { id } });
      if (!existing || existing.appUserId !== appUserId) {
        return { success: false, error: 'Payment method not found' };
      }

      await prisma.paymentMethod.delete({ where: { id } });
      return { success: true, data: { id } };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to delete payment method',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // ─── Admin ledger ───

  static async getAdminTransactions(filters: GivingTransactionAdminFilters): Promise<ServiceResponse<{
    transactions: GivingTransactionWithProjectTitle[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>> {
    try {
      const { page = 1, limit = 10, status, purpose, projectId } = filters;
      const skip = (page - 1) * limit;

      const where: any = {};
      if (status) where.status = status;
      if (purpose) where.purpose = purpose;
      if (projectId) where.projectId = projectId;

      const total = await prisma.givingTransaction.count({ where });

      const transactions = await prisma.givingTransaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { project: { select: { title: true } } },
      });

      const totalPages = Math.ceil(total / limit);

      return {
        success: true,
        data: { transactions, total, page, limit, totalPages },
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch giving transactions',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
