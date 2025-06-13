// backend/src/routes/upload.routes.ts
import { Router } from 'express';
import { UploadController } from '../controllers/upload.controller';
import { authenticate } from '../middleware/auth.middleware';
import { uploadAudio, uploadImage } from '../config/multer';

const router = Router();

// All upload routes require authentication
router.post('/audio', authenticate, uploadAudio.single('audio'), UploadController.uploadAudio);
router.post('/image', authenticate, uploadImage.single('image'), UploadController.uploadImage);
router.post('/thumbnail', authenticate, uploadImage.single('thumbnail'), UploadController.uploadThumbnail);
router.post('/youtube-thumbnail', authenticate, UploadController.extractYouTubeThumbnail);

// File management
router.delete('/:publicId', authenticate, UploadController.deleteFile);
router.get('/:publicId/details', authenticate, UploadController.getFileDetails);

export default router;