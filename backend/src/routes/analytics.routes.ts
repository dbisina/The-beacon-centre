// backend/src/routes/analytics.routes.ts
import { Router } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Public route for mobile app analytics tracking
router.post('/track', AnalyticsController.trackInteraction);
router.post('/session', AnalyticsController.trackSession);

// Protected admin routes for analytics dashboard
router.get('/dashboard', authenticate, AnalyticsController.getDashboard);
router.get('/content-performance', authenticate, AnalyticsController.getContentPerformance);
router.get('/user-engagement', authenticate, AnalyticsController.getUserEngagement);
router.get('/popular-content', authenticate, AnalyticsController.getPopularContent);

export default router;