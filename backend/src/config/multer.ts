// backend/src/config/multer.ts
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${extension}`);
  },
});

// File filter for audio files
const audioFileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/m4a', 'audio/aac'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only audio files are allowed.'));
  }
};

// File filter for images
const imageFileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.'));
  }
};

// Multer configurations
export const uploadAudio = multer({
  storage,
  fileFilter: audioFileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  },
});

export const uploadImage = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

export const uploadAny = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  },
});

// backend/src/controllers/upload.controller.ts
import { Request, Response } from 'express';
import { UploadService } from '../services/upload.service';
import { sendSuccess, sendError } from '../utils/responses';

export class UploadController {
  static async uploadAudio(req: Request, res: Response): Promise<void> {
    try {
      if (!req.file) {
        sendError(res, 'No audio file provided', 400);
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

  static async uploadImage(req: Request, res: Response): Promise<void> {
    try {
      if (!req.file) {
        sendError(res, 'No image file provided', 400);
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

  static async uploadThumbnail(req: Request, res: Response): Promise<void> {
    try {
      if (!req.file) {
        sendError(res, 'No thumbnail file provided', 400);
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

  static async deleteFile(req: Request, res: Response): Promise<void> {
    try {
      const { publicId } = req.params;
      const { resourceType } = req.query;

      if (!publicId) {
        sendError(res, 'Public ID is required', 400);
        return;
      }

      const result = await UploadService.deleteFile(
        publicId,
        resourceType as 'image' | 'video' || 'image'
      );

      if (result.success) {
        sendSuccess(res, 'File deleted successfully', result.data);
      } else {
        sendError(res, result.error, 500, result.details);
      }
    } catch (error) {
      sendError(res, 'File deletion failed', 500, error);
    }
  }

  static async getFileDetails(req: Request, res: Response): Promise<void> {
    try {
      const { publicId } = req.params;
      const { resourceType } = req.query;

      if (!publicId) {
        sendError(res, 'Public ID is required', 400);
        return;
      }

      const result = await UploadService.getFileDetails(
        publicId,
        resourceType as 'image' | 'video' || 'image'
      );

      if (result.success) {
        sendSuccess(res, 'File details retrieved successfully', result.data);
      } else {
        sendError(res, result.error, 404, result.details);
      }
    } catch (error) {
      sendError(res, 'Failed to get file details', 500, error);
    }
  }

  static async extractYouTubeThumbnail(req: Request, res: Response): Promise<void> {
    try {
      const { youtubeId } = req.body;

      if (!youtubeId) {
        sendError(res, 'YouTube ID is required', 400);
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
}