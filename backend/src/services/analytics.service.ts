// backend/src/services/analytics.service.ts
import { prisma } from '../config/database';
import { ServiceResponse, AnalyticsTrackingRequest, DeviceSessionRequest } from '../types';

export class AnalyticsService {
  static async trackInteraction(data: AnalyticsTrackingRequest): Promise<ServiceResponse<{ tracked: boolean }>> {
    try {
      await prisma.contentInteraction.create({
        data: {
          deviceId: data.deviceId,
          contentType: data.contentType,
          contentId: data.contentId,
          interactionType: data.interactionType,
          durationSeconds: data.durationSeconds || null,
          metadata: data.metadata || {},
        },
      });

      return {
        success: true,
        data: { tracked: true },
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to track interaction',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async trackSession(data: DeviceSessionRequest): Promise<ServiceResponse<{ tracked: boolean }>> {
    try {
      // Upsert device session
      await prisma.deviceSession.upsert({
        where: { deviceId: data.deviceId },
        update: {
          lastActive: new Date(),
          totalSessions: { increment: 1 },
        },
        create: {
          deviceId: data.deviceId,
          platform: data.platform || null,
          appVersion: data.appVersion || null,
          country: data.country || null,
          totalSessions: 1,
        },
      });

      return {
        success: true,
        data: { tracked: true },
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to track session',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async getDashboard(): Promise<ServiceResponse<any>> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const [
        totalDevices,
        activeDevices,
        totalContent,
        totalInteractions,
        recentInteractions,
        devicesByPlatform,
        devicesByCountry,
        popularContent,
      ] = await Promise.all([
        // Total unique devices
        prisma.deviceSession.count(),
        
        // Active devices (last 30 days)
        prisma.deviceSession.count({
          where: { lastActive: { gte: thirtyDaysAgo } },
        }),
        
        // Total content count
        Promise.all([
          prisma.devotional.count(),
          prisma.videoSermon.count({ where: { isActive: true } }),
          prisma.audioSermon.count({ where: { isActive: true } }),
          prisma.announcement.count({ where: { isActive: true } }),
        ]).then(([devotionals, videos, audios, announcements]) => ({
          devotionals,
          videos,
          audios,
          announcements,
          total: devotionals + videos + audios + announcements,
        })),
        
        // Total interactions
        prisma.contentInteraction.count(),
        
        // Recent interactions (last 7 days)
        prisma.contentInteraction.count({
          where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
        }),
        
        // Devices by platform
        prisma.deviceSession.groupBy({
          by: ['platform'],
          _count: { deviceId: true },
          where: { platform: { not: null } },
        }),
        
        // Devices by country
        prisma.deviceSession.groupBy({
          by: ['country'],
          _count: { deviceId: true },
          where: { country: { not: null } },
          orderBy: { _count: { deviceId: 'desc' } },
          take: 10,
        }),
        
        // Popular content
        prisma.contentInteraction.groupBy({
          by: ['contentType', 'contentId'],
          _count: { id: true },
          where: { createdAt: { gte: thirtyDaysAgo } },
          orderBy: { _count: { id: 'desc' } },
          take: 10,
        }),
      ]);

      const dashboard = {
        overview: {
          totalDevices,
          activeDevices,
          totalContent,
          totalInteractions,
          recentInteractions,
        },
        demographics: {
          byPlatform: devicesByPlatform.map(item => ({
            platform: item.platform || 'Unknown',
            count: item._count.deviceId,
          })),
          byCountry: devicesByCountry.map(item => ({
            country: item.country || 'Unknown',
            count: item._count.deviceId,
          })),
        },
        popularContent: popularContent.map(item => ({
          contentType: item.contentType,
          contentId: item.contentId,
          views: item._count.id,
        })),
      };

      return {
        success: true,
        data: dashboard,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to get analytics dashboard',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
