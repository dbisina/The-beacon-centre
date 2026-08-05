// backend/src/routes/videoSermon.routes.ts
import { Router } from 'express';
import { VideoSermonController } from '../controllers/videoSermon.controller';
import { authenticate, requireContentAccess } from '../middleware/auth.middleware';

const router = Router();

// Public routes - no authentication required (for mobile app)
router.get('/', VideoSermonController.getAllVideoSermons);
router.get('/featured', VideoSermonController.getFeaturedVideoSermons);
router.get('/category/:categoryId', VideoSermonController.getVideoSermonsByCategory);
router.get('/:id/comments', VideoSermonController.getComments);
router.get('/:id', VideoSermonController.getVideoSermonById);

// Protected admin routes
router.post('/', authenticate, requireContentAccess, VideoSermonController.createVideoSermon);
router.put('/:id', authenticate, requireContentAccess, VideoSermonController.updateVideoSermon);
router.delete('/:id', authenticate, requireContentAccess, VideoSermonController.deleteVideoSermon);
router.patch('/:id/featured', authenticate, requireContentAccess, VideoSermonController.toggleFeatured);
router.patch('/admin/bulk-kind', authenticate, requireContentAccess, VideoSermonController.bulkUpdateKind);
router.get('/admin/stats', authenticate, requireContentAccess, VideoSermonController.getVideoSermonStats);
router.get('/admin/series', authenticate, requireContentAccess, VideoSermonController.getDistinctSeries);
router.post('/admin/sync-youtube', authenticate, requireContentAccess, VideoSermonController.syncFromYoutube);

export default router;