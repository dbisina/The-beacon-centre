// backend/src/routes/project.routes.ts
import { Router } from 'express';
import { ProjectController } from '../controllers/project.controller';
import { authenticate, requireFullAccess } from '../middleware/auth.middleware';

const router = Router();

// Public routes - no authentication required (for mobile app)
router.get('/', ProjectController.getAllProjects);
router.get('/:id', ProjectController.getProjectById);

// Protected admin routes
router.post('/', authenticate, requireFullAccess, ProjectController.createProject);
router.put('/:id', authenticate, requireFullAccess, ProjectController.updateProject);
router.delete('/:id', authenticate, requireFullAccess, ProjectController.deleteProject);

export default router;
