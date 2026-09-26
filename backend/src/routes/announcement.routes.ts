// backend/src/routes/announcement.routes.ts
import { Router } from 'express';
import { AnnouncementController } from '../controllers/announcement.controller';
import { authenticate, requireContentAccess } from '../middleware/auth.middleware';
import { viewerAuth } from '../middleware/viewerAuth';

const router = Router();

// Public reads - scoped to what the reader may see (see audienceWhere)
router.get('/', viewerAuth, AnnouncementController.getAllAnnouncements);
router.get('/active', viewerAuth, AnnouncementController.getActiveAnnouncements);
router.get('/:id', viewerAuth, AnnouncementController.getAnnouncementById);

// Protected admin routes
router.post('/', authenticate, requireContentAccess, AnnouncementController.createAnnouncement);
router.put('/:id', authenticate, requireContentAccess, AnnouncementController.updateAnnouncement);
router.delete('/:id', authenticate, requireContentAccess, AnnouncementController.deleteAnnouncement);
router.patch('/:id/activate', authenticate, requireContentAccess, AnnouncementController.toggleActive);
router.get('/admin/stats', authenticate, requireContentAccess, AnnouncementController.getAnnouncementStats);

export default router;