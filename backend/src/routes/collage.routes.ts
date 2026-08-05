// backend/src/routes/collage.routes.ts
import { Router } from 'express';
import { CollageController } from '../controllers/collage.controller';
import { authenticate, requireContentAccess } from '../middleware/auth.middleware';

const router = Router();

// Public routes - no authentication required (for mobile app)
router.get('/today', CollageController.getToday);
router.get('/', CollageController.getAll);
router.get('/:id', CollageController.getById);

// Protected admin routes
router.post('/', authenticate, requireContentAccess, CollageController.create);
router.delete('/:id', authenticate, requireContentAccess, CollageController.delete);

export default router;
