// backend/src/routes/category.routes.ts
import { Router } from 'express';
import { CategoryController } from '../controllers/category.controller';
import { authenticate, requireContentAccess } from '../middleware/auth.middleware';

const router = Router();

// Public routes - no authentication required (for mobile app)
router.get('/', CategoryController.getAllCategories);
router.get('/:id', CategoryController.getCategoryById);

// Protected admin routes
router.post('/', authenticate, requireContentAccess, CategoryController.createCategory);
router.put('/:id', authenticate, requireContentAccess, CategoryController.updateCategory);
router.delete('/:id', authenticate, requireContentAccess, CategoryController.deleteCategory);
router.get('/admin/stats', authenticate, requireContentAccess, CategoryController.getCategoryStats);

export default router;