"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryService = void 0;
const database_1 = require("../config/database");
class CategoryService {
    static async getAllCategories() {
        try {
            const categories = await database_1.prisma.category.findMany({
                orderBy: {
                    name: 'asc',
                },
            });
            return {
                success: true,
                data: categories,
            };
        }
        catch (error) {
            return {
                success: false,
                error: 'Failed to fetch categories',
                details: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    static async getCategoryById(id) {
        try {
            const category = await database_1.prisma.category.findUnique({
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
        }
        catch (error) {
            return {
                success: false,
                error: 'Failed to fetch category',
                details: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    static async createCategory(categoryData) {
        try {
            const existingCategory = await database_1.prisma.category.findFirst({
                where: { name: { equals: categoryData.name, mode: 'insensitive' } },
            });
            if (existingCategory) {
                return {
                    success: false,
                    error: 'A category with this name already exists',
                };
            }
            const category = await database_1.prisma.category.create({
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
        }
        catch (error) {
            return {
                success: false,
                error: 'Failed to create category',
                details: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    static async updateCategory(id, updateData) {
        try {
            const existingCategory = await database_1.prisma.category.findUnique({
                where: { id },
            });
            if (!existingCategory) {
                return {
                    success: false,
                    error: 'Category not found',
                };
            }
            if (updateData.name && updateData.name !== existingCategory.name) {
                const nameConflict = await database_1.prisma.category.findFirst({
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
            const updatedCategory = await database_1.prisma.category.update({
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
        }
        catch (error) {
            return {
                success: false,
                error: 'Failed to update category',
                details: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    static async deleteCategory(id) {
        try {
            const existingCategory = await database_1.prisma.category.findUnique({
                where: { id },
            });
            if (!existingCategory) {
                return {
                    success: false,
                    error: 'Category not found',
                };
            }
            const [videoSermonCount, audioSermonCount] = await Promise.all([
                database_1.prisma.videoSermon.count({ where: { categoryId: id } }),
                database_1.prisma.audioSermon.count({ where: { categoryId: id } }),
            ]);
            if (videoSermonCount > 0 || audioSermonCount > 0) {
                return {
                    success: false,
                    error: `Cannot delete category. It is being used by ${videoSermonCount + audioSermonCount} sermon(s).`,
                };
            }
            await database_1.prisma.category.delete({
                where: { id },
            });
            return {
                success: true,
                data: { id },
            };
        }
        catch (error) {
            return {
                success: false,
                error: 'Failed to delete category',
                details: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    static async getCategoryStats() {
        try {
            const [total, active, videoStats, audioStats] = await Promise.all([
                database_1.prisma.category.count(),
                database_1.prisma.category.count({ where: { isActive: true } }),
                database_1.prisma.videoSermon.groupBy({
                    by: ['categoryId'],
                    _count: { id: true },
                    where: { isActive: true },
                }),
                database_1.prisma.audioSermon.groupBy({
                    by: ['categoryId'],
                    _count: { id: true },
                    where: { isActive: true },
                }),
            ]);
            const categories = await database_1.prisma.category.findMany({
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
        }
        catch (error) {
            return {
                success: false,
                error: 'Failed to get category stats',
                details: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
}
exports.CategoryService = CategoryService;
//# sourceMappingURL=category.service.js.map