// backend/src/routes/live.routes.ts
//
// Separate from live-schedule.routes.ts (CRUD on the schedule table, and
// already uses `/:id`) on purpose - a `/status` path here would collide with
// that router's `/:id` if the two were merged.
import { Router } from 'express';
import { LiveController } from '../controllers/live.controller';

const router = Router();

// Public - no auth. The mobile app polls this every 45s while the Live tab
// or home tile is in focus.
router.get('/status', LiveController.getStatus);

export default router;
