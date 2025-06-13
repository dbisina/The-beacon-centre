// backend/src/services/upload.service.ts
import { v2 as cloudinary } from 'cloudinary';
import { ServiceResponse, FileUploadRequest, FileUploadResponse } from '../types';
import fs from 'fs';
import path from 'path';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export class UploadService {
  static async uploadAudio(file: Express.Multer.File): Promise<ServiceResponse<FileUploadResponse>> {
    try {
      if (!file) {
        return {
          success: false,
          error: 'No file provided',
        };
      }

      // Validate file type
      const allowedTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/m4a', 'audio/aac'];
      if (!allowedTypes.includes(file.mimetype)) {
        return {
          success: false,
          error: 'Invalid file type. Only audio files are allowed.',
        };
      }

      // Validate file size (100MB max)
      const maxSize = 100 * 1024 * 1024; // 100MB
      if (file.size > maxSize) {
        return {
          success: false,
          error: 'File too large. Maximum size is 100MB.',
        };
      }

      const result = await cloudinary.uploader.upload(file.path, {
        resource_type: 'video', // Use 'video' for audio files
        folder: 'beacon-sermons/audio',
        use_filename: true,
        unique_filename: true,
        format: 'mp3', // Convert to MP3 for consistency
        audio_codec: 'mp3',
        audio_frequency: 44100,
        bit_rate: '128k', // Optimize for mobile streaming
        tags: ['sermon', 'audio', 'beacon-centre'],
      });

      // Clean up temp file
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }

      return {
        success: true,
        data: {
          url: result.secure_url,
          publicId: result.public_id,
          bytes: result.bytes,
          duration: result.duration ? Math.round(result.duration) : undefined,
          format: result.format,
        },
      };
    } catch (error) {
      // Clean up temp file on error
      if (file?.path && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }

      return {
        success: false,
        error: 'Audio upload failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async uploadImage(file: Express.Multer.File): Promise<ServiceResponse<FileUploadResponse>> {
    try {
      if (!file) {
        return {
          success: false,
          error: 'No file provided',
        };
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.mimetype)) {
        return {
          success: false,
          error: 'Invalid file type. Only JPEG, PNG, and WebP images are allowed.',
        };
      }

      // Validate file size (10MB max)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        return {
          success: false,
          error: 'File too large. Maximum size is 10MB.',
        };
      }

      const result = await cloudinary.uploader.upload(file.path, {
        resource_type: 'image',
        folder: 'beacon-announcements',
        use_filename: true,
        unique_filename: true,
        transformation: [
          { width: 1200, height: 800, crop: 'limit' }, // Max dimensions
          { quality: 'auto:good' }, // Automatic quality optimization
          { format: 'auto' }, // Best format for device (WebP, JPEG, etc.)
        ],
        tags: ['announcement', 'image', 'beacon-centre'],
      });

      // Clean up temp file
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }

      return {
        success: true,
        data: {
          url: result.secure_url,
          publicId: result.public_id,
          bytes: result.bytes,
          format: result.format,
        },
      };
    } catch (error) {
      // Clean up temp file on error
      if (file?.path && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }

      return {
        success: false,
        error: 'Image upload failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async uploadThumbnail(file: Express.Multer.File): Promise<ServiceResponse<FileUploadResponse>> {
    try {
      if (!file) {
        return {
          success: false,
          error: 'No file provided',
        };
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.mimetype)) {
        return {
          success: false,
          error: 'Invalid file type. Only JPEG, PNG, and WebP images are allowed.',
        };
      }

      const result = await cloudinary.uploader.upload(file.path, {
        resource_type: 'image',
        folder: 'beacon-sermons/thumbnails',
        use_filename: true,
        unique_filename: true,
        transformation: [
          { width: 640, height: 360, crop: 'fill', gravity: 'center' }, // 16:9 aspect ratio
          { quality: 'auto:good' },
          { format: 'auto' },
        ],
        tags: ['thumbnail', 'sermon', 'beacon-centre'],
      });

      // Clean up temp file
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }

      return {
        success: true,
        data: {
          url: result.secure_url,
          publicId: result.public_id,
          bytes: result.bytes,
          format: result.format,
        },
      };
    } catch (error) {
      // Clean up temp file on error
      if (file?.path && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }

      return {
        success: false,
        error: 'Thumbnail upload failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async deleteFile(publicId: string, resourceType: 'image' | 'video' = 'image'): Promise<ServiceResponse<{ publicId: string }>> {
    try {
      await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });

      return {
        success: true,
        data: { publicId },
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to delete file',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async getFileDetails(publicId: string, resourceType: 'image' | 'video' = 'image'): Promise<ServiceResponse<any>> {
    try {
      const result = await cloudinary.api.resource(publicId, { resource_type: resourceType });

      return {
        success: true,
        data: {
          publicId: result.public_id,
          url: result.secure_url,
          bytes: result.bytes,
          format: result.format,
          width: result.width,
          height: result.height,
          duration: result.duration,
          createdAt: result.created_at,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to get file details',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async generateSignedUrl(publicId: string, transformation?: any): Promise<ServiceResponse<{ url: string }>> {
    try {
      const options: any = {
        sign_url: true,
        expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour
      };

      if (transformation) {
        options.transformation = transformation;
      }

      const url = cloudinary.url(publicId, options);

      return {
        success: true,
        data: { url },
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to generate signed URL',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // YouTube thumbnail extraction
  static async extractYouTubeThumbnail(youtubeId: string): Promise<ServiceResponse<FileUploadResponse>> {
    try {
      const thumbnailUrl = `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`;
      
      const result = await cloudinary.uploader.upload(thumbnailUrl, {
        folder: 'beacon-sermons/youtube-thumbnails',
        public_id: `youtube_${youtubeId}`,
        transformation: [
          { width: 640, height: 360, crop: 'fill' },
          { quality: 'auto:good' },
          { format: 'auto' },
        ],
        tags: ['youtube', 'thumbnail', 'beacon-centre'],
      });

      return {
        success: true,
        data: {
          url: result.secure_url,
          publicId: result.public_id,
          bytes: result.bytes,
          format: result.format,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to extract YouTube thumbnail',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Batch delete files
  static async deleteMultipleFiles(publicIds: string[], resourceType: 'image' | 'video' = 'image'): Promise<ServiceResponse<{
    deleted: string[];
    failed: string[];
  }>> {
    try {
      const results = {
        deleted: [] as string[],
        failed: [] as string[],
      };

      for (const publicId of publicIds) {
        try {
          await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
          results.deleted.push(publicId);
        } catch (error) {
          results.failed.push(publicId);
        }
      }

      return {
        success: true,
        data: results,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Batch delete failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}