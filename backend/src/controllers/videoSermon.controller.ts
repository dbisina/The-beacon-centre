// backend/src/controllers/videoSermon.controller.ts
import { Request, Response } from 'express';
import { VideoSermonService } from '../services/videoSermon.service';
import { sendSuccess, sendError } from '../utils/responses';
import { CreateVideoSermonRequest, UpdateVideoSermonRequest, VideoSermonFilters } from '../types';

export class VideoSermonController {
  static async getAllVideoSermons(req: Request, res: Response): Promise<void> {
    try {
      const filters: VideoSermonFilters = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
        search: req.query.search as string,
        categoryId: req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined,
        speaker: req.query.speaker as string,
        isFeatured: req.query.isFeatured ? req.query.isFeatured === 'true' : undefined,
        isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : true,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        sortBy: (req.query.sortBy as string) || 'createdAt',
        sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
      };

      const result = await VideoSermonService.getAllVideoSermons(filters);

      if (result.success) {
        sendSuccess(res, 'Video sermons retrieved successfully', result.data);
      } else {
        sendError(res, result.error, 500, result.details);
      }
    } catch (error) {
      sendError(res, 'Failed to retrieve video sermons', 500, error);
    }
  }

  static async getVideoSermonById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        sendError(res, 'Invalid video sermon ID', 400);
        return;
      }

      const result = await VideoSermonService.getVideoSermonById(id);

      if (result.success) {
        sendSuccess(res, 'Video sermon retrieved successfully', result.data);
      } else {
        const statusCode = result.error === 'Video sermon not found' ? 404 : 500;
        sendError(res, result.error, statusCode, result.details);
      }
    } catch (error) {
      sendError(res, 'Failed to retrieve video sermon', 500, error);
    }
  }

  static async getFeaturedVideoSermons(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const result = await VideoSermonService.getFeaturedVideoSermons(limit);

      if (result.success) {
        sendSuccess(res, 'Featured video sermons retrieved successfully', result.data);
      } else {
        sendError(res, result.error, 500, result.details);
      }
    } catch (error) {
      sendError(res, 'Failed to retrieve featured video sermons', 500, error);
    }
  }

  static async getVideoSermonsByCategory(req: Request, res: Response): Promise<void> {
    try {
      const categoryId = parseInt(req.params.categoryId);
      const limit = parseInt(req.query.limit as string) || 10;

      if (isNaN(categoryId)) {
        sendError(res, 'Invalid category ID', 400);
        return;
      }

      const result = await VideoSermonService.getVideoSermonsByCategory(categoryId, limit);

      if (result.success) {
        sendSuccess(res, 'Video sermons by category retrieved successfully', result.data);
      } else {
        sendError(res, result.error, 500, result.details);
      }
    } catch (error) {
      sendError(res, 'Failed to retrieve video sermons by category', 500, error);
    }
  }

  static async createVideoSermon(req: Request, res: Response): Promise<void> {
    try {
      const sermonData: CreateVideoSermonRequest = req.body;

      // Basic validation
      if (!sermonData.title || !sermonData.speaker || !sermonData.youtubeId) {
        sendError(res, 'Missing required fields: title, speaker, and youtubeId', 400);
        return;
      }

      const result = await VideoSermonService.createVideoSermon(sermonData);

      if (result.success) {
        sendSuccess(res, 'Video sermon created successfully', result.data, 201);
      } else {
        sendError(res, result.error, 400, result.details);
      }
    } catch (error) {
      sendError(res, 'Failed to create video sermon', 500, error);
    }
  }

  static async updateVideoSermon(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const updateData: UpdateVideoSermonRequest = req.body;

      if (isNaN(id)) {
        sendError(res, 'Invalid video sermon ID', 400);
        return;
      }

      const result = await VideoSermonService.updateVideoSermon(id, updateData);

      if (result.success) {
        sendSuccess(res, 'Video sermon updated successfully', result.data);
      } else {
        const statusCode = result.error === 'Video sermon not found' ? 404 : 400;
        sendError(res, result.error, statusCode, result.details);
      }
    } catch (error) {
      sendError(res, 'Failed to update video sermon', 500, error);
    }
  }

  static async deleteVideoSermon(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        sendError(res, 'Invalid video sermon ID', 400);
        return;
      }

      const result = await VideoSermonService.deleteVideoSermon(id);

      if (result.success) {
        sendSuccess(res, 'Video sermon deleted successfully', result.data);
      } else {
        const statusCode = result.error === 'Video sermon not found' ? 404 : 500;
        sendError(res, result.error, statusCode, result.details);
      }
    } catch (error) {
      sendError(res, 'Failed to delete video sermon', 500, error);
    }
  }

  static async toggleFeatured(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        sendError(res, 'Invalid video sermon ID', 400);
        return;
      }

      const result = await VideoSermonService.toggleFeatured(id);

      if (result.success) {
        sendSuccess(res, 'Featured status updated successfully', result.data);
      } else {
        const statusCode = result.error === 'Video sermon not found' ? 404 : 500;
        sendError(res, result.error, statusCode, result.details);
      }
    } catch (error) {
      sendError(res, 'Failed to toggle featured status', 500, error);
    }
  }

  static async getVideoSermonStats(req: Request, res: Response): Promise<void> {
    try {
      const result = await VideoSermonService.getVideoSermonStats();

      if (result.success) {
        sendSuccess(res, 'Video sermon statistics retrieved successfully', result.data);
      } else {
        sendError(res, result.error, 500, result.details);
      }
    } catch (error) {
      sendError(res, 'Failed to retrieve video sermon statistics', 500, error);
    }
  }
}