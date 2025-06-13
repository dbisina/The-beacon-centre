// backend/src/routes/category.routes.ts
import { Router } from 'express';
import { CategoryController } from '../controllers/category.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Public routes - no authentication required (for mobile app)
router.get('/', CategoryController.getAllCategories);
router.get('/:id', CategoryController.getCategoryById);

// Protected admin routes
router.post('/', authenticate, CategoryController.createCategory);
router.put('/:id', authenticate, CategoryController.updateCategory);
router.delete('/:id', authenticate, CategoryController.deleteCategory);
router.get('/admin/stats', authenticate, CategoryController.getCategoryStats);

export default router;