// backend/src/controllers/prayerRequest.controller.ts
import { Response } from 'express';
import { PrayerRequestService, PrayerRequestFilters } from '../services/prayerRequest.service';
import { sendSuccess, sendError } from '../utils/responses';
import { AuthenticatedRequest, AuthenticatedUserRequest } from '../types';
import { PrayerRequestStatus } from '@prisma/client';

const VALID_STATUSES: PrayerRequestStatus[] = ['NEW', 'IN_PROGRESS', 'HANDLED'];

export class PrayerRequestController {
  // Public (guest-friendly) submission endpoint
  static async createPrayerRequest(req: AuthenticatedUserRequest, res: Response): Promise<void> {
    try {
      const { name, body, isPrivate } = req.body;

      if (!body) {
        sendError(res, 'Missing required field: body', 400);
        return;
      }

      const result = await PrayerRequestService.createPrayerRequest({
        name,
        body,
        isPrivate,
        appUserId: req.appUser?.id,
      });

      if (result.success) {
        sendSuccess(res, 'Prayer request submitted successfully', result.data, 201);
      } else {
        sendError(res, result.error, 400, result.details);
      }
    } catch (error) {
      sendError(res, 'Failed to submit prayer request', 500, error);
    }
  }

  static async getAllPrayerRequests(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const filters: PrayerRequestFilters = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
        status: req.query.status as PrayerRequestStatus | undefined,
      };

      const result = await PrayerRequestService.getAllPrayerRequests(filters);

      if (result.success) {
        sendSuccess(res, 'Prayer requests retrieved successfully', result.data);
      } else {
        sendError(res, result.error, 500, result.details);
      }
    } catch (error) {
      sendError(res, 'Failed to retrieve prayer requests', 500, error);
    }
  }

  static async updateStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;

      if (isNaN(id)) {
        sendError(res, 'Invalid prayer request ID', 400);
        return;
      }

      if (!status || !VALID_STATUSES.includes(status)) {
        sendError(res, `Status must be one of: ${VALID_STATUSES.join(', ')}`, 400);
        return;
      }

      if (!req.admin) {
        sendError(res, 'Authentication required', 401);
        return;
      }

      const result = await PrayerRequestService.updatePrayerRequestStatus(id, status, req.admin.id);

      if (result.success) {
        sendSuccess(res, 'Prayer request status updated successfully', result.data);
      } else {
        const statusCode = result.error === 'Prayer request not found' ? 404 : 400;
        sendError(res, result.error, statusCode, result.details);
      }
    } catch (error) {
      sendError(res, 'Failed to update prayer request status', 500, error);
    }
  }
}
