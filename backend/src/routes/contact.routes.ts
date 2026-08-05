// backend/src/routes/contact.routes.ts
import { Router } from 'express';
import { ContactController } from '../controllers/contact.controller';
import { authenticate, requireFullAccess } from '../middleware/auth.middleware';
import { optionalAuthenticateUser } from '../middleware/user.middleware';

const router = Router();

// Public (guest-friendly) submission - mobile app
router.post('/', optionalAuthenticateUser, ContactController.createContactMessage);

// Protected admin routes
router.get('/', authenticate, requireFullAccess, ContactController.getAllContactMessages);
router.patch('/:id/status', authenticate, requireFullAccess, ContactController.updateStatus);

export default router;
