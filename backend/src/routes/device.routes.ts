// backend/src/routes/device.routes.ts
import { Router } from 'express';
import { DeviceController } from '../controllers/device.controller';
import { optionalAuthenticateUser } from '../middleware/user.middleware';

const router = Router();

// Guest-friendly - mobile app registers/deregisters push tokens with or
// without a signed-in appUser.
router.post('/', optionalAuthenticateUser, DeviceController.registerDevice);
router.delete('/:token', optionalAuthenticateUser, DeviceController.deleteDevice);

export default router;
