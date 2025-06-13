// backend/src/routes/admin.routes.ts
import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Auth routes
router.post('/auth/login', AdminController.login);
router.post('/auth/refresh', AdminController.refreshToken);
router.post('/auth/logout', authenticate, AdminController.logout);
router.get('/auth/me', authenticate, AdminController.getProfile);

// Admin management routes (for super admins)
router.post('/create', authenticate, AdminController.createAdmin);
router.get('/', authenticate, AdminController.getAllAdmins);
router.put('/:id', authenticate, AdminController.updateAdmin);
router.delete('/:id', authenticate, AdminController.deleteAdmin);

export default router;