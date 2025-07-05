"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AudioSermonController = void 0;
const audioSermon_service_1 = require("../services/audioSermon.service");
const upload_service_1 = require("../services/upload.service");
const responses_1 = require("../utils/responses");
class AudioSermonController {
    static async getAllAudioSermons(req, res) {
        try {
            const filters = {
                page: parseInt(req.query.page) || 1,
                limit: parseInt(req.query.limit) || 10,
                search: req.query.search,
                categoryId: req.query.categoryId ? parseInt(req.query.categoryId) : undefined,
                speaker: req.query.speaker,
                isFeatured: req.query.isFeatured ? req.query.isFeatured === 'true' : undefined,
                isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : true,
                startDate: req.query.startDate,
                endDate: req.query.endDate,
                sortBy: req.query.sortBy || 'createdAt',
                sortOrder: req.query.sortOrder || 'desc',
            };
            const result = await audioSermon_service_1.AudioSermonService.getAllAudioSermons(filters);
            if (result.success) {
                (0, responses_1.sendSuccess)(res, 'Audio sermons retrieved successfully', result.data);
            }
            else {
                (0, responses_1.sendError)(res, result.error, 500, result.details);
            }
        }
        catch (error) {
            (0, responses_1.sendError)(res, 'Failed to retrieve audio sermons', 500, error);
        }
    }
    static async getAudioSermonById(req, res) {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) {
                (0, responses_1.sendError)(res, 'Invalid audio sermon ID', 400);
                return;
            }
            const result = await audioSermon_service_1.AudioSermonService.getAudioSermonById(id);
            if (result.success) {
                (0, responses_1.sendSuccess)(res, 'Audio sermon retrieved successfully', result.data);
            }
            else {
                const statusCode = result.error === 'Audio sermon not found' ? 404 : 500;
                (0, responses_1.sendError)(res, result.error, statusCode, result.details);
            }
        }
        catch (error) {
            (0, responses_1.sendError)(res, 'Failed to retrieve audio sermon', 500, error);
        }
    }
    static async getFeaturedAudioSermons(req, res) {
        try {
            const limit = parseInt(req.query.limit) || 10;
            const result = await audioSermon_service_1.AudioSermonService.getFeaturedAudioSermons(limit);
            if (result.success) {
                (0, responses_1.sendSuccess)(res, 'Featured audio sermons retrieved successfully', result.data);
            }
            else {
                (0, responses_1.sendError)(res, result.error, 500, result.details);
            }
        }
        catch (error) {
            (0, responses_1.sendError)(res, 'Failed to retrieve featured audio sermons', 500, error);
        }
    }
    static async getAudioSermonsByCategory(req, res) {
        try {
            const categoryId = parseInt(req.params.categoryId);
            const limit = parseInt(req.query.limit) || 10;
            if (isNaN(categoryId)) {
                (0, responses_1.sendError)(res, 'Invalid category ID', 400);
                return;
            }
            const result = await audioSermon_service_1.AudioSermonService.getAudioSermonsByCategory(categoryId, limit);
            if (result.success) {
                (0, responses_1.sendSuccess)(res, 'Audio sermons by category retrieved successfully', result.data);
            }
            else {
                (0, responses_1.sendError)(res, result.error, 500, result.details);
            }
        }
        catch (error) {
            (0, responses_1.sendError)(res, 'Failed to retrieve audio sermons by category', 500, error);
        }
    }
    static async createAudioSermon(req, res) {
        try {
            const sermonData = req.body;
            if (!sermonData.title || !sermonData.speaker || !sermonData.audioUrl || !sermonData.cloudinaryPublicId) {
                (0, responses_1.sendError)(res, 'Missing required fields', 400);
                return;
            }
            const result = await audioSermon_service_1.AudioSermonService.createAudioSermon(sermonData);
            if (result.success) {
                (0, responses_1.sendSuccess)(res, 'Audio sermon created successfully', result.data, 201);
            }
            else {
                (0, responses_1.sendError)(res, result.error, 400, result.details);
            }
        }
        catch (error) {
            (0, responses_1.sendError)(res, 'Failed to create audio sermon', 500, error);
        }
    }
    static async createAudioSermonWithUpload(req, res) {
        try {
            if (!req.file) {
                (0, responses_1.sendError)(res, 'No audio file provided', 400);
                return;
            }
            const uploadResult = await upload_service_1.UploadService.uploadAudio(req.file);
            if (!uploadResult.success) {
                (0, responses_1.sendError)(res, uploadResult.error, 400, uploadResult.details);
                return;
            }
            const sermonData = {
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
            if (!sermonData.title || !sermonData.speaker) {
                await upload_service_1.UploadService.deleteFile(uploadResult.data.publicId, 'video');
                (0, responses_1.sendError)(res, 'Missing required fields: title and speaker', 400);
                return;
            }
            const result = await audioSermon_service_1.AudioSermonService.createAudioSermon(sermonData);
            if (result.success) {
                (0, responses_1.sendSuccess)(res, 'Audio sermon created successfully', {
                    ...result.data,
                    uploadInfo: uploadResult.data,
                }, 201);
            }
            else {
                await upload_service_1.UploadService.deleteFile(uploadResult.data.publicId, 'video');
                (0, responses_1.sendError)(res, result.error, 400, result.details);
            }
        }
        catch (error) {
            (0, responses_1.sendError)(res, 'Failed to create audio sermon with upload', 500, error);
        }
    }
    static async updateAudioSermon(req, res) {
        try {
            const id = parseInt(req.params.id);
            const updateData = req.body;
            if (isNaN(id)) {
                (0, responses_1.sendError)(res, 'Invalid audio sermon ID', 400);
                return;
            }
            const result = await audioSermon_service_1.AudioSermonService.updateAudioSermon(id, updateData);
            if (result.success) {
                (0, responses_1.sendSuccess)(res, 'Audio sermon updated successfully', result.data);
            }
            else {
                const statusCode = result.error === 'Audio sermon not found' ? 404 : 400;
                (0, responses_1.sendError)(res, result.error, statusCode, result.details);
            }
        }
        catch (error) {
            (0, responses_1.sendError)(res, 'Failed to update audio sermon', 500, error);
        }
    }
    static async deleteAudioSermon(req, res) {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) {
                (0, responses_1.sendError)(res, 'Invalid audio sermon ID', 400);
                return;
            }
            const result = await audioSermon_service_1.AudioSermonService.deleteAudioSermon(id);
            if (result.success) {
                (0, responses_1.sendSuccess)(res, 'Audio sermon deleted successfully', result.data);
            }
            else {
                const statusCode = result.error === 'Audio sermon not found' ? 404 : 500;
                (0, responses_1.sendError)(res, result.error, statusCode, result.details);
            }
        }
        catch (error) {
            (0, responses_1.sendError)(res, 'Failed to delete audio sermon', 500, error);
        }
    }
    static async toggleFeatured(req, res) {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) {
                (0, responses_1.sendError)(res, 'Invalid audio sermon ID', 400);
                return;
            }
            const result = await audioSermon_service_1.AudioSermonService.toggleFeatured(id);
            if (result.success) {
                (0, responses_1.sendSuccess)(res, 'Featured status updated successfully', result.data);
            }
            else {
                const statusCode = result.error === 'Audio sermon not found' ? 404 : 500;
                (0, responses_1.sendError)(res, result.error, statusCode, result.details);
            }
        }
        catch (error) {
            (0, responses_1.sendError)(res, 'Failed to toggle featured status', 500, error);
        }
    }
    static async getAudioSermonStats(req, res) {
        try {
            const result = await audioSermon_service_1.AudioSermonService.getAudioSermonStats();
            if (result.success) {
                (0, responses_1.sendSuccess)(res, 'Audio sermon statistics retrieved successfully', result.data);
            }
            else {
                (0, responses_1.sendError)(res, result.error, 500, result.details);
            }
        }
        catch (error) {
            (0, responses_1.sendError)(res, 'Failed to retrieve audio sermon statistics', 500, error);
        }
    }
}
exports.AudioSermonController = AudioSermonController;
//# sourceMappingURL=audioSermon.controller.js.map