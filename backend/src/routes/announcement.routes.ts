// backend/src/routes/announcement.routes.ts
import { Router, Request, Response, NextFunction } from 'express';
import { AnnouncementController } from '../controllers/announcement.controller';
import { authenticate, requireContentAccess, optionalAuth } from '../middleware/auth.middleware';
import { optionalAuthenticateUser } from '../middleware/user.middleware';
import { AuthenticatedRequest } from '../types';

const router = Router();

/**
 * Identifies the reader without requiring one: an admin (sees everything), a
 * signed-in member (also sees their groups' notices), or a guest. The member
 * check only runs when there's no admin, so admin requests don't also go
 * through - and log a failure from - member token verification.
 */
const viewerAuth = (req: Request, res: Response, next: NextFunction) =>
  optionalAuth(req as AuthenticatedRequest, res, () => {
    if ((req as AuthenticatedRequest).admin) return next();
    return optionalAuthenticateUser(req, res, next);
  });

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