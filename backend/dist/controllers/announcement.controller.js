"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnnouncementController = void 0;
const announcement_service_1 = require("../services/announcement.service");
const responses_1 = require("../utils/responses");
class AnnouncementController {
    static async getAllAnnouncements(req, res) {
        try {
            const filters = {
                page: parseInt(req.query.page) || 1,
                limit: parseInt(req.query.limit) || 10,
                search: req.query.search,
                priority: req.query.priority,
                isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : true,
                isExpired: req.query.isExpired ? req.query.isExpired === 'true' : false,
                sortBy: req.query.sortBy || 'createdAt',
                sortOrder: req.query.sortOrder || 'desc',
            };
            const result = await announcement_service_1.AnnouncementService.getAllAnnouncements(filters);
            if (result.success) {
                (0, responses_1.sendSuccess)(res, 'Announcements retrieved successfully', result.data);
            }
            else {
                (0, responses_1.sendError)(res, result.error, 500, result.details);
            }
        }
        catch (error) {
            (0, responses_1.sendError)(res, 'Failed to retrieve announcements', 500, error);
        }
    }
    static async getActiveAnnouncements(req, res) {
        try {
            const result = await announcement_service_1.AnnouncementService.getActiveAnnouncements();
            if (result.success) {
                (0, responses_1.sendSuccess)(res, 'Active announcements retrieved successfully', result.data);
            }
            else {
                (0, responses_1.sendError)(res, result.error, 500, result.details);
            }
        }
        catch (error) {
            (0, responses_1.sendError)(res, 'Failed to retrieve active announcements', 500, error);
        }
    }
    static async getAnnouncementById(req, res) {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) {
                (0, responses_1.sendError)(res, 'Invalid announcement ID', 400);
                return;
            }
            const result = await announcement_service_1.AnnouncementService.getAnnouncementById(id);
            if (result.success) {
                (0, responses_1.sendSuccess)(res, 'Announcement retrieved successfully', result.data);
            }
            else {
                const statusCode = result.error === 'Announcement not found' ? 404 : 500;
                (0, responses_1.sendError)(res, result.error, statusCode, result.details);
            }
        }
        catch (error) {
            (0, responses_1.sendError)(res, 'Failed to retrieve announcement', 500, error);
        }
    }
    static async createAnnouncement(req, res) {
        try {
            const announcementData = req.body;
            if (!announcementData.title || !announcementData.content || !announcementData.startDate) {
                (0, responses_1.sendError)(res, 'Missing required fields: title, content, and startDate', 400);
                return;
            }
            const result = await announcement_service_1.AnnouncementService.createAnnouncement(announcementData);
            if (result.success) {
                (0, responses_1.sendSuccess)(res, 'Announcement created successfully', result.data, 201);
            }
            else {
                (0, responses_1.sendError)(res, result.error, 400, result.details);
            }
        }
        catch (error) {
            (0, responses_1.sendError)(res, 'Failed to create announcement', 500, error);
        }
    }
    static async updateAnnouncement(req, res) {
        try {
            const id = parseInt(req.params.id);
            const updateData = req.body;
            if (isNaN(id)) {
                (0, responses_1.sendError)(res, 'Invalid announcement ID', 400);
                return;
            }
            const result = await announcement_service_1.AnnouncementService.updateAnnouncement(id, updateData);
            if (result.success) {
                (0, responses_1.sendSuccess)(res, 'Announcement updated successfully', result.data);
            }
            else {
                const statusCode = result.error === 'Announcement not found' ? 404 : 400;
                (0, responses_1.sendError)(res, result.error, statusCode, result.details);
            }
        }
        catch (error) {
            (0, responses_1.sendError)(res, 'Failed to update announcement', 500, error);
        }
    }
    static async deleteAnnouncement(req, res) {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) {
                (0, responses_1.sendError)(res, 'Invalid announcement ID', 400);
                return;
            }
            const result = await announcement_service_1.AnnouncementService.deleteAnnouncement(id);
            if (result.success) {
                (0, responses_1.sendSuccess)(res, 'Announcement deleted successfully', result.data);
            }
            else {
                const statusCode = result.error === 'Announcement not found' ? 404 : 500;
                (0, responses_1.sendError)(res, result.error, statusCode, result.details);
            }
        }
        catch (error) {
            (0, responses_1.sendError)(res, 'Failed to delete announcement', 500, error);
        }
    }
    static async toggleActive(req, res) {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) {
                (0, responses_1.sendError)(res, 'Invalid announcement ID', 400);
                return;
            }
            const result = await announcement_service_1.AnnouncementService.toggleActive(id);
            if (result.success) {
                (0, responses_1.sendSuccess)(res, 'Active status updated successfully', result.data);
            }
            else {
                const statusCode = result.error === 'Announcement not found' ? 404 : 500;
                (0, responses_1.sendError)(res, result.error, statusCode, result.details);
            }
        }
        catch (error) {
            (0, responses_1.sendError)(res, 'Failed to toggle active status', 500, error);
        }
    }
    static async getAnnouncementStats(req, res) {
        try {
            const { prisma } = await Promise.resolve().then(() => __importStar(require('../config/database')));
            const currentDate = new Date();
            const [total, active, expired, byPriority] = await Promise.all([
                prisma.announcement.count(),
                prisma.announcement.count({
                    where: {
                        isActive: true,
                        startDate: { lte: currentDate },
                        OR: [
                            { expiryDate: null },
                            { expiryDate: { gte: currentDate } },
                        ],
                    },
                }),
                prisma.announcement.count({
                    where: {
                        expiryDate: { lt: currentDate },
                    },
                }),
                prisma.announcement.groupBy({
                    by: ['priority'],
                    _count: { id: true },
                }),
            ]);
            const priorityStats = byPriority.map(stat => ({
                priority: stat.priority,
                count: stat._count.id,
            }));
            const stats = {
                total,
                active,
                expired,
                byPriority: priorityStats,
            };
            (0, responses_1.sendSuccess)(res, 'Announcement statistics retrieved successfully', stats);
        }
        catch (error) {
            (0, responses_1.sendError)(res, 'Failed to retrieve announcement statistics', 500, error);
        }
    }
}
exports.AnnouncementController = AnnouncementController;
//# sourceMappingURL=announcement.controller.js.map