// backend/src/routes/liveSchedule.routes.ts
import { Router } from 'express';
import { LiveScheduleController } from '../controllers/liveSchedule.controller';
import { authenticate, requireFullAccess } from '../middleware/auth.middleware';

const router = Router();

// Public routes - no authentication required (for mobile app)
router.get('/', LiveScheduleController.getAllLiveSchedules);
router.get('/:id', LiveScheduleController.getLiveScheduleById);

// Protected admin routes
router.post('/', authenticate, requireFullAccess, LiveScheduleController.createLiveSchedule);
router.put('/:id', authenticate, requireFullAccess, LiveScheduleController.updateLiveSchedule);
router.delete('/:id', authenticate, requireFullAccess, LiveScheduleController.deleteLiveSchedule);

export default router;
