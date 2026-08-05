// backend/src/services/prayerRequest.service.ts
import { prisma } from '../config/database';
import { ServiceResponse, PaginationParams } from '../types';
import { PrayerRequest, PrayerRequestStatus } from '@prisma/client';

// Request/response shapes local to this unit (types/index.ts is off-limits -
// other agents are editing it concurrently).
export interface CreatePrayerRequestRequest {
  name?: string;
  body: string;
  isPrivate?: boolean;
  appUserId?: number;
}

export interface PrayerRequestFilters extends PaginationParams {
  status?: PrayerRequestStatus;
}

export class PrayerRequestService {
  static async createPrayerRequest(
    data: CreatePrayerRequestRequest
  ): Promise<ServiceResponse<PrayerRequest>> {
    try {
      const prayerRequest = await prisma.prayerRequest.create({
        data: {
          name: data.name || null,
          body: data.body,
          isPrivate: data.isPrivate !== undefined ? data.isPrivate : true,
          appUserId: data.appUserId ?? null,
        },
      });

      return {
        success: true,
        data: prayerRequest,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to create prayer request',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async getAllPrayerRequests(filters: PrayerRequestFilters): Promise<ServiceResponse<{
    prayerRequests: PrayerRequest[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>> {
    try {
      const { page = 1, limit = 10, status } = filters;
      const skip = (page - 1) * limit;

      const where: any = {};
      if (status) {
        where.status = status;
      }

      const total = await prisma.prayerRequest.count({ where });

      const prayerRequests = await prisma.prayerRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      });

      const totalPages = Math.ceil(total / limit);

      return {
        success: true,
        data: {
          prayerRequests,
          total,
          page,
          limit,
          totalPages,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch prayer requests',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async updatePrayerRequestStatus(
    id: number,
    status: PrayerRequestStatus,
    adminId: number
  ): Promise<ServiceResponse<PrayerRequest>> {
    try {
      const existing = await prisma.prayerRequest.findUnique({ where: { id } });

      if (!existing) {
        return {
          success: false,
          error: 'Prayer request not found',
        };
      }

      const isHandled = status === 'HANDLED';

      const updated = await prisma.prayerRequest.update({
        where: { id },
        data: {
          status,
          handledByAdminId: isHandled ? adminId : null,
          handledAt: isHandled ? new Date() : null,
          updatedAt: new Date(),
        },
      });

      return {
        success: true,
        data: updated,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to update prayer request status',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
