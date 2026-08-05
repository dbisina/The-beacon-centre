// backend/src/routes/csg.routes.ts
import { Router } from 'express';
import { CsgController } from '../controllers/csg.controller';
import { authenticate, requireFullAccess, requireCsgAccess } from '../middleware/auth.middleware';
import { authenticateUser } from '../middleware/user.middleware';
import { AuthenticatedRequest } from '../types';

const router = Router();

// Shared helper for requireCsgAccess - the target CSG for these routes is
// always the :id route param.
const getCsgIdParam = (req: AuthenticatedRequest): number | undefined => {
  const id = parseInt(req.params.id);
  return isNaN(id) ? undefined : id;
};

// Public routes - no authentication required (for mobile app)
router.get('/', CsgController.getAllCsgs);

// Specific literal path declared before the generic /:id route below so it
// isn't swallowed by /:id matching "admin" as an id.
router.get('/admin/stats', authenticate, requireFullAccess, CsgController.getAdminStats);

router.get('/:id', CsgController.getCsgById);

// Mobile app routes - end-user (Firebase) auth
router.get('/:id/updates', authenticateUser, CsgController.getCsgUpdates);
router.post('/:id/join', authenticateUser, CsgController.joinCsg);
router.post('/:id/leave', authenticateUser, CsgController.leaveCsg);
router.post('/:id/rsvp', authenticateUser, CsgController.rsvp);

// Admin routes - CSG-scoped access (full-access roles, or the CSG's own CSG_ADMIN)
router.get('/:id/admin/members', authenticate, requireCsgAccess(getCsgIdParam), CsgController.getAdminMembers);
router.post('/:id/updates', authenticate, requireCsgAccess(getCsgIdParam), CsgController.createUpdate);
router.delete('/:id/members/:membershipId', authenticate, requireCsgAccess(getCsgIdParam), CsgController.removeMember);

// Admin routes - full access only (CSG entity CRUD)
router.post('/', authenticate, requireFullAccess, CsgController.createCsg);
router.put('/:id', authenticate, requireFullAccess, CsgController.updateCsg);
router.delete('/:id', authenticate, requireFullAccess, CsgController.deleteCsg);

export default router;
