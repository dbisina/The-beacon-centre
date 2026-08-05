// backend/src/routes/user.routes.ts
import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticateUser } from '../middleware/user.middleware';

const router = Router();

// All routes here are "my own data" - authenticateUser required throughout, no guest access.

// Saves
router.get('/me/saves', authenticateUser, UserController.getSaves);
router.post('/me/saves', authenticateUser, UserController.createSave);
router.delete('/me/saves/:contentType/:contentId', authenticateUser, UserController.deleteSave);

// Notes
router.get('/me/notes', authenticateUser, UserController.getNotes);
router.put('/me/notes/:contentType/:contentId', authenticateUser, UserController.upsertNote);
router.delete('/me/notes/:contentType/:contentId', authenticateUser, UserController.deleteNote);

// Playback progress
router.get('/me/progress/:contentType/:contentId', authenticateUser, UserController.getProgress);
router.put('/me/progress/:contentType/:contentId', authenticateUser, UserController.upsertProgress);

// Guest-data merge (called once after a guest signs in with Firebase)
router.post('/me/merge-guest-data', authenticateUser, UserController.mergeGuestData);

export default router;
