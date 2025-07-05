"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsController = void 0;
const analytics_service_1 = require("../services/analytics.service");
const responses_1 = require("../utils/responses");
class AnalyticsController {
    static async trackInteraction(req, res) {
        try {
            const trackingData = req.body;
            if (!trackingData.deviceId || !trackingData.contentType || !trackingData.contentId || !trackingData.interactionType) {
                (0, responses_1.sendError)(res, 'Missing required tracking data', 400);
                return;
            }
            const result = await analytics_service_1.AnalyticsService.trackInteraction(trackingData);
            if (result.success) {
                (0, responses_1.sendSuccess)(res, 'Interaction tracked successfully', result.data);
            }
            else {
                (0, responses_1.sendError)(res, result.error, 400, result.details);
            }
        }
        catch (error) {
            (0, responses_1.sendError)(res, 'Failed to track interaction', 500, error);
        }
    }
    static async trackSession(req, res) {
        try {
            const sessionData = req.body;
            if (!sessionData.deviceId) {
                (0, responses_1.sendError)(res, 'Device ID is required', 400);
                return;
            }
            const result = await analytics_service_1.AnalyticsService.trackSession(sessionData);
            if (result.success) {
                (0, responses_1.sendSuccess)(res, 'Session tracked successfully', result.data);
            }
            else {
                (0, responses_1.sendError)(res, result.error, 400, result.details);
            }
        }
        catch (error) {
            (0, responses_1.sendError)(res, 'Failed to track session', 500, error);
        }
    }
    static async getDashboard(req, res) {
        try {
            console.log('📊 Dashboard request from admin:', req.admin?.email || 'Unknown');
            const result = await analytics_service_1.AnalyticsService.getDashboardData();
            if (result.success) {
                console.log('✅ Dashboard data retrieved successfully');
                (0, responses_1.sendSuccess)(res, 'Dashboard data retrieved successfully', result.data);
            }
            else {
                console.warn('⚠️ Analytics service failed, but we should never reach here due to fallbacks');
                (0, responses_1.sendError)(res, result.error, 500, result.details);
            }
        }
        catch (error) {
            console.error('❌ Dashboard endpoint error:', error);
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
            (0, responses_1.sendSuccess)(res, 'Dashboard data retrieved (emergency fallback)', emergencyData);
        }
    }
    static async getContentPerformance(req, res) {
        try {
            const { contentType, startDate, endDate, limit } = req.query;
            const result = await analytics_service_1.AnalyticsService.getContentPerformance({
                contentType: contentType,
                startDate: startDate,
                endDate: endDate,
                limit: limit ? parseInt(limit) : undefined,
            });
            if (result.success) {
                (0, responses_1.sendSuccess)(res, 'Content performance data retrieved successfully', result.data);
            }
            else {
                (0, responses_1.sendError)(res, result.error, 400, result.details);
            }
        }
        catch (error) {
            (0, responses_1.sendError)(res, 'Failed to get content performance', 500, error);
        }
    }
    static async getUserEngagement(req, res) {
        try {
            const { startDate, endDate } = req.query;
            const result = await analytics_service_1.AnalyticsService.getUserEngagement({
                startDate: startDate,
                endDate: endDate,
            });
            if (result.success) {
                (0, responses_1.sendSuccess)(res, 'User engagement data retrieved successfully', result.data);
            }
            else {
                (0, responses_1.sendError)(res, result.error, 400, result.details);
            }
        }
        catch (error) {
            (0, responses_1.sendError)(res, 'Failed to get user engagement', 500, error);
        }
    }
    static async getPopularContent(req, res) {
        try {
            const { contentType, timeframe, limit } = req.query;
            const result = await analytics_service_1.AnalyticsService.getPopularContent({
                contentType: contentType,
                timeframe: timeframe,
                limit: limit ? parseInt(limit) : undefined,
            });
            if (result.success) {
                (0, responses_1.sendSuccess)(res, 'Popular content data retrieved successfully', result.data);
            }
            else {
                (0, responses_1.sendError)(res, result.error, 400, result.details);
            }
        }
        catch (error) {
            (0, responses_1.sendError)(res, 'Failed to get popular content', 500, error);
        }
    }
}
exports.AnalyticsController = AnalyticsController;
//# sourceMappingURL=analytics.controller.js.map