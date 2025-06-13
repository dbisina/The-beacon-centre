// backend/src/routes/announcement.routes.ts
import { Router } from 'express';
import { AnnouncementController } from '../controllers/announcement.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Public routes - no authentication required (for mobile app)
router.get('/', AnnouncementController.getAllAnnouncements);
router.get('/active', AnnouncementController.getActiveAnnouncements);
router.get('/:id', AnnouncementController.getAnnouncementById);

// Protected admin routes
router.post('/', authenticate, AnnouncementController.createAnnouncement);
router.put('/:id', authenticate, AnnouncementController.updateAnnouncement);
router.delete('/:id', authenticate, AnnouncementController.deleteAnnouncement);
router.patch('/:id/activate', authenticate, AnnouncementController.toggleActive);
router.get('/admin/stats', authenticate, AnnouncementController.getAnnouncementStats);

export default router;