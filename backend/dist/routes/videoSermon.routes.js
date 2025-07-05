"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const videoSermon_controller_1 = require("../controllers/videoSermon.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.get('/', videoSermon_controller_1.VideoSermonController.getAllVideoSermons);
router.get('/featured', videoSermon_controller_1.VideoSermonController.getFeaturedVideoSermons);
router.get('/category/:categoryId', videoSermon_controller_1.VideoSermonController.getVideoSermonsByCategory);
router.get('/:id', videoSermon_controller_1.VideoSermonController.getVideoSermonById);
router.post('/', auth_middleware_1.authenticate, videoSermon_controller_1.VideoSermonController.createVideoSermon);
router.put('/:id', auth_middleware_1.authenticate, videoSermon_controller_1.VideoSermonController.updateVideoSermon);
router.delete('/:id', auth_middleware_1.authenticate, videoSermon_controller_1.VideoSermonController.deleteVideoSermon);
router.patch('/:id/featured', auth_middleware_1.authenticate, videoSermon_controller_1.VideoSermonController.toggleFeatured);
router.get('/admin/stats', auth_middleware_1.authenticate, videoSermon_controller_1.VideoSermonController.getVideoSermonStats);
exports.default = router;
//# sourceMappingURL=videoSermon.routes.js.map