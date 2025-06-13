// backend/src/controllers/audioSermon.controller.ts
import { Request, Response } from 'express';
import { AudioSermonService } from '../services/audioSermon.service';
import { UploadService } from '../services/upload.service';
import { sendSuccess, sendError } from '../utils/responses';
import { CreateAudioSermonRequest, UpdateAudioSermonRequest, AudioSermonFilters } from '../types';

export class AudioSermonController {
  static async getAllAudioSermons(req: Request, res: Response): Promise<void> {
    try {
      const filters: AudioSermonFilters = {
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

      const result = await AudioSermonService.getAllAudioSermons(filters);

      if (result.success) {
        sendSuccess(res, 'Audio sermons retrieved successfully', result.data);
      } else {
        sendError(res, result.error, 500, result.details);
      }
    } catch (error) {
      sendError(res, 'Failed to retrieve audio sermons', 500, error);
    }
  }

  static async getAudioSermonById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        sendError(res, 'Invalid audio sermon ID', 400);
        return;
      }

      const result = await AudioSermonService.getAudioSermonById(id);

      if (result.success) {
        sendSuccess(res, 'Audio sermon retrieved successfully', result.data);
      } else {
        const statusCode = result.error === 'Audio sermon not found' ? 404 : 500;
        sendError(res, result.error, statusCode, result.details);
      }
    } catch (error) {
      sendError(res, 'Failed to retrieve audio sermon', 500, error);
    }
  }

  static async getFeaturedAudioSermons(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const result = await AudioSermonService.getFeaturedAudioSermons(limit);

      if (result.success) {
        sendSuccess(res, 'Featured audio sermons retrieved successfully', result.data);
      } else {
        sendError(res, result.error, 500, result.details);
      }
    } catch (error) {
      sendError(res, 'Failed to retrieve featured audio sermons', 500, error);
    }
  }

  static async getAudioSermonsByCategory(req: Request, res: Response): Promise<void> {
    try {
      const categoryId = parseInt(req.params.categoryId);
      const limit = parseInt(req.query.limit as string) || 10;

      if (isNaN(categoryId)) {
        sendError(res, 'Invalid category ID', 400);
        return;
      }

      const result = await AudioSermonService.getAudioSermonsByCategory(categoryId, limit);

      if (result.success) {
        sendSuccess(res, 'Audio sermons by category retrieved successfully', result.data);
      } else {
        sendError(res, result.error, 500, result.details);
      }
    } catch (error) {
      sendError(res, 'Failed to retrieve audio sermons by category', 500, error);
    }
  }

  static async createAudioSermon(req: Request, res: Response): Promise<void> {
    try {
      const sermonData: CreateAudioSermonRequest = req.body;

      // Basic validation
      if (!sermonData.title || !sermonData.speaker || !sermonData.audioUrl || !sermonData.cloudinaryPublicId) {
        sendError(res, 'Missing required fields', 400);
        return;
      }

      const result = await AudioSermonService.createAudioSermon(sermonData);

      if (result.success) {
        sendSuccess(res, 'Audio sermon created successfully', result.data, 201);
      } else {
        sendError(res, result.error, 400, result.details);
      }
    } catch (error) {
      sendError(res, 'Failed to create audio sermon', 500, error);
    }
  }

  static async createAudioSermonWithUpload(req: Request, res: Response): Promise<void> {
    try {
      if (!req.file) {
        sendError(res, 'No audio file provided', 400);
        return;
      }

      // Upload audio file first
      const uploadResult = await UploadService.uploadAudio(req.file);

      if (!uploadResult.success) {
        sendError(res, uploadResult.error, 400, uploadResult.details);
        return;
      }

      // Create sermon with uploaded audio data
      const sermonData: CreateAudioSermonRequest = {
        title: req.body.title,
        speaker: req.body.speaker,
        audioUrl: uploadResult.data.url,
        cloudinaryPublicId: uploadResult.data.publicId,
        duration: uploadResult.data.duration?.toString(),
        fileSize: uploadResult.data.bytes,
        categoryId: req.body.categoryId ? parseInt(req.body.categoryId) : undefined,
        sermonDate: req.body.sermonDate,
        description: req.body.description,
        isFeatured: req.body.isFeatured === 'true',
        isActive: req.body.isActive !== 'false',
        tags: req.body.tags ? JSON.parse(req.body.tags) : [],
      };

      // Basic validation
      if (!sermonData.title || !sermonData.speaker) {
        // Clean up uploaded file if validation fails
        await UploadService.deleteFile(uploadResult.data.publicId, 'video');
        sendError(res, 'Missing required fields: title and speaker', 400);
        return;
      }

      const result = await AudioSermonService.createAudioSermon(sermonData);

      if (result.success) {
        sendSuccess(res, 'Audio sermon created successfully', {
          ...result.data,
          uploadInfo: uploadResult.data,
        }, 201);
      } else {
        // Clean up uploaded file if sermon creation fails
        await UploadService.deleteFile(uploadResult.data.publicId, 'video');
        sendError(res, result.error, 400, result.details);
      }
    } catch (error) {
      sendError(res, 'Failed to create audio sermon with upload', 500, error);
    }
  }

  static async updateAudioSermon(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const updateData: UpdateAudioSermonRequest = req.body;

      if (isNaN(id)) {
        sendError(res, 'Invalid audio sermon ID', 400);
        return;
      }

      const result = await AudioSermonService.updateAudioSermon(id, updateData);

      if (result.success) {
        sendSuccess(res, 'Audio sermon updated successfully', result.data);
      } else {
        const statusCode = result.error === 'Audio sermon not found' ? 404 : 400;
        sendError(res, result.error, statusCode, result.details);
      }
    } catch (error) {
      sendError(res, 'Failed to update audio sermon', 500, error);
    }
  }

  static async deleteAudioSermon(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        sendError(res, 'Invalid audio sermon ID', 400);
        return;
      }

      const result = await AudioSermonService.deleteAudioSermon(id);

      if (result.success) {
        sendSuccess(res, 'Audio sermon deleted successfully', result.data);
      } else {
        const statusCode = result.error === 'Audio sermon not found' ? 404 : 500;
        sendError(res, result.error, statusCode, result.details);
      }
    } catch (error) {
      sendError(res, 'Failed to delete audio sermon', 500, error);
    }
  }

  static async toggleFeatured(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        sendError(res, 'Invalid audio sermon ID', 400);
        return;
      }

      const result = await AudioSermonService.toggleFeatured(id);

      if (result.success) {
        sendSuccess(res, 'Featured status updated successfully', result.data);
      } else {
        const statusCode = result.error === 'Audio sermon not found' ? 404 : 500;
        sendError(res, result.error, statusCode, result.details);
      }
    } catch (error) {
      sendError(res, 'Failed to toggle featured status', 500, error);
    }
  }

  static async getAudioSermonStats(req: Request, res: Response): Promise<void> {
    try {
      const result = await AudioSermonService.getAudioSermonStats();

      if (result.success) {
        sendSuccess(res, 'Audio sermon statistics retrieved successfully', result.data);
      } else {
        sendError(res, result.error, 500, result.details);
      }
    } catch (error) {
      sendError(res, 'Failed to retrieve audio sermon statistics', 500, error);
    }
  }
}