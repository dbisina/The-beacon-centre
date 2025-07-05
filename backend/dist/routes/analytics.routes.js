"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const analytics_controller_1 = require("../controllers/analytics.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.post('/track', analytics_controller_1.AnalyticsController.trackInteraction);
router.post('/session', analytics_controller_1.AnalyticsController.trackSession);
router.get('/dashboard', auth_middleware_1.authenticate, analytics_controller_1.AnalyticsController.getDashboard);
router.get('/content-performance', auth_middleware_1.authenticate, analytics_controller_1.AnalyticsController.getContentPerformance);
router.get('/user-engagement', auth_middleware_1.authenticate, analytics_controller_1.AnalyticsController.getUserEngagement);
router.get('/popular-content', auth_middleware_1.authenticate, analytics_controller_1.AnalyticsController.getPopularContent);
exports.default = router;
//# sourceMappingURL=analytics.routes.js.map