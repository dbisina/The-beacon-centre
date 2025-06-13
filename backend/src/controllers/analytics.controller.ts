// backend/src/controllers/analytics.controller.ts
import { Request, Response } from 'express';
import { AnalyticsService } from '../services/analytics.service';
import { sendSuccess, sendError } from '../utils/responses';
import { AnalyticsTrackingRequest, DeviceSessionRequest } from '../types';

export class AnalyticsController {
  static async trackInteraction(req: Request, res: Response): Promise<void> {
    try {
      const data: AnalyticsTrackingRequest = req.body;

      if (!data.deviceId || !data.contentType || !data.contentId || !data.interactionType) {
        sendError(res, 'Missing required fields', 400);
        return;
      }

      const result = await AnalyticsService.trackInteraction(data);

      if (result.success) {
        sendSuccess(res, 'Interaction tracked successfully', result.data);
      } else {
        sendError(res, result.error, 400, result.details);
      }
    } catch (error) {
      sendError(res, 'Failed to track interaction', 500, error);
    }
  }

  static async trackSession(req: Request, res: Response): Promise<void> {
    try {
      const data: DeviceSessionRequest = req.body;

      if (!data.deviceId) {
        sendError(res, 'Device ID is required', 400);
        return;
      }

      const result = await AnalyticsService.trackSession(data);

      if (result.success) {
        sendSuccess(res, 'Session tracked successfully', result.data);
      } else {
        sendError(res, result.error, 400, result.details);
      }
    } catch (error) {
      sendError(res, 'Failed to track session', 500, error);
    }
  }

  static async getDashboard(req: Request, res: Response): Promise<void> {
    try {
      const result = await AnalyticsService.getDashboard();

      if (result.success) {
        sendSuccess(res, 'Analytics dashboard retrieved successfully', result.data);
      } else {
        sendError(res, result.error, 500, result.details);
      }
    } catch (error) {
      sendError(res, 'Failed to retrieve analytics dashboard', 500, error);
    }
  }

  static async getContentPerformance(req: Request, res: Response): Promise<void> {
    try {
      const { contentType, days = 30 } = req.query;
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(days as string));

      const { prisma } = await import('../config/database');
      
      const where: any = {
        createdAt: { gte: daysAgo },
      };

      if (contentType) {
        where.contentType = contentType;
      }

      const performance = await prisma.contentInteraction.groupBy({
        by: ['contentType', 'contentId', 'interactionType'],
        _count: { id: true },
        where,
        orderBy: { _count: { id: 'desc' } },
      });

      sendSuccess(res, 'Content performance retrieved successfully', performance);
    } catch (error) {
      sendError(res, 'Failed to retrieve content performance', 500, error);
    }
  }

  static async getUserEngagement(req: Request, res: Response): Promise<void> {
    try {
      const { days = 30 } = req.query;
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(days as string));

      const { prisma } = await import('../config/database');
      
      const engagement = await prisma.contentInteraction.groupBy({
        by: ['deviceId'],
        _count: { id: true },
        where: { createdAt: { gte: daysAgo } },
        orderBy: { _count: { id: 'desc' } },
        take: 100,
      });

      const stats = {
        totalActiveUsers: engagement.length,
        averageInteractionsPerUser: engagement.length > 0 
          ? engagement.reduce((sum, user) => sum + user._count.id, 0) / engagement.length 
          : 0,
        topUsers: engagement.slice(0, 10),
      };

      sendSuccess(res, 'User engagement retrieved successfully', stats);
    } catch (error) {
      sendError(res, 'Failed to retrieve user engagement', 500, error);
    }
  }

  static async getPopularContent(req: Request, res: Response): Promise<void> {
    try {
      const { contentType, days = 30, limit = 10 } = req.query;
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(days as string));

      const { prisma } = await import('../config/database');
      
      const where: any = {
        createdAt: { gte: daysAgo },
      };

      if (contentType) {
        where.contentType = contentType;
      }

      const popular = await prisma.contentInteraction.groupBy({
        by: ['contentType', 'contentId'],
        _count: { id: true },
        where,
        orderBy: { _count: { id: 'desc' } },
        take: parseInt(limit as string),
      });

      sendSuccess(res, 'Popular content retrieved successfully', popular);
    } catch (error) {
      sendError(res, 'Failed to retrieve popular content', 500, error);
    }
  }
}