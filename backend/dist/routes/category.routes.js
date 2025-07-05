"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const category_controller_1 = require("../controllers/category.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.get('/', category_controller_1.CategoryController.getAllCategories);
router.get('/:id', category_controller_1.CategoryController.getCategoryById);
router.post('/', auth_middleware_1.authenticate, category_controller_1.CategoryController.createCategory);
router.put('/:id', auth_middleware_1.authenticate, category_controller_1.CategoryController.updateCategory);
router.delete('/:id', auth_middleware_1.authenticate, category_controller_1.CategoryController.deleteCategory);
router.get('/admin/stats', auth_middleware_1.authenticate, category_controller_1.CategoryController.getCategoryStats);
exports.default = router;
//# sourceMappingURL=category.routes.js.map