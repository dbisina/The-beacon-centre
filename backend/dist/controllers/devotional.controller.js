"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DevotionalController = void 0;
const devotional_service_1 = require("../services/devotional.service");
const responses_1 = require("../utils/responses");
class DevotionalController {
    static async getAllDevotionals(req, res) {
        try {
            const filters = {
                page: parseInt(req.query.page) || 1,
                limit: parseInt(req.query.limit) || 10,
                search: req.query.search,
                startDate: req.query.startDate,
                endDate: req.query.endDate,
                sortBy: req.query.sortBy || 'date',
                sortOrder: req.query.sortOrder || 'desc',
            };
            const result = await devotional_service_1.DevotionalService.getAllDevotionals(filters);
            if (result.success) {
                (0, responses_1.sendSuccess)(res, 'Devotionals retrieved successfully', result.data);
            }
            else {
                (0, responses_1.sendError)(res, result.error, 500, result.details);
            }
        }
        catch (error) {
            (0, responses_1.sendError)(res, 'Failed to retrieve devotionals', 500, error);
        }
    }
    static async getDevotionalById(req, res) {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) {
                (0, responses_1.sendError)(res, 'Invalid devotional ID', 400);
                return;
            }
            const result = await devotional_service_1.DevotionalService.getDevotionalById(id);
            if (result.success) {
                (0, responses_1.sendSuccess)(res, 'Devotional retrieved successfully', result.data);
            }
            else {
                const statusCode = result.error === 'Devotional not found' ? 404 : 500;
                (0, responses_1.sendError)(res, result.error, statusCode, result.details);
            }
        }
        catch (error) {
            (0, responses_1.sendError)(res, 'Failed to retrieve devotional', 500, error);
        }
    }
    static async getDevotionalByDate(req, res) {
        try {
            const { date } = req.params;
            if (!date || isNaN(Date.parse(date))) {
                (0, responses_1.sendError)(res, 'Invalid date format', 400);
                return;
            }
            const result = await devotional_service_1.DevotionalService.getDevotionalByDate(date);
            if (result.success) {
                (0, responses_1.sendSuccess)(res, 'Devotional retrieved successfully', result.data);
            }
            else {
                const statusCode = result.error === 'No devotional found for this date' ? 404 : 500;
                (0, responses_1.sendError)(res, result.error, statusCode, result.details);
            }
        }
        catch (error) {
            (0, responses_1.sendError)(res, 'Failed to retrieve devotional', 500, error);
        }
    }
    static async getTodaysDevotional(req, res) {
        try {
            const result = await devotional_service_1.DevotionalService.getTodaysDevotional();
            if (result.success) {
                (0, responses_1.sendSuccess)(res, 'Today\'s devotional retrieved successfully', result.data);
            }
            else {
                const statusCode = result.error === 'No devotional available for today' ? 404 : 500;
                (0, responses_1.sendError)(res, result.error, statusCode, result.details);
            }
        }
        catch (error) {
            (0, responses_1.sendError)(res, 'Failed to retrieve today\'s devotional', 500, error);
        }
    }
    static async createDevotional(req, res) {
        try {
            const devotionalData = req.body;
            if (!devotionalData.title || !devotionalData.date || !devotionalData.verseText ||
                !devotionalData.verseReference || !devotionalData.content) {
                (0, responses_1.sendError)(res, 'Missing required fields', 400);
                return;
            }
            const result = await devotional_service_1.DevotionalService.createDevotional(devotionalData);
            if (result.success) {
                (0, responses_1.sendSuccess)(res, 'Devotional created successfully', result.data, 201);
            }
            else {
                const statusCode = result.error === 'A devotional already exists for this date' ? 409 : 500;
                (0, responses_1.sendError)(res, result.error, statusCode, result.details);
            }
        }
        catch (error) {
            (0, responses_1.sendError)(res, 'Failed to create devotional', 500, error);
        }
    }
    static async updateDevotional(req, res) {
        try {
            const id = parseInt(req.params.id);
            const updateData = req.body;
            if (isNaN(id)) {
                (0, responses_1.sendError)(res, 'Invalid devotional ID', 400);
                return;
            }
            const result = await devotional_service_1.DevotionalService.updateDevotional(id, updateData);
            if (result.success) {
                (0, responses_1.sendSuccess)(res, 'Devotional updated successfully', result.data);
            }
            else {
                const statusCode = result.error === 'Devotional not found' ? 404 : 500;
                (0, responses_1.sendError)(res, result.error, statusCode, result.details);
            }
        }
        catch (error) {
            (0, responses_1.sendError)(res, 'Failed to update devotional', 500, error);
        }
    }
    static async deleteDevotional(req, res) {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) {
                (0, responses_1.sendError)(res, 'Invalid devotional ID', 400);
                return;
            }
            const result = await devotional_service_1.DevotionalService.deleteDevotional(id);
            if (result.success) {
                (0, responses_1.sendSuccess)(res, 'Devotional deleted successfully', result.data);
            }
            else {
                const statusCode = result.error === 'Devotional not found' ? 404 : 500;
                (0, responses_1.sendError)(res, result.error, statusCode, result.details);
            }
        }
        catch (error) {
            (0, responses_1.sendError)(res, 'Failed to delete devotional', 500, error);
        }
    }
    static async bulkCreateDevotionals(req, res) {
        try {
            const { devotionals } = req.body;
            if (!Array.isArray(devotionals) || devotionals.length === 0) {
                (0, responses_1.sendError)(res, 'Invalid devotionals array', 400);
                return;
            }
            const result = await devotional_service_1.DevotionalService.bulkCreateDevotionals(devotionals);
            if (result.success) {
                (0, responses_1.sendSuccess)(res, 'Bulk creation completed', result.data);
            }
            else {
                (0, responses_1.sendError)(res, result.error, 500, result.details);
            }
        }
        catch (error) {
            (0, responses_1.sendError)(res, 'Failed to bulk create devotionals', 500, error);
        }
    }
}
exports.DevotionalController = DevotionalController;
//# sourceMappingURL=devotional.controller.js.map