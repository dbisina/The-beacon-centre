// backend/src/controllers/contact.controller.ts
import { Response } from 'express';
import { ContactService, ContactMessageFilters } from '../services/contact.service';
import { sendSuccess, sendError } from '../utils/responses';
import { AuthenticatedRequest, AuthenticatedUserRequest } from '../types';
import { ContactCategory, ContactMessageStatus } from '@prisma/client';

const VALID_CATEGORIES: ContactCategory[] = ['GENERAL', 'CSG', 'PRAYER', 'TECHNICAL', 'OTHER'];
const VALID_STATUSES: ContactMessageStatus[] = ['NEW', 'HANDLED'];

export class ContactController {
  // Public (guest-friendly) submission endpoint
  static async createContactMessage(req: AuthenticatedUserRequest, res: Response): Promise<void> {
    try {
      const { name, email, phone, category, csgId, message } = req.body;

      if (!name || !email || !message) {
        sendError(res, 'Missing required fields: name, email, and message', 400);
        return;
      }

      const resolvedCategory: ContactCategory = category || 'GENERAL';

      if (resolvedCategory && !VALID_CATEGORIES.includes(resolvedCategory)) {
        sendError(res, `Category must be one of: ${VALID_CATEGORIES.join(', ')}`, 400);
        return;
      }

      if (resolvedCategory === 'CSG') {
        const parsedCsgId = parseInt(csgId);

        if (!csgId || isNaN(parsedCsgId)) {
          sendError(res, 'csgId is required and must reference a valid CSG when category is CSG', 400);
          return;
        }

        const csgExists = await ContactService.csgExists(parsedCsgId);
        if (!csgExists) {
          sendError(res, 'csgId does not reference a valid CSG', 400);
          return;
        }
      }

      const result = await ContactService.createContactMessage({
        name,
        email,
        phone,
        category: resolvedCategory,
        csgId: resolvedCategory === 'CSG' ? parseInt(csgId) : undefined,
        message,
        appUserId: req.appUser?.id,
      });

      if (result.success) {
        sendSuccess(res, 'Contact message submitted successfully', result.data, 201);
      } else {
        sendError(res, result.error, 400, result.details);
      }
    } catch (error) {
      sendError(res, 'Failed to submit contact message', 500, error);
    }
  }

  static async getAllContactMessages(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const filters: ContactMessageFilters = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
        status: req.query.status as ContactMessageStatus | undefined,
        category: req.query.category as ContactCategory | undefined,
      };

      const result = await ContactService.getAllContactMessages(filters);

      if (result.success) {
        sendSuccess(res, 'Contact messages retrieved successfully', result.data);
      } else {
        sendError(res, result.error, 500, result.details);
      }
    } catch (error) {
      sendError(res, 'Failed to retrieve contact messages', 500, error);
    }
  }

  static async updateStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;

      if (isNaN(id)) {
        sendError(res, 'Invalid contact message ID', 400);
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

      const result = await ContactService.updateContactMessageStatus(id, status, req.admin.id);

      if (result.success) {
        sendSuccess(res, 'Contact message status updated successfully', result.data);
      } else {
        const statusCode = result.error === 'Contact message not found' ? 404 : 400;
        sendError(res, result.error, statusCode, result.details);
      }
    } catch (error) {
      sendError(res, 'Failed to update contact message status', 500, error);
    }
  }
}
