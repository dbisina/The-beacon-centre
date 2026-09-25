// backend/src/routes/appUserAuth.routes.ts
import { Router } from 'express';
import { AppUserAuthController } from '../controllers/appUserAuth.controller';
import { authenticateUser } from '../middleware/user.middleware';
import { appAuthLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post('/signup', AppUserAuthController.signup);
router.post('/login', appAuthLimiter, AppUserAuthController.login);
router.get('/me', authenticateUser, AppUserAuthController.me);
router.delete('/me', authenticateUser, AppUserAuthController.deleteAccount);

export default router;
