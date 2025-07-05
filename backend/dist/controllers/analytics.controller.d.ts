import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../types';
export declare class AnalyticsController {
    static trackInteraction(req: Request, res: Response): Promise<void>;
    static trackSession(req: Request, res: Response): Promise<void>;
    static getDashboard(req: AuthenticatedRequest, res: Response): Promise<void>;
    static getContentPerformance(req: AuthenticatedRequest, res: Response): Promise<void>;
    static getUserEngagement(req: AuthenticatedRequest, res: Response): Promise<void>;
    static getPopularContent(req: AuthenticatedRequest, res: Response): Promise<void>;
}
//# sourceMappingURL=analytics.controller.d.ts.map