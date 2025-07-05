"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadController = void 0;
const upload_service_1 = require("../services/upload.service");
const responses_1 = require("../utils/responses");
class UploadController {
    static async uploadAudio(req, res) {
        try {
            if (!req.file) {
                (0, responses_1.sendError)(res, 'No audio file provided', 400);
                return;
            }
            const allowedTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/m4a', 'audio/aac'];
            if (!allowedTypes.includes(req.file.mimetype)) {
                (0, responses_1.sendError)(res, 'Invalid file type. Only audio files are allowed.', 400);
                return;
            }
            const maxSize = 100 * 1024 * 1024;
            if (req.file.size > maxSize) {
                (0, responses_1.sendError)(res, 'File too large. Maximum size is 100MB.', 400);
                return;
            }
            const result = await upload_service_1.UploadService.uploadAudio(req.file);
            if (result.success) {
                (0, responses_1.sendSuccess)(res, 'Audio uploaded successfully', result.data, 201);
            }
            else {
                (0, responses_1.sendError)(res, result.error, 400, result.details);
            }
        }
        catch (error) {
            (0, responses_1.sendError)(res, 'Audio upload failed', 500, error);
        }
    }
    static async uploadImage(req, res) {
        try {
            if (!req.file) {
                (0, responses_1.sendError)(res, 'No image file provided', 400);
                return;
            }
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
            if (!allowedTypes.includes(req.file.mimetype)) {
                (0, responses_1.sendError)(res, 'Invalid file type. Only JPEG, PNG, and WebP images are allowed.', 400);
                return;
            }
            const maxSize = 10 * 1024 * 1024;
            if (req.file.size > maxSize) {
                (0, responses_1.sendError)(res, 'File too large. Maximum size is 10MB.', 400);
                return;
            }
            const result = await upload_service_1.UploadService.uploadImage(req.file);
            if (result.success) {
                (0, responses_1.sendSuccess)(res, 'Image uploaded successfully', result.data, 201);
            }
            else {
                (0, responses_1.sendError)(res, result.error, 400, result.details);
            }
        }
        catch (error) {
            (0, responses_1.sendError)(res, 'Image upload failed', 500, error);
        }
    }
    static async uploadThumbnail(req, res) {
        try {
            if (!req.file) {
                (0, responses_1.sendError)(res, 'No thumbnail file provided', 400);
                return;
            }
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
            if (!allowedTypes.includes(req.file.mimetype)) {
                (0, responses_1.sendError)(res, 'Invalid file type. Only JPEG, PNG, and WebP images are allowed.', 400);
                return;
            }
            const maxSize = 5 * 1024 * 1024;
            if (req.file.size > maxSize) {
                (0, responses_1.sendError)(res, 'File too large. Maximum size is 5MB for thumbnails.', 400);
                return;
            }
            const result = await upload_service_1.UploadService.uploadThumbnail(req.file);
            if (result.success) {
                (0, responses_1.sendSuccess)(res, 'Thumbnail uploaded successfully', result.data, 201);
            }
            else {
                (0, responses_1.sendError)(res, result.error, 400, result.details);
            }
        }
        catch (error) {
            (0, responses_1.sendError)(res, 'Thumbnail upload failed', 500, error);
        }
    }
    static async extractYouTubeThumbnail(req, res) {
        try {
            const { youtubeId } = req.body;
            if (!youtubeId) {
                (0, responses_1.sendError)(res, 'YouTube ID is required', 400);
                return;
            }
            if (typeof youtubeId !== 'string' || youtubeId.length < 5) {
                (0, responses_1.sendError)(res, 'Invalid YouTube ID format', 400);
                return;
            }
            const result = await upload_service_1.UploadService.extractYouTubeThumbnail(youtubeId);
            if (result.success) {
                (0, responses_1.sendSuccess)(res, 'YouTube thumbnail extracted successfully', result.data, 201);
            }
            else {
                (0, responses_1.sendError)(res, result.error, 400, result.details);
            }
        }
        catch (error) {
            (0, responses_1.sendError)(res, 'YouTube thumbnail extraction failed', 500, error);
        }
    }
    static async deleteFile(req, res) {
        try {
            const { publicId } = req.params;
            const { resourceType } = req.query;
            if (!publicId) {
                (0, responses_1.sendError)(res, 'Public ID is required', 400);
                return;
            }
            const validResourceTypes = ['image', 'video'];
            const type = resourceType || 'image';
            if (!validResourceTypes.includes(type)) {
                (0, responses_1.sendError)(res, 'Invalid resource type. Use "image" or "video"', 400);
                return;
            }
            const result = await upload_service_1.UploadService.deleteFile(publicId, type);
            if (result.success) {
                (0, responses_1.sendSuccess)(res, 'File deleted successfully', result.data);
            }
            else {
                (0, responses_1.sendError)(res, result.error, 500, result.details);
            }
        }
        catch (error) {
            (0, responses_1.sendError)(res, 'File deletion failed', 500, error);
        }
    }
    static async getFileDetails(req, res) {
        try {
            const { publicId } = req.params;
            const { resourceType } = req.query;
            if (!publicId) {
                (0, responses_1.sendError)(res, 'Public ID is required', 400);
                return;
            }
            const validResourceTypes = ['image', 'video'];
            const type = resourceType || 'image';
            if (!validResourceTypes.includes(type)) {
                (0, responses_1.sendError)(res, 'Invalid resource type. Use "image" or "video"', 400);
                return;
            }
            const result = await upload_service_1.UploadService.getFileDetails(publicId, type);
            if (result.success) {
                (0, responses_1.sendSuccess)(res, 'File details retrieved successfully', result.data);
            }
            else {
                (0, responses_1.sendError)(res, result.error, 404, result.details);
            }
        }
        catch (error) {
            (0, responses_1.sendError)(res, 'Failed to get file details', 500, error);
        }
    }
    static async generateSignedUrl(req, res) {
        try {
            const { publicId } = req.params;
            const { transformation } = req.body;
            if (!publicId) {
                (0, responses_1.sendError)(res, 'Public ID is required', 400);
                return;
            }
            const result = await upload_service_1.UploadService.generateSignedUrl(publicId, transformation);
            if (result.success) {
                (0, responses_1.sendSuccess)(res, 'Signed URL generated successfully', result.data);
            }
            else {
                (0, responses_1.sendError)(res, result.error, 500, result.details);
            }
        }
        catch (error) {
            (0, responses_1.sendError)(res, 'Failed to generate signed URL', 500, error);
        }
    }
    static async deleteMultipleFiles(req, res) {
        try {
            const { publicIds, resourceType } = req.body;
            if (!publicIds || !Array.isArray(publicIds) || publicIds.length === 0) {
                (0, responses_1.sendError)(res, 'Array of public IDs is required', 400);
                return;
            }
            const validResourceTypes = ['image', 'video'];
            const type = resourceType || 'image';
            if (!validResourceTypes.includes(type)) {
                (0, responses_1.sendError)(res, 'Invalid resource type. Use "image" or "video"', 400);
                return;
            }
            if (publicIds.length > 50) {
                (0, responses_1.sendError)(res, 'Maximum 50 files can be deleted at once', 400);
                return;
            }
            const result = await upload_service_1.UploadService.deleteMultipleFiles(publicIds, type);
            if (result.success) {
                (0, responses_1.sendSuccess)(res, 'Batch delete completed', result.data);
            }
            else {
                (0, responses_1.sendError)(res, result.error, 500, result.details);
            }
        }
        catch (error) {
            (0, responses_1.sendError)(res, 'Batch delete failed', 500, error);
        }
    }
    static async getUploadStats(req, res) {
        try {
            const stats = {
                totalUploads: 0,
                totalSize: '0 MB',
                audioFiles: 0,
                imageFiles: 0,
                message: 'Upload statistics not yet implemented'
            };
            (0, responses_1.sendSuccess)(res, 'Upload statistics retrieved', stats);
        }
        catch (error) {
            (0, responses_1.sendError)(res, 'Failed to get upload statistics', 500, error);
        }
    }
    static async uploadHealthCheck(req, res) {
        try {
            const isConfigured = !!(process.env.CLOUDINARY_CLOUD_NAME &&
                process.env.CLOUDINARY_API_KEY &&
                process.env.CLOUDINARY_API_SECRET);
            if (isConfigured) {
                (0, responses_1.sendSuccess)(res, 'Upload service is healthy', {
                    status: 'healthy',
                    cloudinary: 'configured',
                    timestamp: new Date().toISOString()
                });
            }
            else {
                (0, responses_1.sendError)(res, 'Upload service not configured', 503, {
                    status: 'unhealthy',
                    cloudinary: 'not configured',
                    message: 'Cloudinary environment variables missing'
                });
            }
        }
        catch (error) {
            (0, responses_1.sendError)(res, 'Upload health check failed', 500, error);
        }
    }
}
exports.UploadController = UploadController;
//# sourceMappingURL=upload.controller.js.map