// backend/src/routes/prayerRequest.routes.ts
import { Router } from 'express';
import { PrayerRequestController } from '../controllers/prayerRequest.controller';
import { authenticate, requireFullAccess } from '../middleware/auth.middleware';
import { optionalAuthenticateUser } from '../middleware/user.middleware';

const router = Router();

// Public (guest-friendly) submission - mobile app
router.post('/', optionalAuthenticateUser, PrayerRequestController.createPrayerRequest);

// Protected admin routes
router.get('/', authenticate, requireFullAccess, PrayerRequestController.getAllPrayerRequests);
router.patch('/:id/status', authenticate, requireFullAccess, PrayerRequestController.updateStatus);

export default router;
