// backend/src/routes/notify.routes.ts
import { Router } from 'express';
import { NotifyController } from '../controllers/notify.controller';
import { authenticate, requireFullAccess } from '../middleware/auth.middleware';

const router = Router();

// Admin-composed push notification broadcast - SUPER_ADMIN/ADMIN only.
router.post('/send', authenticate, requireFullAccess, NotifyController.sendNotification);

export default router;
