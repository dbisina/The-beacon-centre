"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VideoSermonController = void 0;
const videoSermon_service_1 = require("../services/videoSermon.service");
const responses_1 = require("../utils/responses");
class VideoSermonController {
    static async getAllVideoSermons(req, res) {
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
            const result = await videoSermon_service_1.VideoSermonService.getAllVideoSermons(filters);
            if (result.success) {
                (0, responses_1.sendSuccess)(res, 'Video sermons retrieved successfully', result.data);
            }
            else {
                (0, responses_1.sendError)(res, result.error, 500, result.details);
            }
        }
        catch (error) {
            (0, responses_1.sendError)(res, 'Failed to retrieve video sermons', 500, error);
        }
    }
    static async getVideoSermonById(req, res) {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) {
                (0, responses_1.sendError)(res, 'Invalid video sermon ID', 400);
                return;
            }
            const result = await videoSermon_service_1.VideoSermonService.getVideoSermonById(id);
            if (result.success) {
                (0, responses_1.sendSuccess)(res, 'Video sermon retrieved successfully', result.data);
            }
            else {
                const statusCode = result.error === 'Video sermon not found' ? 404 : 500;
                (0, responses_1.sendError)(res, result.error, statusCode, result.details);
            }
        }
        catch (error) {
            (0, responses_1.sendError)(res, 'Failed to retrieve video sermon', 500, error);
        }
    }
    static async getFeaturedVideoSermons(req, res) {
        try {
            const limit = parseInt(req.query.limit) || 10;
            const result = await videoSermon_service_1.VideoSermonService.getFeaturedVideoSermons(limit);
            if (result.success) {
                (0, responses_1.sendSuccess)(res, 'Featured video sermons retrieved successfully', result.data);
            }
            else {
                (0, responses_1.sendError)(res, result.error, 500, result.details);
            }
        }
        catch (error) {
            (0, responses_1.sendError)(res, 'Failed to retrieve featured video sermons', 500, error);
        }
    }
    static async getVideoSermonsByCategory(req, res) {
        try {
            const categoryId = parseInt(req.params.categoryId);
            const limit = parseInt(req.query.limit) || 10;
            if (isNaN(categoryId)) {
                (0, responses_1.sendError)(res, 'Invalid category ID', 400);
                return;
            }
            const result = await videoSermon_service_1.VideoSermonService.getVideoSermonsByCategory(categoryId, limit);
            if (result.success) {
                (0, responses_1.sendSuccess)(res, 'Video sermons by category retrieved successfully', result.data);
            }
            else {
                (0, responses_1.sendError)(res, result.error, 500, result.details);
            }
        }
        catch (error) {
            (0, responses_1.sendError)(res, 'Failed to retrieve video sermons by category', 500, error);
        }
    }
    static async createVideoSermon(req, res) {
        try {
            const sermonData = req.body;
            if (!sermonData.title || !sermonData.speaker || !sermonData.youtubeId) {
                (0, responses_1.sendError)(res, 'Missing required fields: title, speaker, and youtubeId', 400);
                return;
            }
            const result = await videoSermon_service_1.VideoSermonService.createVideoSermon(sermonData);
            if (result.success) {
                (0, responses_1.sendSuccess)(res, 'Video sermon created successfully', result.data, 201);
            }
            else {
                (0, responses_1.sendError)(res, result.error, 400, result.details);
            }
        }
        catch (error) {
            (0, responses_1.sendError)(res, 'Failed to create video sermon', 500, error);
        }
    }
    static async updateVideoSermon(req, res) {
        try {
            const id = parseInt(req.params.id);
            const updateData = req.body;
            if (isNaN(id)) {
                (0, responses_1.sendError)(res, 'Invalid video sermon ID', 400);
                return;
            }
            const result = await videoSermon_service_1.VideoSermonService.updateVideoSermon(id, updateData);
            if (result.success) {
                (0, responses_1.sendSuccess)(res, 'Video sermon updated successfully', result.data);
            }
            else {
                const statusCode = result.error === 'Video sermon not found' ? 404 : 400;
                (0, responses_1.sendError)(res, result.error, statusCode, result.details);
            }
        }
        catch (error) {
            (0, responses_1.sendError)(res, 'Failed to update video sermon', 500, error);
        }
    }
    static async deleteVideoSermon(req, res) {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) {
                (0, responses_1.sendError)(res, 'Invalid video sermon ID', 400);
                return;
            }
            const result = await videoSermon_service_1.VideoSermonService.deleteVideoSermon(id);
            if (result.success) {
                (0, responses_1.sendSuccess)(res, 'Video sermon deleted successfully', result.data);
            }
            else {
                const statusCode = result.error === 'Video sermon not found' ? 404 : 500;
                (0, responses_1.sendError)(res, result.error, statusCode, result.details);
            }
        }
        catch (error) {
            (0, responses_1.sendError)(res, 'Failed to delete video sermon', 500, error);
        }
    }
    static async toggleFeatured(req, res) {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) {
                (0, responses_1.sendError)(res, 'Invalid video sermon ID', 400);
                return;
            }
            const result = await videoSermon_service_1.VideoSermonService.toggleFeatured(id);
            if (result.success) {
                (0, responses_1.sendSuccess)(res, 'Featured status updated successfully', result.data);
            }
            else {
                const statusCode = result.error === 'Video sermon not found' ? 404 : 500;
                (0, responses_1.sendError)(res, result.error, statusCode, result.details);
            }
        }
        catch (error) {
            (0, responses_1.sendError)(res, 'Failed to toggle featured status', 500, error);
        }
    }
    static async getVideoSermonStats(req, res) {
        try {
            const result = await videoSermon_service_1.VideoSermonService.getVideoSermonStats();
            if (result.success) {
                (0, responses_1.sendSuccess)(res, 'Video sermon statistics retrieved successfully', result.data);
            }
            else {
                (0, responses_1.sendError)(res, result.error, 500, result.details);
            }
        }
        catch (error) {
            (0, responses_1.sendError)(res, 'Failed to retrieve video sermon statistics', 500, error);
        }
    }
}
exports.VideoSermonController = VideoSermonController;
//# sourceMappingURL=videoSermon.controller.js.map