// backend/src/routes/videoSermon.routes.ts
import { Router } from 'express';
import { VideoSermonController } from '../controllers/videoSermon.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Public routes - no authentication required (for mobile app)
router.get('/', VideoSermonController.getAllVideoSermons);
router.get('/featured', VideoSermonController.getFeaturedVideoSermons);
router.get('/category/:categoryId', VideoSermonController.getVideoSermonsByCategory);
router.get('/:id', VideoSermonController.getVideoSermonById);

// Protected admin routes
router.post('/', authenticate, VideoSermonController.createVideoSermon);
router.put('/:id', authenticate, VideoSermonController.updateVideoSermon);
router.delete('/:id', authenticate, VideoSermonController.deleteVideoSermon);
router.patch('/:id/featured', authenticate, VideoSermonController.toggleFeatured);
router.get('/admin/stats', authenticate, VideoSermonController.getVideoSermonStats);

export default router;