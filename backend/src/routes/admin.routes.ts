// backend/src/routes/admin.routes.ts
import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { authenticate, requireSuperAdmin } from '../middleware/auth.middleware';

const router = Router();

// Auth routes
router.post('/auth/login', AdminController.login);
router.post('/auth/refresh', AdminController.refreshToken);
router.post('/auth/logout', authenticate, AdminController.logout);
router.get('/auth/me', authenticate, AdminController.getProfile);
router.put('/me', authenticate, AdminController.updateSelf);

// Admin-account management (SUPER_ADMIN only - creating/editing/deleting admin
// accounts, including assigning CSG_ADMIN + csgId to make someone a CSG admin)
router.post('/create', authenticate, requireSuperAdmin, AdminController.createAdmin);
router.get('/', authenticate, requireSuperAdmin, AdminController.getAllAdmins);
router.put('/:id', authenticate, requireSuperAdmin, AdminController.updateAdmin);
router.delete('/:id', authenticate, requireSuperAdmin, AdminController.deleteAdmin);

export default router;