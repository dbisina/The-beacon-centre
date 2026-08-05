// backend/src/routes/upload.routes.ts
import { Router } from 'express';
import { UploadController } from '../controllers/upload.controller';
import { authenticate, requireContentAccess } from '../middleware/auth.middleware';
import { uploadAudio, uploadImage } from '../config/multer';

const router = Router();

// All upload routes require authentication + content access
router.post('/audio', authenticate, requireContentAccess, uploadAudio.single('audio'), UploadController.uploadAudio);
router.post('/image', authenticate, requireContentAccess, uploadImage.single('image'), UploadController.uploadImage);
router.post('/thumbnail', authenticate, requireContentAccess, uploadImage.single('thumbnail'), UploadController.uploadThumbnail);
router.post('/youtube-thumbnail', authenticate, requireContentAccess, UploadController.extractYouTubeThumbnail);

// File management
router.delete('/:publicId', authenticate, requireContentAccess, UploadController.deleteFile);
router.get('/:publicId/details', authenticate, requireContentAccess, UploadController.getFileDetails);

export default router;