// backend/src/controllers/devotional.controller.ts
import { Request, Response } from 'express';
import { DevotionalService } from '../services/devotional.service';
import { sendSuccess, sendError } from '../utils/responses';
import { CreateDevotionalRequest, UpdateDevotionalRequest, DevotionalFilters } from '../types';

export class DevotionalController {
  static async getAllDevotionals(req: Request, res: Response): Promise<void> {
    try {
      const filters: DevotionalFilters = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
        search: req.query.search as string,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        sortBy: (req.query.sortBy as string) || 'date',
        sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
      };

      const result = await DevotionalService.getAllDevotionals(filters);

      if (result.success) {
        sendSuccess(res, 'Devotionals retrieved successfully', result.data);
      } else {
        sendError(res, result.error, 500, result.details);
      }
    } catch (error) {
      sendError(res, 'Failed to retrieve devotionals', 500, error);
    }
  }

  static async getDevotionalById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        sendError(res, 'Invalid devotional ID', 400);
        return;
      }

      const result = await DevotionalService.getDevotionalById(id);

      if (result.success) {
        sendSuccess(res, 'Devotional retrieved successfully', result.data);
      } else {
        const statusCode = result.error === 'Devotional not found' ? 404 : 500;
        sendError(res, result.error, statusCode, result.details);
      }
    } catch (error) {
      sendError(res, 'Failed to retrieve devotional', 500, error);
    }
  }

  static async getDevotionalByDate(req: Request, res: Response): Promise<void> {
    try {
      const { date } = req.params;

      if (!date || isNaN(Date.parse(date))) {
        sendError(res, 'Invalid date format', 400);
        return;
      }

      const result = await DevotionalService.getDevotionalByDate(date);

      if (result.success) {
        sendSuccess(res, 'Devotional retrieved successfully', result.data);
      } else {
        const statusCode = result.error === 'No devotional found for this date' ? 404 : 500;
        sendError(res, result.error, statusCode, result.details);
      }
    } catch (error) {
      sendError(res, 'Failed to retrieve devotional', 500, error);
    }
  }

  static async getTodaysDevotional(req: Request, res: Response): Promise<void> {
    try {
      const result = await DevotionalService.getTodaysDevotional();

      if (result.success) {
        sendSuccess(res, 'Today\'s devotional retrieved successfully', result.data);
      } else {
        const statusCode = result.error === 'No devotional available for today' ? 404 : 500;
        sendError(res, result.error, statusCode, result.details);
      }
    } catch (error) {
      sendError(res, 'Failed to retrieve today\'s devotional', 500, error);
    }
  }

  static async createDevotional(req: Request, res: Response): Promise<void> {
    try {
      const devotionalData: CreateDevotionalRequest = req.body;

      // Basic validation
      if (!devotionalData.title || !devotionalData.date || !devotionalData.verseText || 
          !devotionalData.verseReference || !devotionalData.content) {
        sendError(res, 'Missing required fields', 400);
        return;
      }

      const result = await DevotionalService.createDevotional(devotionalData);

      if (result.success) {
        sendSuccess(res, 'Devotional created successfully', result.data, 201);
      } else {
        const statusCode = result.error === 'A devotional already exists for this date' ? 409 : 500;
        sendError(res, result.error, statusCode, result.details);
      }
    } catch (error) {
      sendError(res, 'Failed to create devotional', 500, error);
    }
  }

  static async updateDevotional(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const updateData: UpdateDevotionalRequest = req.body;

      if (isNaN(id)) {
        sendError(res, 'Invalid devotional ID', 400);
        return;
      }

      const result = await DevotionalService.updateDevotional(id, updateData);

      if (result.success) {
        sendSuccess(res, 'Devotional updated successfully', result.data);
      } else {
        const statusCode = result.error === 'Devotional not found' ? 404 : 500;
        sendError(res, result.error, statusCode, result.details);
      }
    } catch (error) {
      sendError(res, 'Failed to update devotional', 500, error);
    }
  }

  static async deleteDevotional(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        sendError(res, 'Invalid devotional ID', 400);
        return;
      }

      const result = await DevotionalService.deleteDevotional(id);

      if (result.success) {
        sendSuccess(res, 'Devotional deleted successfully', result.data);
      } else {
        const statusCode = result.error === 'Devotional not found' ? 404 : 500;
        sendError(res, result.error, statusCode, result.details);
      }
    } catch (error) {
      sendError(res, 'Failed to delete devotional', 500, error);
    }
  }

  static async bulkCreateDevotionals(req: Request, res: Response): Promise<void> {
    try {
      const { devotionals } = req.body;

      if (!Array.isArray(devotionals) || devotionals.length === 0) {
        sendError(res, 'Invalid devotionals array', 400);
        return;
      }

      const result = await DevotionalService.bulkCreateDevotionals(devotionals);

      if (result.success) {
        sendSuccess(res, 'Bulk creation completed', result.data);
      } else {
        sendError(res, result.error, 500, result.details);
      }
    } catch (error) {
      sendError(res, 'Failed to bulk create devotionals', 500, error);
    }
  }
}