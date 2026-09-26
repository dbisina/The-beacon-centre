// backend/src/routes/events.routes.ts
import { Router } from 'express';
import { EventsController } from '../controllers/events.controller';
import { authenticate, requireContentAccess } from '../middleware/auth.middleware';
import { authenticateUser } from '../middleware/user.middleware';
import { viewerAuth } from '../middleware/viewerAuth';

const router = Router();

// Literal paths before /:id so "admin" isn't read as an id.
router.get('/admin/all', authenticate, requireContentAccess, EventsController.adminList);

// Public reads, scoped to what the reader may see (group events for members only).
router.get('/', viewerAuth, EventsController.list);
router.get('/:id', viewerAuth, EventsController.get);

// Members
router.put('/:id/rsvp', authenticateUser, EventsController.rsvp);
router.delete('/:id/rsvp', authenticateUser, EventsController.clearRsvp);
router.post('/:id/register', authenticateUser, EventsController.register);

// Admin
router.post('/', authenticate, requireContentAccess, EventsController.create);
router.put('/:id', authenticate, requireContentAccess, EventsController.update);
router.put('/:id/form', authenticate, requireContentAccess, EventsController.saveForm);
router.get('/:id/responses', authenticate, requireContentAccess, EventsController.responses);
router.get('/:id/responses.csv', authenticate, requireContentAccess, EventsController.responsesCsv);

export default router;
