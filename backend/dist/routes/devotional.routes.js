"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const devotional_controller_1 = require("../controllers/devotional.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.get('/', devotional_controller_1.DevotionalController.getAllDevotionals);
router.get('/today', devotional_controller_1.DevotionalController.getTodaysDevotional);
router.get('/date/:date', devotional_controller_1.DevotionalController.getDevotionalByDate);
router.get('/:id', devotional_controller_1.DevotionalController.getDevotionalById);
router.post('/', auth_middleware_1.authenticate, devotional_controller_1.DevotionalController.createDevotional);
router.put('/:id', auth_middleware_1.authenticate, devotional_controller_1.DevotionalController.updateDevotional);
router.delete('/:id', auth_middleware_1.authenticate, devotional_controller_1.DevotionalController.deleteDevotional);
router.post('/bulk', auth_middleware_1.authenticate, devotional_controller_1.DevotionalController.bulkCreateDevotionals);
exports.default = router;
//# sourceMappingURL=devotional.routes.js.map