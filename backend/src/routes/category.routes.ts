import { Router } from 'express';
import { sendSuccess } from '../utils/responses';

const router = Router();

router.get('/', (req, res) => {
  sendSuccess(res, 'Categories endpoint - coming soon', []);
});

export default router;