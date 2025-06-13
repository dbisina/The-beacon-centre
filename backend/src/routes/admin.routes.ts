import { Router } from 'express';
import { sendSuccess } from '../utils/responses';

const router = Router();

router.post('/auth/login', (req, res) => {
  sendSuccess(res, 'Admin authentication - coming soon', null);
});

export default router;