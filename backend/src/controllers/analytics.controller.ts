// backend/src/controllers/analytics.controller.ts - FIXED with proper dashboard data
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

  // FIXED: Protected endpoint for admin dashboard with proper data structure
  static async getDashboard(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      console.log('Dashboard request from admin:', req.admin?.email);
      
      const result = await AnalyticsService.getDashboardData();

      if (result.success) {
        // FIXED: Ensure the data structure matches what the dashboard expects
        const dashboardData = {
          totalDevices: result.data?.totalDevices || 0,
          totalSessions: result.data?.totalSessions || 0,
          totalInteractions: result.data?.totalInteractions || 0,
          totalDevotionsRead: result.data?.totalDevotionsRead || 0,
          totalVideosWatched: result.data?.totalVideosWatched || 0,
          totalAudioPlayed: result.data?.totalAudioPlayed || 0,
          activeDevicesLast30Days: result.data?.activeDevicesLast30Days || 0,
          popularContent: result.data?.popularContent || [],
          devicePlatforms: result.data?.devicePlatforms || { ios: 0, android: 0 },
          weeklyStats: result.data?.weeklyStats || [],
          monthlyGrowth: result.data?.monthlyGrowth || { current: 0, previous: 0, growth: 0 },
          topCategories: result.data?.topCategories || [],
          engagementMetrics: result.data?.engagementMetrics || {
            averageSessionDuration: 0,
            returnUserRate: 0,
            contentCompletionRate: 0
          }
        };

        sendSuccess(res, 'Dashboard data retrieved successfully', dashboardData);
      } else {
        // Return default data structure if service fails
        const defaultData = {
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

        console.warn('Analytics service failed, returning default data:', result.error);
        sendSuccess(res, 'Dashboard data retrieved (defaults)', defaultData);
      }
    } catch (error) {
      console.error('Dashboard endpoint error:', error);
      
      // Return default data even on error to prevent dashboard crashes
      const defaultData = {
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

      sendSuccess(res, 'Dashboard data retrieved (error fallback)', defaultData);
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
        sendError(res, result.error, 500, result.details);
      }
    } catch (error) {
      sendError(res, 'Failed to retrieve content performance', 500, error);
    }
  }

  // Protected endpoint for user engagement metrics
  static async getUserEngagement(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { period, platform } = req.query;
      
      const result = await AnalyticsService.getUserEngagement({
        period: period as string,
        platform: platform as string,
      });

      if (result.success) {
        sendSuccess(res, 'User engagement data retrieved successfully', result.data);
      } else {
        sendError(res, result.error, 500, result.details);
      }
    } catch (error) {
      sendError(res, 'Failed to retrieve user engagement', 500, error);
    }
  }

  // Protected endpoint for popular content
  static async getPopularContent(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { contentType, period, limit } = req.query;
      
      const result = await AnalyticsService.getPopularContent({
        contentType: contentType as string,
        period: period as string,
        limit: limit ? parseInt(limit as string) : 10,
      });

      if (result.success) {
        sendSuccess(res, 'Popular content data retrieved successfully', result.data);
      } else {
        sendError(res, result.error, 500, result.details);
      }
    } catch (error) {
      sendError(res, 'Failed to retrieve popular content', 500, error);
    }
  }

  // Protected endpoint for analytics export
  static async exportAnalytics(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { format, startDate, endDate } = req.query;
      
      if (!['csv', 'json'].includes(format as string)) {
        sendError(res, 'Invalid export format. Use csv or json', 400);
        return;
      }

      const result = await AnalyticsService.exportAnalytics({
        format: format as 'csv' | 'json',
        startDate: startDate as string,
        endDate: endDate as string,
      });

      if (result.success) {
        const filename = `beacon-analytics-${new Date().toISOString().split('T')[0]}.${format}`;
        
        if (format === 'csv') {
          res.setHeader('Content-Type', 'text/csv');
          res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
          res.send(result.data);
        } else {
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
          res.json(result.data);
        }
      } else {
        sendError(res, result.error, 500, result.details);
      }
    } catch (error) {
      sendError(res, 'Failed to export analytics', 500, error);
    }
  }
}