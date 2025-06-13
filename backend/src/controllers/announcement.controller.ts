// backend/src/controllers/announcement.controller.ts
import { Request, Response } from 'express';
import { AnnouncementService } from '../services/announcement.service';
import { sendSuccess, sendError } from '../utils/responses';
import { CreateAnnouncementRequest, UpdateAnnouncementRequest, AnnouncementFilters } from '../types';

export class AnnouncementController {
  static async getAllAnnouncements(req: Request, res: Response): Promise<void> {
    try {
      const filters: AnnouncementFilters = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
        search: req.query.search as string,
        priority: req.query.priority as 'LOW' | 'MEDIUM' | 'HIGH',
        isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : true,
        isExpired: req.query.isExpired ? req.query.isExpired === 'true' : false,
        sortBy: (req.query.sortBy as string) || 'createdAt',
        sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
      };

      const result = await AnnouncementService.getAllAnnouncements(filters);

      if (result.success) {
        sendSuccess(res, 'Announcements retrieved successfully', result.data);
      } else {
        sendError(res, result.error, 500, result.details);
      }
    } catch (error) {
      sendError(res, 'Failed to retrieve announcements', 500, error);
    }
  }

  static async getActiveAnnouncements(req: Request, res: Response): Promise<void> {
    try {
      const result = await AnnouncementService.getActiveAnnouncements();

      if (result.success) {
        sendSuccess(res, 'Active announcements retrieved successfully', result.data);
      } else {
        sendError(res, result.error, 500, result.details);
      }
    } catch (error) {
      sendError(res, 'Failed to retrieve active announcements', 500, error);
    }
  }

  static async getAnnouncementById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        sendError(res, 'Invalid announcement ID', 400);
        return;
      }

      const result = await AnnouncementService.getAnnouncementById(id);

      if (result.success) {
        sendSuccess(res, 'Announcement retrieved successfully', result.data);
      } else {
        const statusCode = result.error === 'Announcement not found' ? 404 : 500;
        sendError(res, result.error, statusCode, result.details);
      }
    } catch (error) {
      sendError(res, 'Failed to retrieve announcement', 500, error);
    }
  }

  static async createAnnouncement(req: Request, res: Response): Promise<void> {
    try {
      const announcementData: CreateAnnouncementRequest = req.body;

      // Basic validation
      if (!announcementData.title || !announcementData.content || !announcementData.startDate) {
        sendError(res, 'Missing required fields: title, content, and startDate', 400);
        return;
      }

      const result = await AnnouncementService.createAnnouncement(announcementData);

      if (result.success) {
        sendSuccess(res, 'Announcement created successfully', result.data, 201);
      } else {
        sendError(res, result.error, 400, result.details);
      }
    } catch (error) {
      sendError(res, 'Failed to create announcement', 500, error);
    }
  }

  static async updateAnnouncement(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const updateData: UpdateAnnouncementRequest = req.body;

      if (isNaN(id)) {
        sendError(res, 'Invalid announcement ID', 400);
        return;
      }

      const result = await AnnouncementService.updateAnnouncement(id, updateData);

      if (result.success) {
        sendSuccess(res, 'Announcement updated successfully', result.data);
      } else {
        const statusCode = result.error === 'Announcement not found' ? 404 : 400;
        sendError(res, result.error, statusCode, result.details);
      }
    } catch (error) {
      sendError(res, 'Failed to update announcement', 500, error);
    }
  }

  static async deleteAnnouncement(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        sendError(res, 'Invalid announcement ID', 400);
        return;
      }

      const result = await AnnouncementService.deleteAnnouncement(id);

      if (result.success) {
        sendSuccess(res, 'Announcement deleted successfully', result.data);
      } else {
        const statusCode = result.error === 'Announcement not found' ? 404 : 500;
        sendError(res, result.error, statusCode, result.details);
      }
    } catch (error) {
      sendError(res, 'Failed to delete announcement', 500, error);
    }
  }

  static async toggleActive(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        sendError(res, 'Invalid announcement ID', 400);
        return;
      }

      const result = await AnnouncementService.toggleActive(id);

      if (result.success) {
        sendSuccess(res, 'Active status updated successfully', result.data);
      } else {
        const statusCode = result.error === 'Announcement not found' ? 404 : 500;
        sendError(res, result.error, statusCode, result.details);
      }
    } catch (error) {
      sendError(res, 'Failed to toggle active status', 500, error);
    }
  }

  static async getAnnouncementStats(req: Request, res: Response): Promise<void> {
    try {
      const { prisma } = await import('../config/database');
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

      sendSuccess(res, 'Announcement statistics retrieved successfully', stats);
    } catch (error) {
      sendError(res, 'Failed to retrieve announcement statistics', 500, error);
    }
  }
}