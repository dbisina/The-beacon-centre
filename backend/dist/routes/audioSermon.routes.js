"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const audioSermon_controller_1 = require("../controllers/audioSermon.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const multer_1 = require("../config/multer");
const router = (0, express_1.Router)();
router.get('/', audioSermon_controller_1.AudioSermonController.getAllAudioSermons);
router.get('/featured', audioSermon_controller_1.AudioSermonController.getFeaturedAudioSermons);
router.get('/category/:categoryId', audioSermon_controller_1.AudioSermonController.getAudioSermonsByCategory);
router.get('/:id', audioSermon_controller_1.AudioSermonController.getAudioSermonById);
router.post('/', auth_middleware_1.authenticate, audioSermon_controller_1.AudioSermonController.createAudioSermon);
router.post('/upload', auth_middleware_1.authenticate, multer_1.uploadAudio.single('audio'), audioSermon_controller_1.AudioSermonController.createAudioSermonWithUpload);
router.put('/:id', auth_middleware_1.authenticate, audioSermon_controller_1.AudioSermonController.updateAudioSermon);
router.delete('/:id', auth_middleware_1.authenticate, audioSermon_controller_1.AudioSermonController.deleteAudioSermon);
router.patch('/:id/featured', auth_middleware_1.authenticate, audioSermon_controller_1.AudioSermonController.toggleFeatured);
router.get('/admin/stats', auth_middleware_1.authenticate, audioSermon_controller_1.AudioSermonController.getAudioSermonStats);
exports.default = router;
//# sourceMappingURL=audioSermon.routes.js.map