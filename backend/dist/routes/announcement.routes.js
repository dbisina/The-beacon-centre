"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const announcement_controller_1 = require("../controllers/announcement.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.get('/', announcement_controller_1.AnnouncementController.getAllAnnouncements);
router.get('/active', announcement_controller_1.AnnouncementController.getActiveAnnouncements);
router.get('/:id', announcement_controller_1.AnnouncementController.getAnnouncementById);
router.post('/', auth_middleware_1.authenticate, announcement_controller_1.AnnouncementController.createAnnouncement);
router.put('/:id', auth_middleware_1.authenticate, announcement_controller_1.AnnouncementController.updateAnnouncement);
router.delete('/:id', auth_middleware_1.authenticate, announcement_controller_1.AnnouncementController.deleteAnnouncement);
router.patch('/:id/activate', auth_middleware_1.authenticate, announcement_controller_1.AnnouncementController.toggleActive);
router.get('/admin/stats', auth_middleware_1.authenticate, announcement_controller_1.AnnouncementController.getAnnouncementStats);
exports.default = router;
//# sourceMappingURL=announcement.routes.js.map