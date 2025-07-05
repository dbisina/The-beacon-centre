"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryController = void 0;
const category_service_1 = require("../services/category.service");
const responses_1 = require("../utils/responses");
class CategoryController {
    static async getAllCategories(req, res) {
        try {
            const result = await category_service_1.CategoryService.getAllCategories();
            if (result.success) {
                (0, responses_1.sendSuccess)(res, 'Categories retrieved successfully', result.data);
            }
            else {
                (0, responses_1.sendError)(res, result.error, 500, result.details);
            }
        }
        catch (error) {
            (0, responses_1.sendError)(res, 'Failed to retrieve categories', 500, error);
        }
    }
    static async getCategoryById(req, res) {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) {
                (0, responses_1.sendError)(res, 'Invalid category ID', 400);
                return;
            }
            const result = await category_service_1.CategoryService.getCategoryById(id);
            if (result.success) {
                (0, responses_1.sendSuccess)(res, 'Category retrieved successfully', result.data);
            }
            else {
                const statusCode = result.error === 'Category not found' ? 404 : 500;
                (0, responses_1.sendError)(res, result.error, statusCode, result.details);
            }
        }
        catch (error) {
            (0, responses_1.sendError)(res, 'Failed to retrieve category', 500, error);
        }
    }
    static async createCategory(req, res) {
        try {
            const categoryData = req.body;
            if (!categoryData.name) {
                (0, responses_1.sendError)(res, 'Category name is required', 400);
                return;
            }
            const result = await category_service_1.CategoryService.createCategory(categoryData);
            if (result.success) {
                (0, responses_1.sendSuccess)(res, 'Category created successfully', result.data, 201);
            }
            else {
                const statusCode = result.error === 'A category with this name already exists' ? 409 : 400;
                (0, responses_1.sendError)(res, result.error, statusCode, result.details);
            }
        }
        catch (error) {
            (0, responses_1.sendError)(res, 'Failed to create category', 500, error);
        }
    }
    static async updateCategory(req, res) {
        try {
            const id = parseInt(req.params.id);
            const updateData = req.body;
            if (isNaN(id)) {
                (0, responses_1.sendError)(res, 'Invalid category ID', 400);
                return;
            }
            const result = await category_service_1.CategoryService.updateCategory(id, updateData);
            if (result.success) {
                (0, responses_1.sendSuccess)(res, 'Category updated successfully', result.data);
            }
            else {
                const statusCode = result.error === 'Category not found' ? 404 : 400;
                (0, responses_1.sendError)(res, result.error, statusCode, result.details);
            }
        }
        catch (error) {
            (0, responses_1.sendError)(res, 'Failed to update category', 500, error);
        }
    }
    static async deleteCategory(req, res) {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) {
                (0, responses_1.sendError)(res, 'Invalid category ID', 400);
                return;
            }
            const result = await category_service_1.CategoryService.deleteCategory(id);
            if (result.success) {
                (0, responses_1.sendSuccess)(res, 'Category deleted successfully', result.data);
            }
            else {
                const statusCode = result.error === 'Category not found' ? 404 : 400;
                (0, responses_1.sendError)(res, result.error, statusCode, result.details);
            }
        }
        catch (error) {
            (0, responses_1.sendError)(res, 'Failed to delete category', 500, error);
        }
    }
    static async getCategoryStats(req, res) {
        try {
            const result = await category_service_1.CategoryService.getCategoryStats();
            if (result.success) {
                (0, responses_1.sendSuccess)(res, 'Category statistics retrieved successfully', result.data);
            }
            else {
                (0, responses_1.sendError)(res, result.error, 500, result.details);
            }
        }
        catch (error) {
            (0, responses_1.sendError)(res, 'Failed to retrieve category statistics', 500, error);
        }
    }
}
exports.CategoryController = CategoryController;
//# sourceMappingURL=category.controller.js.map