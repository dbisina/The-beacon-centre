"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadService = void 0;
const cloudinary_1 = require("cloudinary");
const fs_1 = __importDefault(require("fs"));
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
class UploadService {
    static async uploadAudio(file) {
        try {
            if (!file) {
                return {
                    success: false,
                    error: 'No file provided',
                };
            }
            const allowedTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/m4a', 'audio/aac'];
            if (!allowedTypes.includes(file.mimetype)) {
                return {
                    success: false,
                    error: 'Invalid file type. Only audio files are allowed.',
                };
            }
            const maxSize = 100 * 1024 * 1024;
            if (file.size > maxSize) {
                return {
                    success: false,
                    error: 'File too large. Maximum size is 100MB.',
                };
            }
            const result = await cloudinary_1.v2.uploader.upload(file.path, {
                resource_type: 'video',
                folder: 'beacon-sermons/audio',
                use_filename: true,
                unique_filename: true,
                format: 'mp3',
                audio_codec: 'mp3',
                audio_frequency: 44100,
                bit_rate: '128k',
                tags: ['sermon', 'audio', 'beacon-centre'],
            });
            if (fs_1.default.existsSync(file.path)) {
                fs_1.default.unlinkSync(file.path);
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
        }
        catch (error) {
            if (file?.path && fs_1.default.existsSync(file.path)) {
                fs_1.default.unlinkSync(file.path);
            }
            return {
                success: false,
                error: 'Audio upload failed',
                details: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    static async uploadImage(file) {
        try {
            if (!file) {
                return {
                    success: false,
                    error: 'No file provided',
                };
            }
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
            if (!allowedTypes.includes(file.mimetype)) {
                return {
                    success: false,
                    error: 'Invalid file type. Only JPEG, PNG, and WebP images are allowed.',
                };
            }
            const maxSize = 10 * 1024 * 1024;
            if (file.size > maxSize) {
                return {
                    success: false,
                    error: 'File too large. Maximum size is 10MB.',
                };
            }
            const result = await cloudinary_1.v2.uploader.upload(file.path, {
                resource_type: 'image',
                folder: 'beacon-announcements',
                use_filename: true,
                unique_filename: true,
                transformation: [
                    { width: 1200, height: 800, crop: 'limit' },
                    { quality: 'auto:good' },
                    { format: 'auto' },
                ],
                tags: ['announcement', 'image', 'beacon-centre'],
            });
            if (fs_1.default.existsSync(file.path)) {
                fs_1.default.unlinkSync(file.path);
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
        }
        catch (error) {
            if (file?.path && fs_1.default.existsSync(file.path)) {
                fs_1.default.unlinkSync(file.path);
            }
            return {
                success: false,
                error: 'Image upload failed',
                details: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    static async uploadThumbnail(file) {
        try {
            if (!file) {
                return {
                    success: false,
                    error: 'No file provided',
                };
            }
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
            if (!allowedTypes.includes(file.mimetype)) {
                return {
                    success: false,
                    error: 'Invalid file type. Only JPEG, PNG, and WebP images are allowed.',
                };
            }
            const result = await cloudinary_1.v2.uploader.upload(file.path, {
                resource_type: 'image',
                folder: 'beacon-sermons/thumbnails',
                use_filename: true,
                unique_filename: true,
                transformation: [
                    { width: 640, height: 360, crop: 'fill', gravity: 'center' },
                    { quality: 'auto:good' },
                    { format: 'auto' },
                ],
                tags: ['thumbnail', 'sermon', 'beacon-centre'],
            });
            if (fs_1.default.existsSync(file.path)) {
                fs_1.default.unlinkSync(file.path);
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
        }
        catch (error) {
            if (file?.path && fs_1.default.existsSync(file.path)) {
                fs_1.default.unlinkSync(file.path);
            }
            return {
                success: false,
                error: 'Thumbnail upload failed',
                details: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    static async deleteFile(publicId, resourceType = 'image') {
        try {
            await cloudinary_1.v2.uploader.destroy(publicId, { resource_type: resourceType });
            return {
                success: true,
                data: { publicId },
            };
        }
        catch (error) {
            return {
                success: false,
                error: 'Failed to delete file',
                details: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    static async getFileDetails(publicId, resourceType = 'image') {
        try {
            const result = await cloudinary_1.v2.api.resource(publicId, { resource_type: resourceType });
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
        }
        catch (error) {
            return {
                success: false,
                error: 'Failed to get file details',
                details: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    static async generateSignedUrl(publicId, transformation) {
        try {
            const options = {
                sign_url: true,
                expires_at: Math.floor(Date.now() / 1000) + 3600,
            };
            if (transformation) {
                options.transformation = transformation;
            }
            const url = cloudinary_1.v2.url(publicId, options);
            return {
                success: true,
                data: { url },
            };
        }
        catch (error) {
            return {
                success: false,
                error: 'Failed to generate signed URL',
                details: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    static async extractYouTubeThumbnail(youtubeId) {
        try {
            const thumbnailUrl = `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`;
            const result = await cloudinary_1.v2.uploader.upload(thumbnailUrl, {
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
        }
        catch (error) {
            return {
                success: false,
                error: 'Failed to extract YouTube thumbnail',
                details: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    static async deleteMultipleFiles(publicIds, resourceType = 'image') {
        try {
            const results = {
                deleted: [],
                failed: [],
            };
            for (const publicId of publicIds) {
                try {
                    await cloudinary_1.v2.uploader.destroy(publicId, { resource_type: resourceType });
                    results.deleted.push(publicId);
                }
                catch (error) {
                    results.failed.push(publicId);
                }
            }
            return {
                success: true,
                data: results,
            };
        }
        catch (error) {
            return {
                success: false,
                error: 'Batch delete failed',
                details: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
}
exports.UploadService = UploadService;
//# sourceMappingURL=upload.service.js.map