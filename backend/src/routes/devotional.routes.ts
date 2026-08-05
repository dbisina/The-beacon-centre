// backend/src/routes/devotional.routes.ts
import { Router } from 'express';
import { DevotionalController } from '../controllers/devotional.controller';
import { authenticate, requireContentAccess } from '../middleware/auth.middleware';

const router = Router();

// Public routes - no authentication required (for mobile app)
router.get('/', DevotionalController.getAllDevotionals);
router.get('/today', DevotionalController.getTodaysDevotional);
router.get('/date/:date', DevotionalController.getDevotionalByDate);
router.get('/:id', DevotionalController.getDevotionalById);

// Protected admin routes
router.post('/', authenticate, requireContentAccess, DevotionalController.createDevotional);
router.put('/:id', authenticate, requireContentAccess, DevotionalController.updateDevotional);
router.delete('/:id', authenticate, requireContentAccess, DevotionalController.deleteDevotional);
router.post('/bulk', authenticate, requireContentAccess, DevotionalController.bulkCreateDevotionals);

export default router;