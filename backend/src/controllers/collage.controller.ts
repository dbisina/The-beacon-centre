// backend/src/controllers/collage.controller.ts
import { Request, Response } from 'express';
import { CollageService, CreateCollageRequest } from '../services/collage.service';
import { sendSuccess, sendError } from '../utils/responses';

export class CollageController {
  static async getToday(_req: Request, res: Response): Promise<void> {
    try {
      const result = await CollageService.getToday();
      if (result.success) {
        sendSuccess(res, 'Today\'s collage retrieved successfully', result.data);
      } else {
        sendError(res, result.error, 500, result.details);
      }
    } catch (error) {
      sendError(res, 'Failed to retrieve today\'s collage', 500, error);
    }
  }

  static async getAll(_req: Request, res: Response): Promise<void> {
    try {
      const result = await CollageService.getAll();
      if (result.success) {
        sendSuccess(res, 'Collages retrieved successfully', result.data);
      } else {
        sendError(res, result.error, 500, result.details);
      }
    } catch (error) {
      sendError(res, 'Failed to retrieve collages', 500, error);
    }
  }

  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        sendError(res, 'Invalid collage ID', 400);
        return;
      }

      const result = await CollageService.getById(id);
      if (result.success) {
        sendSuccess(res, 'Collage retrieved successfully', result.data);
      } else {
        const statusCode = result.error === 'Collage not found' ? 404 : 500;
        sendError(res, result.error, statusCode, result.details);
      }
    } catch (error) {
      sendError(res, 'Failed to retrieve collage', 500, error);
    }
  }

  static async create(req: Request, res: Response): Promise<void> {
    try {
      const data: CreateCollageRequest = req.body;

      if (!data.date || !Array.isArray(data.photos) || data.photos.length === 0) {
        sendError(res, 'date and at least one photo are required', 400);
        return;
      }
      if (typeof data.coverIndex !== 'number') {
        sendError(res, 'coverIndex is required', 400);
        return;
      }

      const result = await CollageService.create(data);
      if (result.success) {
        sendSuccess(res, 'Collage created successfully', result.data, 201);
      } else {
        const statusCode = result.error.includes('already exists') ? 409 : 400;
        sendError(res, result.error, statusCode, result.details);
      }
    } catch (error) {
      sendError(res, 'Failed to create collage', 500, error);
    }
  }

  static async delete(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        sendError(res, 'Invalid collage ID', 400);
        return;
      }

      const result = await CollageService.delete(id);
      if (result.success) {
        sendSuccess(res, 'Collage deleted successfully', result.data);
      } else {
        const statusCode = result.error === 'Collage not found' ? 404 : 500;
        sendError(res, result.error, statusCode, result.details);
      }
    } catch (error) {
      sendError(res, 'Failed to delete collage', 500, error);
    }
  }
}
