// backend/src/routes/announcement.routes.ts
import { Router } from 'express';
import { AnnouncementController } from '../controllers/announcement.controller';
import { authenticate, requireContentAccess } from '../middleware/auth.middleware';

const router = Router();

// Public routes - no authentication required (for mobile app)
router.get('/', AnnouncementController.getAllAnnouncements);
router.get('/active', AnnouncementController.getActiveAnnouncements);
router.get('/:id', AnnouncementController.getAnnouncementById);

// Protected admin routes
router.post('/', authenticate, requireContentAccess, AnnouncementController.createAnnouncement);
router.put('/:id', authenticate, requireContentAccess, AnnouncementController.updateAnnouncement);
router.delete('/:id', authenticate, requireContentAccess, AnnouncementController.deleteAnnouncement);
router.patch('/:id/activate', authenticate, requireContentAccess, AnnouncementController.toggleActive);
router.get('/admin/stats', authenticate, requireContentAccess, AnnouncementController.getAnnouncementStats);

export default router;