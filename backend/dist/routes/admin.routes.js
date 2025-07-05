"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_controller_1 = require("../controllers/admin.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.post('/auth/login', admin_controller_1.AdminController.login);
router.post('/auth/refresh', admin_controller_1.AdminController.refreshToken);
router.post('/auth/logout', auth_middleware_1.authenticate, admin_controller_1.AdminController.logout);
router.get('/auth/me', auth_middleware_1.authenticate, admin_controller_1.AdminController.getProfile);
router.post('/create', auth_middleware_1.authenticate, admin_controller_1.AdminController.createAdmin);
router.get('/', auth_middleware_1.authenticate, admin_controller_1.AdminController.getAllAdmins);
router.put('/:id', auth_middleware_1.authenticate, admin_controller_1.AdminController.updateAdmin);
router.delete('/:id', auth_middleware_1.authenticate, admin_controller_1.AdminController.deleteAdmin);
exports.default = router;
//# sourceMappingURL=admin.routes.js.map