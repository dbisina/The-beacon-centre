// backend/src/controllers/analytics.controller.ts - ORIGINAL WORKING VERSION
import { Request, Response } from 'express';
import { AnalyticsService } from '../services/analytics.service';
import { sendSuccess, sendError } from '../utils/responses';
import { AnalyticsTrackingRequest, DeviceSessionRequest, AuthenticatedRequest } from '../types';

export class AnalyticsController {
  // Public endpoint for mobile app to track interactions
  static async trackInteraction(req: Request, res: Response): Promise<void> {
    try {
      const trackingData: AnalyticsTrackingRequest = req.body;

      // Basic validation
      if (!trackingData.deviceId || !trackingData.contentType || !trackingData.contentId || !trackingData.interactionType) {
        sendError(res, 'Missing required tracking data', 400);
        return;
      }

      const result = await AnalyticsService.trackInteraction(trackingData);

      if (result.success) {
        sendSuccess(res, 'Interaction tracked successfully', result.data);
      } else {
        sendError(res, result.error, 400, result.details);
      }
    } catch (error) {
      sendError(res, 'Failed to track interaction', 500, error);
    }
  }

  // Public endpoint for mobile app to track device sessions
  static async trackSession(req: Request, res: Response): Promise<void> {
    try {
      const sessionData: DeviceSessionRequest = req.body;

      if (!sessionData.deviceId) {
        sendError(res, 'Device ID is required', 400);
        return;
      }

      const result = await AnalyticsService.trackSession(sessionData);

      if (result.success) {
        sendSuccess(res, 'Session tracked successfully', result.data);
      } else {
        sendError(res, result.error, 400, result.details);
      }
    } catch (error) {
      sendError(res, 'Failed to track session', 500, error);
    }
  }

  // Protected endpoint for admin dashboard - ORIGINAL WORKING VERSION
  static async getDashboard(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      console.log('📊 Dashboard request from admin:', req.admin?.email || 'Unknown');
      
      const result = await AnalyticsService.getDashboardData();

      if (result.success) {
        console.log('✅ Dashboard data retrieved successfully');
        sendSuccess(res, 'Dashboard data retrieved successfully', result.data);
      } else {
        console.warn('⚠️ Analytics service failed, but we should never reach here due to fallbacks');
        // This should never happen because service always returns success with mock data
        sendError(res, result.error, 500, result.details);
      }
    } catch (error) {
      console.error('❌ Dashboard endpoint error:', error);
      
      // Emergency fallback - return minimal data structure
      const emergencyData = {
        totalDevices: 0,
        totalSessions: 0,
        totalInteractions: 0,
        totalDevotionsRead: 0,
        totalVideosWatched: 0,
        totalAudioPlayed: 0,
        activeDevicesLast30Days: 0,
        popularContent: [],
        devicePlatforms: { ios: 0, android: 0 },
        weeklyStats: [],
        monthlyGrowth: { current: 0, previous: 0, growth: 0 },
        topCategories: [],
        engagementMetrics: {
          averageSessionDuration: 0,
          returnUserRate: 0,
          contentCompletionRate: 0
        }
      };

      sendSuccess(res, 'Dashboard data retrieved (emergency fallback)', emergencyData);
    }
  }

  // Protected endpoint for content performance metrics
  static async getContentPerformance(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { contentType, startDate, endDate, limit } = req.query;
      
      const result = await AnalyticsService.getContentPerformance({
        contentType: contentType as string,
        startDate: startDate as string,
        endDate: endDate as string,
        limit: limit ? parseInt(limit as string) : undefined,
      });

      if (result.success) {
        sendSuccess(res, 'Content performance data retrieved successfully', result.data);
      } else {
        sendError(res, result.error, 400, result.details);
      }
    } catch (error) {
      sendError(res, 'Failed to get content performance', 500, error);
    }
  }

  // Protected endpoint for user engagement metrics
  static async getUserEngagement(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { startDate, endDate } = req.query;
      
      const result = await AnalyticsService.getUserEngagement({
        startDate: startDate as string,
        endDate: endDate as string,
      });

      if (result.success) {
        sendSuccess(res, 'User engagement data retrieved successfully', result.data);
      } else {
        sendError(res, result.error, 400, result.details);
      }
    } catch (error) {
      sendError(res, 'Failed to get user engagement', 500, error);
    }
  }

  // Protected endpoint for popular content metrics
  static async getPopularContent(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { contentType, timeframe, limit } = req.query;
      
      const result = await AnalyticsService.getPopularContent({
        contentType: contentType as string,
        timeframe: timeframe as string,
        limit: limit ? parseInt(limit as string) : undefined,
      });

      if (result.success) {
        sendSuccess(res, 'Popular content data retrieved successfully', result.data);
      } else {
        sendError(res, result.error, 400, result.details);
      }
    } catch (error) {
      sendError(res, 'Failed to get popular content', 500, error);
    }
  }
}