"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const videoSermon_controller_1 = require("../controllers/videoSermon.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.post('/', auth_middleware_1.authenticate, videoSermon_controller_1.VideoSermonController.createVideoSermon);
router.put('/:id', auth_middleware_1.authenticate, videoSermon_controller_1.VideoSermonController.updateVideoSermon);
router.delete('/:id', auth_middleware_1.authenticate, videoSermon_controller_1.VideoSermonController.deleteVideoSermon);
router.patch('/:id/featured', auth_middleware_1.authenticate, videoSermon_controller_1.VideoSermonController.toggleFeatured);
router.get('/stats', auth_middleware_1.authenticate, videoSermon_controller_1.VideoSermonController.getVideoSermonStats);
exports.default = router;
//# sourceMappingURL=admin.videoSermon.routes.js.map