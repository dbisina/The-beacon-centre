"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const upload_controller_1 = require("../controllers/upload.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const multer_1 = require("../config/multer");
const router = (0, express_1.Router)();
router.post('/audio', auth_middleware_1.authenticate, multer_1.uploadAudio.single('audio'), upload_controller_1.UploadController.uploadAudio);
router.post('/image', auth_middleware_1.authenticate, multer_1.uploadImage.single('image'), upload_controller_1.UploadController.uploadImage);
router.post('/thumbnail', auth_middleware_1.authenticate, multer_1.uploadImage.single('thumbnail'), upload_controller_1.UploadController.uploadThumbnail);
router.post('/youtube-thumbnail', auth_middleware_1.authenticate, upload_controller_1.UploadController.extractYouTubeThumbnail);
router.delete('/:publicId', auth_middleware_1.authenticate, upload_controller_1.UploadController.deleteFile);
router.get('/:publicId/details', auth_middleware_1.authenticate, upload_controller_1.UploadController.getFileDetails);
exports.default = router;
//# sourceMappingURL=upload.routes.js.map