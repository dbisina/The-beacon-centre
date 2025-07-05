import { ContentType, InteractionType, ServiceResponse } from '../types';
export declare class AnalyticsService {
    static trackInteraction(data: {
        deviceId: string;
        contentType: ContentType;
        contentId: number;
        interactionType: InteractionType;
    }): Promise<ServiceResponse<any>>;
    static trackSession(data: {
        deviceId: string;
        platform?: string;
        appVersion?: string;
        country?: string;
    }): Promise<ServiceResponse<any>>;
    static getDashboardData(): Promise<ServiceResponse<any>>;
    private static getMockDashboardData;
    private static processDevicePlatforms;
    private static getWeeklyStats;
    private static getMonthlyGrowth;
    private static getTopCategories;
    private static getEngagementMetrics;
    static getContentPerformance(params: {
        contentType?: string;
        startDate?: string;
        endDate?: string;
        limit?: number;
    }): Promise<ServiceResponse<any>>;
    static getUserEngagement(params: {
        startDate?: string;
        endDate?: string;
    }): Promise<ServiceResponse<any>>;
    static getPopularContent(params: {
        contentType?: string;
        timeframe?: string;
        limit?: number;
    }): Promise<ServiceResponse<any>>;
}
//# sourceMappingURL=analytics.service.d.ts.map