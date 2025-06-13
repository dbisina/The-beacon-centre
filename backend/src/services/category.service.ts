import { PrismaClient } from '@prisma/client';
import {
  CreateCategoryRequest,
  UpdateCategoryRequest,
  CategoryWithCounts,
  ServiceResponse
} from '../types';

const prisma = new PrismaClient();

export class CategoryService {
  // Get all categories
  static async getCategories(includeInactive: boolean = false): Promise<ServiceResponse<CategoryWithCounts[]>> {
    try {
      const where = includeInactive ? {} : { isActive: true };

      const categories = await prisma.category.findMany({
        where,
        include: {
          _count: {
            select: {
              videoSermons: true,
              audioSermons: true
            }
          }
        },
        orderBy: [
          { name: 'asc' }
        ]
      });

      return {
        success: true,
        data: categories
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch categories',
        details: error
      };
    }
  }

  // Get category by ID
  static async getCategoryById(id: number): Promise<ServiceResponse<CategoryWithCounts>> {
    try {
      const category = await prisma.category.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              videoSermons: true,
              audioSermons: true
            }
          }
        }
      });

      if (!category) {
        return {
          success: false,
          error: 'Category not found'
        };
      }

      return {
        success: true,
        data: category
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch category',
        details: error
      };
    }
  }

  // Get active categories only
  static async getActiveCategories(): Promise<ServiceResponse<CategoryWithCounts[]>> {
    return this.getCategories(false);
  }

  // Get categories with content counts
  static async getCategoriesWithContentCounts(): Promise<ServiceResponse<Array<CategoryWithCounts & {
    totalContent: number;
  }>>> {
    try {
      const categories = await prisma.category.findMany({
        where: { isActive: true },
        include: {
          _count: {
            select: {
              videoSermons: {
                where: { isActive: true }
              },
              audioSermons: {
                where: { isActive: true }
              }
            }
          }
        },
        orderBy: [
          { name: 'asc' }
        ]
      });

      const categoriesWithTotals = categories.map(category => ({
        ...category,
        totalContent: category._count.videoSermons + category._count.audioSermons
      }));

      return {
        success: true,
        data: categoriesWithTotals
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch categories with content counts',
        details: error
      };
    }
  }

  // Create category
  static async createCategory(data: CreateCategoryRequest): Promise<ServiceResponse<CategoryWithCounts>> {
    try {
      // Check if category name already exists
      const existingCategory = await prisma.category.findUnique({
        where: { name: data.name }
      });

      if (existingCategory) {
        return {
          success: false,
          error: 'A category with this name already exists'
        };
      }

      // Validate color format if provided (should be hex color)
      if (data.color && !/^#[0-9A-Fa-f]{6}$/.test(data.color)) {
        return {
          success: false,
          error: 'Color must be a valid hex color code (e.g., #FF0000)'
        };
      }

      const category = await prisma.category.create({
        data: {
          name: data.name,
          description: data.description,
          color: data.color,
          icon: data.icon,
          isActive: data.isActive ?? true
        },
        include: {
          _count: {
            select: {
              videoSermons: true,
              audioSermons: true
            }
          }
        }
      });

      return {
        success: true,
        data: category
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to create category',
        details: error
      };
    }
  }

  // Update category
  static async updateCategory(data: UpdateCategoryRequest): Promise<ServiceResponse<CategoryWithCounts>> {
    try {
      const { id, ...updateData } = data;

      // Check if category exists
      const existingCategory = await prisma.category.findUnique({
        where: { id }
      });

      if (!existingCategory) {
        return {
          success: false,
          error: 'Category not found'
        };
      }

      // Check for name conflicts if name is being updated
      if (updateData.name && updateData.name !== existingCategory.name) {
        const conflictingCategory = await prisma.category.findFirst({
          where: {
            name: updateData.name,
            id: { not: id }
          }
        });

        if (conflictingCategory) {
          return {
            success: false,
            error: 'A category with this name already exists'
          };
        }
      }

      // Validate color format if provided
      if (updateData.color && !/^#[0-9A-Fa-f]{6}$/.test(updateData.color)) {
        return {
          success: false,
          error: 'Color must be a valid hex color code (e.g., #FF0000)'
        };
      }

      const category = await prisma.category.update({
        where: { id },
        data: {
          ...(updateData.name && { name: updateData.name }),
          ...(updateData.description !== undefined && { description: updateData.description }),
          ...(updateData.color !== undefined && { color: updateData.color }),
          ...(updateData.icon !== undefined && { icon: updateData.icon }),
          ...(updateData.isActive !== undefined && { isActive: updateData.isActive }),
          updatedAt: new Date()
        },
        include: {
          _count: {
            select: {
              videoSermons: true,
              audioSermons: true
            }
          }
        }
      });

      return {
        success: true,
        data: category
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to update category',
        details: error
      };
    }
  }

  // Delete category
  static async deleteCategory(id: number, forceDelete: boolean = false): Promise<ServiceResponse<{ id: number }>> {
    try {
      const existingCategory = await prisma.category.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              videoSermons: true,
              audioSermons: true
            }
          }
        }
      });

      if (!existingCategory) {
        return {
          success: false,
          error: 'Category not found'
        };
      }

      // Check if category has associated content
      const totalContent = existingCategory._count.videoSermons + existingCategory._count.audioSermons;

      if (totalContent > 0 && !forceDelete) {
        return {
          success: false,
          error: `Cannot delete category. It has ${totalContent} associated content items. Use forceDelete=true if you want to proceed.`
        };
      }

      // If force delete, first remove category associations
      if (forceDelete && totalContent > 0) {
        await prisma.$transaction([
          prisma.videoSermon.updateMany({
            where: { categoryId: id },
            data: { categoryId: null }
          }),
          prisma.audioSermon.updateMany({
            where: { categoryId: id },
            data: { categoryId: null }
          })
        ]);
      }

      await prisma.category.delete({
        where: { id }
      });

      return {
        success: true,
        data: { id }
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to delete category',
        details: error
      };
    }
  }

  // Toggle active status
  static async toggleActive(id: number): Promise<ServiceResponse<{ isActive: boolean }>> {
    try {
      const existingCategory = await prisma.category.findUnique({
        where: { id },
        select: { isActive: true }
      });

      if (!existingCategory) {
        return {
          success: false,
          error: 'Category not found'
        };
      }

      const category = await prisma.category.update({
        where: { id },
        data: {
          isActive: !existingCategory.isActive
        },
        select: {
          isActive: true
        }
      });

      return {
        success: true,
        data: { isActive: category.isActive }
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to toggle active status',
        details: error
      };
    }
  }

  // Get category statistics
  static async getCategoryStats(): Promise<ServiceResponse<{
    total: number;
    active: number;
    inactive: number;
    categoriesWithContent: number;
    categoriesWithoutContent: number;
    mostUsedCategories: Array<{
      id: number;
      name: string;
      totalContent: number;
      videoSermons: number;
      audioSermons: number;
    }>;
  }>> {
    try {
      const [total, active, categoriesWithCounts] = await Promise.all([
        prisma.category.count(),
        prisma.category.count({ where: { isActive: true } }),
        prisma.category.findMany({
          include: {
            _count: {
              select: {
                videoSermons: true,
                audioSermons: true
              }
            }
          }
        })
      ]);

      const categoriesWithContent = categoriesWithCounts.filter(
        cat => cat._count.videoSermons + cat._count.audioSermons > 0
      ).length;

      const mostUsedCategories = categoriesWithCounts
        .map(cat => ({
          id: cat.id,
          name: cat.name,
          totalContent: cat._count.videoSermons + cat._count.audioSermons,
          videoSermons: cat._count.videoSermons,
          audioSermons: cat._count.audioSermons
        }))
        .sort((a, b) => b.totalContent - a.totalContent)
        .slice(0, 10);

      return {
        success: true,
        data: {
          total,
          active,
          inactive: total - active,
          categoriesWithContent,
          categoriesWithoutContent: total - categoriesWithContent,
          mostUsedCategories
        }
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to get category statistics',
        details: error
      };
    }
  }

  // Bulk create categories
  static async bulkCreateCategories(categories: CreateCategoryRequest[]): Promise<ServiceResponse<{
    created: number;
    skipped: number;
    errors: string[];
  }>> {
    try {
      let created = 0;
      let skipped = 0;
      const errors: string[] = [];

      for (const categoryData of categories) {
        const result = await this.createCategory(categoryData);
        if (result.success) {
          created++;
        } else {
          skipped++;
          errors.push(`${categoryData.name}: ${result.error}`);
        }
      }

      return {
        success: true,
        data: { created, skipped, errors }
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to bulk create categories',
        details: error
      };
    }
  }

  // Get unused categories (categories with no content)
  static async getUnusedCategories(): Promise<ServiceResponse<CategoryWithCounts[]>> {
    try {
      const categories = await prisma.category.findMany({
        include: {
          _count: {
            select: {
              videoSermons: true,
              audioSermons: true
            }
          }
        },
        orderBy: [
          { name: 'asc' }
        ]
      });

      const unusedCategories = categories.filter(
        cat => cat._count.videoSermons === 0 && cat._count.audioSermons === 0
      );

      return {
        success: true,
        data: unusedCategories
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch unused categories',
        details: error
      };
    }
  }
}