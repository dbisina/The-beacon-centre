// backend/src/routes/audioSermon.routes.ts
import { Router } from 'express';
import { AudioSermonController } from '../controllers/audioSermon.controller';
import { authenticate } from '../middleware/auth.middleware';
import { uploadAudio, uploadImage } from '../config/multer';

const router = Router();

// Public routes - no authentication required (for mobile app)
router.get('/', AudioSermonController.getAllAudioSermons);
router.get('/featured', AudioSermonController.getFeaturedAudioSermons);
router.get('/category/:categoryId', AudioSermonController.getAudioSermonsByCategory);
router.get('/:id', AudioSermonController.getAudioSermonById);

// Protected admin routes
router.post('/', authenticate, AudioSermonController.createAudioSermon);
router.post('/upload', authenticate, uploadAudio.single('audio'), AudioSermonController.createAudioSermonWithUpload);
// New route for thumbnail upload
router.post('/upload-thumbnail', authenticate, uploadImage.single('thumbnail'), require('../controllers/upload.controller').UploadController.uploadThumbnail);
router.put('/:id', authenticate, AudioSermonController.updateAudioSermon);
router.delete('/:id', authenticate, AudioSermonController.deleteAudioSermon);
router.patch('/:id/featured', authenticate, AudioSermonController.toggleFeatured);
router.get('/admin/stats', authenticate, AudioSermonController.getAudioSermonStats);

export default router;