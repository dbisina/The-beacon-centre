// backend/src/controllers/category.controller.ts
import { Request, Response } from 'express';
import { CategoryService } from '../services/category.service';
import { sendSuccess, sendError } from '../utils/responses';
import { CreateCategoryRequest, UpdateCategoryRequest } from '../types';

export class CategoryController {
  static async getAllCategories(req: Request, res: Response): Promise<void> {
    try {
      const result = await CategoryService.getAllCategories();

      if (result.success) {
        sendSuccess(res, 'Categories retrieved successfully', result.data);
      } else {
        sendError(res, result.error, 500, result.details);
      }
    } catch (error) {
      sendError(res, 'Failed to retrieve categories', 500, error);
    }
  }

  static async getCategoryById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        sendError(res, 'Invalid category ID', 400);
        return;
      }

      const result = await CategoryService.getCategoryById(id);

      if (result.success) {
        sendSuccess(res, 'Category retrieved successfully', result.data);
      } else {
        const statusCode = result.error === 'Category not found' ? 404 : 500;
        sendError(res, result.error, statusCode, result.details);
      }
    } catch (error) {
      sendError(res, 'Failed to retrieve category', 500, error);
    }
  }

  static async createCategory(req: Request, res: Response): Promise<void> {
    try {
      const categoryData: CreateCategoryRequest = req.body;

      if (!categoryData.name) {
        sendError(res, 'Category name is required', 400);
        return;
      }

      const result = await CategoryService.createCategory(categoryData);

      if (result.success) {
        sendSuccess(res, 'Category created successfully', result.data, 201);
      } else {
        const statusCode = result.error === 'A category with this name already exists' ? 409 : 400;
        sendError(res, result.error, statusCode, result.details);
      }
    } catch (error) {
      sendError(res, 'Failed to create category', 500, error);
    }
  }

  static async updateCategory(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const updateData: UpdateCategoryRequest = req.body;

      if (isNaN(id)) {
        sendError(res, 'Invalid category ID', 400);
        return;
      }

      const result = await CategoryService.updateCategory(id, updateData);

      if (result.success) {
        sendSuccess(res, 'Category updated successfully', result.data);
      } else {
        const statusCode = result.error === 'Category not found' ? 404 : 400;
        sendError(res, result.error, statusCode, result.details);
      }
    } catch (error) {
      sendError(res, 'Failed to update category', 500, error);
    }
  }

  static async deleteCategory(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        sendError(res, 'Invalid category ID', 400);
        return;
      }

      const result = await CategoryService.deleteCategory(id);

      if (result.success) {
        sendSuccess(res, 'Category deleted successfully', result.data);
      } else {
        const statusCode = result.error === 'Category not found' ? 404 : 400;
        sendError(res, result.error, statusCode, result.details);
      }
    } catch (error) {
      sendError(res, 'Failed to delete category', 500, error);
    }
  }

  static async getCategoryStats(req: Request, res: Response): Promise<void> {
    try {
      const result = await CategoryService.getCategoryStats();

      if (result.success) {
        sendSuccess(res, 'Category statistics retrieved successfully', result.data);
      } else {
        sendError(res, result.error, 500, result.details);
      }
    } catch (error) {
      sendError(res, 'Failed to retrieve category statistics', 500, error);
    }
  }
}