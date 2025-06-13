// backend/src/services/category.service.ts
import { prisma } from '../config/database';
import { ServiceResponse, CreateCategoryRequest, UpdateCategoryRequest } from '../types';
import { Category } from '@prisma/client';

export class CategoryService {
  static async getAllCategories(): Promise<ServiceResponse<Category[]>> {
    try {
      const categories = await prisma.category.findMany({
        orderBy: {
          name: 'asc',
        },
      });

      return {
        success: true,
        data: categories,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch categories',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async getCategoryById(id: number): Promise<ServiceResponse<Category>> {
    try {
      const category = await prisma.category.findUnique({
        where: { id },
      });

      if (!category) {
        return {
          success: false,
          error: 'Category not found',
        };
      }

      return {
        success: true,
        data: category,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch category',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async createCategory(categoryData: CreateCategoryRequest): Promise<ServiceResponse<Category>> {
    try {
      // Check if category with same name exists
      const existingCategory = await prisma.category.findFirst({
        where: { name: { equals: categoryData.name, mode: 'insensitive' } },
      });

      if (existingCategory) {
        return {
          success: false,
          error: 'A category with this name already exists',
        };
      }

      const category = await prisma.category.create({
        data: {
          name: categoryData.name,
          description: categoryData.description || null,
          color: categoryData.color || '#007bff',
          icon: categoryData.icon || null,
          isActive: categoryData.isActive !== undefined ? categoryData.isActive : true,
        },
      });

      return {
        success: true,
        data: category,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to create category',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async updateCategory(id: number, updateData: UpdateCategoryRequest): Promise<ServiceResponse<Category>> {
    try {
      const existingCategory = await prisma.category.findUnique({
        where: { id },
      });

      if (!existingCategory) {
        return {
          success: false,
          error: 'Category not found',
        };
      }

      // Check for name conflicts if updating name
      if (updateData.name && updateData.name !== existingCategory.name) {
        const nameConflict = await prisma.category.findFirst({
          where: {
            name: { equals: updateData.name, mode: 'insensitive' },
            id: { not: id },
          },
        });

        if (nameConflict) {
          return {
            success: false,
            error: 'A category with this name already exists',
          };
        }
      }

      const updatedCategory = await prisma.category.update({
        where: { id },
        data: {
          ...(updateData.name && { name: updateData.name }),
          ...(updateData.description !== undefined && { description: updateData.description }),
          ...(updateData.color && { color: updateData.color }),
          ...(updateData.icon !== undefined && { icon: updateData.icon }),
          ...(updateData.isActive !== undefined && { isActive: updateData.isActive }),
          updatedAt: new Date(),
        },
      });

      return {
        success: true,
        data: updatedCategory,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to update category',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async deleteCategory(id: number): Promise<ServiceResponse<{ id: number }>> {
    try {
      const existingCategory = await prisma.category.findUnique({
        where: { id },
      });

      if (!existingCategory) {
        return {
          success: false,
          error: 'Category not found',
        };
      }

      // Check if category is being used
      const [videoSermonCount, audioSermonCount] = await Promise.all([
        prisma.videoSermon.count({ where: { categoryId: id } }),
        prisma.audioSermon.count({ where: { categoryId: id } }),
      ]);

      if (videoSermonCount > 0 || audioSermonCount > 0) {
        return {
          success: false,
          error: `Cannot delete category. It is being used by ${videoSermonCount + audioSermonCount} sermon(s).`,
        };
      }

      await prisma.category.delete({
        where: { id },
      });

      return {
        success: true,
        data: { id },
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to delete category',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async getCategoryStats(): Promise<ServiceResponse<{
    total: number;
    active: number;
    usage: Array<{ categoryName: string; videoCount: number; audioCount: number; totalCount: number }>;
  }>> {
    try {
      const [total, active, videoStats, audioStats] = await Promise.all([
        prisma.category.count(),
        prisma.category.count({ where: { isActive: true } }),
        prisma.videoSermon.groupBy({
          by: ['categoryId'],
          _count: { id: true },
          where: { isActive: true },
        }),
        prisma.audioSermon.groupBy({
          by: ['categoryId'],
          _count: { id: true },
          where: { isActive: true },
        }),
      ]);

      // Get all categories with usage
      const categories = await prisma.category.findMany({
        select: { id: true, name: true },
      });

      const usage = categories.map(category => {
        const videoCount = videoStats.find(s => s.categoryId === category.id)?._count.id || 0;
        const audioCount = audioStats.find(s => s.categoryId === category.id)?._count.id || 0;
        return {
          categoryName: category.name,
          videoCount,
          audioCount,
          totalCount: videoCount + audioCount,
        };
      }).sort((a, b) => b.totalCount - a.totalCount);

      return {
        success: true,
        data: {
          total,
          active,
          usage,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to get category stats',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}