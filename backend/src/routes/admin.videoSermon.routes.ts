// backend/src/routes/admin.videoSermon.routes.ts
import { Router } from 'express';
import { VideoSermonController } from '../controllers/videoSermon.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All admin video sermon routes require authentication
router.post('/', authenticate, VideoSermonController.createVideoSermon);
router.put('/:id', authenticate, VideoSermonController.updateVideoSermon);
router.delete('/:id', authenticate, VideoSermonController.deleteVideoSermon);
router.patch('/:id/featured', authenticate, VideoSermonController.toggleFeatured);
router.get('/stats', authenticate, VideoSermonController.getVideoSermonStats);

export default router;