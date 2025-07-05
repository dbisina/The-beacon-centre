"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadController = exports.uploadAny = exports.uploadImage = exports.uploadAudio = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const uploadDir = path_1.default.join(__dirname, '../../uploads');
if (!fs_1.default.existsSync(uploadDir)) {
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path_1.default.extname(file.originalname);
        cb(null, `${file.fieldname}-${uniqueSuffix}${extension}`);
    },
});
const audioFileFilter = (req, file, cb) => {
    const allowedTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/m4a', 'audio/aac'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new Error('Invalid file type. Only audio files are allowed.'));
    }
};
const imageFileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.'));
    }
};
exports.uploadAudio = (0, multer_1.default)({
    storage,
    fileFilter: audioFileFilter,
    limits: {
        fileSize: 100 * 1024 * 1024,
    },
});
exports.uploadImage = (0, multer_1.default)({
    storage,
    fileFilter: imageFileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024,
    },
});
exports.uploadAny = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: 100 * 1024 * 1024,
    },
});
const upload_service_1 = require("../services/upload.service");
const responses_1 = require("../utils/responses");
class UploadController {
    static async uploadAudio(req, res) {
        try {
            if (!req.file) {
                (0, responses_1.sendError)(res, 'No audio file provided', 400);
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
    static async deleteFile(req, res) {
        try {
            const { publicId } = req.params;
            const { resourceType } = req.query;
            if (!publicId) {
                (0, responses_1.sendError)(res, 'Public ID is required', 400);
                return;
            }
            const result = await upload_service_1.UploadService.deleteFile(publicId, resourceType || 'image');
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
            const result = await upload_service_1.UploadService.getFileDetails(publicId, resourceType || 'image');
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
    static async extractYouTubeThumbnail(req, res) {
        try {
            const { youtubeId } = req.body;
            if (!youtubeId) {
                (0, responses_1.sendError)(res, 'YouTube ID is required', 400);
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
}
exports.UploadController = UploadController;
//# sourceMappingURL=multer.js.map