import { Router } from 'express';
import { sendSuccess } from '../utils/responses';

const router = Router();

router.post('/image', (req, res) => {
  sendSuccess(res, 'File upload - coming soon', null);
});

export default router;