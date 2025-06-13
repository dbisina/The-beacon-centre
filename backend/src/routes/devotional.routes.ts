import { Router } from 'express';
import { sendSuccess } from '../utils/responses';

const router = Router();

router.get('/', (req, res) => {
// Public routes - no authentication required
  sendSuccess(res, 'Devotionals endpoint - coming soon', []);
});

router.get('/today', (req, res) => {
  sendSuccess(res, 'Today\'s devotional - coming soon', null);
});

router.get('/:id', (req, res) => {
  sendSuccess(res, 'Devotional by ID - coming soon', null);
});

export default router;