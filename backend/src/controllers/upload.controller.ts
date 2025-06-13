// backend/src/controllers/upload.controller.ts
import { Request, Response } from 'express';
import { UploadService } from '../services/upload.service';
import { sendSuccess, sendError } from '../utils/responses';
import { AuthenticatedRequest } from '../types';

export class UploadController {
  /**
   * Upload audio file (for audio sermons)
   */
  static async uploadAudio(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.file) {
        sendError(res, 'No audio file provided', 400);
        return;
      }

      // Validate file type
      const allowedTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/m4a', 'audio/aac'];
      if (!allowedTypes.includes(req.file.mimetype)) {
        sendError(res, 'Invalid file type. Only audio files are allowed.', 400);
        return;
      }

      // Validate file size (100MB max)
      const maxSize = 100 * 1024 * 1024; // 100MB
      if (req.file.size > maxSize) {
        sendError(res, 'File too large. Maximum size is 100MB.', 400);
        return;
      }

      const result = await UploadService.uploadAudio(req.file);

      if (result.success) {
        sendSuccess(res, 'Audio uploaded successfully', result.data, 201);
      } else {
        sendError(res, result.error, 400, result.details);
      }
    } catch (error) {
      sendError(res, 'Audio upload failed', 500, error);
    }
  }

  /**
   * Upload image file (for announcements, thumbnails)
   */
  static async uploadImage(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.file) {
        sendError(res, 'No image file provided', 400);
        return;
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(req.file.mimetype)) {
        sendError(res, 'Invalid file type. Only JPEG, PNG, and WebP images are allowed.', 400);
        return;
      }

      // Validate file size (10MB max)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (req.file.size > maxSize) {
        sendError(res, 'File too large. Maximum size is 10MB.', 400);
        return;
      }

      const result = await UploadService.uploadImage(req.file);

      if (result.success) {
        sendSuccess(res, 'Image uploaded successfully', result.data, 201);
      } else {
        sendError(res, result.error, 400, result.details);
      }
    } catch (error) {
      sendError(res, 'Image upload failed', 500, error);
    }
  }

  /**
   * Upload thumbnail image (specific for sermon thumbnails)
   */
  static async uploadThumbnail(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.file) {
        sendError(res, 'No thumbnail file provided', 400);
        return;
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(req.file.mimetype)) {
        sendError(res, 'Invalid file type. Only JPEG, PNG, and WebP images are allowed.', 400);
        return;
      }

      // Validate file size (5MB max for thumbnails)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (req.file.size > maxSize) {
        sendError(res, 'File too large. Maximum size is 5MB for thumbnails.', 400);
        return;
      }

      const result = await UploadService.uploadThumbnail(req.file);

      if (result.success) {
        sendSuccess(res, 'Thumbnail uploaded successfully', result.data, 201);
      } else {
        sendError(res, result.error, 400, result.details);
      }
    } catch (error) {
      sendError(res, 'Thumbnail upload failed', 500, error);
    }
  }

  /**
   * Extract thumbnail from YouTube video
   */
  static async extractYouTubeThumbnail(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { youtubeId } = req.body;

      if (!youtubeId) {
        sendError(res, 'YouTube ID is required', 400);
        return;
      }

      // Validate YouTube ID format (basic validation)
      if (typeof youtubeId !== 'string' || youtubeId.length < 5) {
        sendError(res, 'Invalid YouTube ID format', 400);
        return;
      }

      const result = await UploadService.extractYouTubeThumbnail(youtubeId);

      if (result.success) {
        sendSuccess(res, 'YouTube thumbnail extracted successfully', result.data, 201);
      } else {
        sendError(res, result.error, 400, result.details);
      }
    } catch (error) {
      sendError(res, 'YouTube thumbnail extraction failed', 500, error);
    }
  }

  /**
   * Delete uploaded file from Cloudinary
   */
  static async deleteFile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { publicId } = req.params;
      const { resourceType } = req.query;

      if (!publicId) {
        sendError(res, 'Public ID is required', 400);
        return;
      }

      // Validate resource type
      const validResourceTypes = ['image', 'video'];
      const type = (resourceType as string) || 'image';
      if (!validResourceTypes.includes(type)) {
        sendError(res, 'Invalid resource type. Use "image" or "video"', 400);
        return;
      }

      const result = await UploadService.deleteFile(publicId, type as 'image' | 'video');

      if (result.success) {
        sendSuccess(res, 'File deleted successfully', result.data);
      } else {
        sendError(res, result.error, 500, result.details);
      }
    } catch (error) {
      sendError(res, 'File deletion failed', 500, error);
    }
  }

  /**
   * Get file details from Cloudinary
   */
  static async getFileDetails(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { publicId } = req.params;
      const { resourceType } = req.query;

      if (!publicId) {
        sendError(res, 'Public ID is required', 400);
        return;
      }

      // Validate resource type
      const validResourceTypes = ['image', 'video'];
      const type = (resourceType as string) || 'image';
      if (!validResourceTypes.includes(type)) {
        sendError(res, 'Invalid resource type. Use "image" or "video"', 400);
        return;
      }

      const result = await UploadService.getFileDetails(publicId, type as 'image' | 'video');

      if (result.success) {
        sendSuccess(res, 'File details retrieved successfully', result.data);
      } else {
        sendError(res, result.error, 404, result.details);
      }
    } catch (error) {
      sendError(res, 'Failed to get file details', 500, error);
    }
  }

  /**
   * Generate signed URL for file access
   */
  static async generateSignedUrl(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { publicId } = req.params;
      const { transformation } = req.body;

      if (!publicId) {
        sendError(res, 'Public ID is required', 400);
        return;
      }

      const result = await UploadService.generateSignedUrl(publicId, transformation);

      if (result.success) {
        sendSuccess(res, 'Signed URL generated successfully', result.data);
      } else {
        sendError(res, result.error, 500, result.details);
      }
    } catch (error) {
      sendError(res, 'Failed to generate signed URL', 500, error);
    }
  }

  /**
   * Batch delete multiple files
   */
  static async deleteMultipleFiles(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { publicIds, resourceType } = req.body;

      if (!publicIds || !Array.isArray(publicIds) || publicIds.length === 0) {
        sendError(res, 'Array of public IDs is required', 400);
        return;
      }

      // Validate resource type
      const validResourceTypes = ['image', 'video'];
      const type = resourceType || 'image';
      if (!validResourceTypes.includes(type)) {
        sendError(res, 'Invalid resource type. Use "image" or "video"', 400);
        return;
      }

      // Limit batch size
      if (publicIds.length > 50) {
        sendError(res, 'Maximum 50 files can be deleted at once', 400);
        return;
      }

      const result = await UploadService.deleteMultipleFiles(publicIds, type as 'image' | 'video');

      if (result.success) {
        sendSuccess(res, 'Batch delete completed', result.data);
      } else {
        sendError(res, result.error, 500, result.details);
      }
    } catch (error) {
      sendError(res, 'Batch delete failed', 500, error);
    }
  }

  /**
   * Get upload statistics
   */
  static async getUploadStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // This would require implementing analytics in the upload service
      // For now, return a simple response
      const stats = {
        totalUploads: 0,
        totalSize: '0 MB',
        audioFiles: 0,
        imageFiles: 0,
        message: 'Upload statistics not yet implemented'
      };

      sendSuccess(res, 'Upload statistics retrieved', stats);
    } catch (error) {
      sendError(res, 'Failed to get upload statistics', 500, error);
    }
  }

  /**
   * Health check for upload service
   */
  static async uploadHealthCheck(req: Request, res: Response): Promise<void> {
    try {
      // Check if Cloudinary credentials are configured
      const isConfigured = !!(
        process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET
      );

      if (isConfigured) {
        sendSuccess(res, 'Upload service is healthy', {
          status: 'healthy',
          cloudinary: 'configured',
          timestamp: new Date().toISOString()
        });
      } else {
        sendError(res, 'Upload service not configured', 503, {
          status: 'unhealthy',
          cloudinary: 'not configured',
          message: 'Cloudinary environment variables missing'
        });
      }
    } catch (error) {
      sendError(res, 'Upload health check failed', 500, error);
    }
  }
}