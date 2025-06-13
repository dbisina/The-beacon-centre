import { Router } from 'express';
import { sendSuccess } from '../utils/responses';

const router = Router();

router.post('/track', (req, res) => {
  sendSuccess(res, 'Analytics tracking - coming soon', null);
});

export default router;