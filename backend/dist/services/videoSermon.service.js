"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VideoSermonService = void 0;
const database_1 = require("../config/database");
const upload_service_1 = require("./upload.service");
class VideoSermonService {
    static async getAllVideoSermons(filters) {
        try {
            const { page = 1, limit = 10, search, categoryId, speaker, isFeatured, isActive = true, startDate, endDate, sortBy = 'createdAt', sortOrder = 'desc', } = filters;
            const skip = (page - 1) * limit;
            const where = {};
            if (isActive !== undefined) {
                where.isActive = isActive;
            }
            if (search) {
                where.OR = [
                    { title: { contains: search, mode: 'insensitive' } },
                    { speaker: { contains: search, mode: 'insensitive' } },
                    { description: { contains: search, mode: 'insensitive' } },
                ];
            }
            if (categoryId) {
                where.categoryId = categoryId;
            }
            if (speaker) {
                where.speaker = { contains: speaker, mode: 'insensitive' };
            }
            if (isFeatured !== undefined) {
                where.isFeatured = isFeatured;
            }
            if (startDate) {
                where.sermonDate = { ...where.sermonDate, gte: new Date(startDate) };
            }
            if (endDate) {
                where.sermonDate = { ...where.sermonDate, lte: new Date(endDate) };
            }
            const total = await database_1.prisma.videoSermon.count({ where });
            const sermons = await database_1.prisma.videoSermon.findMany({
                where,
                skip,
                take: limit,
                include: {
                    category: {
                        select: {
                            id: true,
                            name: true,
                            color: true,
                        },
                    },
                },
                orderBy: {
                    [sortBy]: sortOrder,
                },
            });
            const totalPages = Math.ceil(total / limit);
            return {
                success: true,
                data: {
                    sermons,
                    total,
                    page,
                    limit,
                    totalPages,
                },
            };
        }
        catch (error) {
            return {
                success: false,
                error: 'Failed to fetch video sermons',
                details: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    static async getVideoSermonById(id) {
        try {
            const sermon = await database_1.prisma.videoSermon.findUnique({
                where: { id },
                include: {
                    category: {
                        select: {
                            id: true,
                            name: true,
                            color: true,
                            description: true,
                        },
                    },
                },
            });
            if (!sermon) {
                return {
                    success: false,
                    error: 'Video sermon not found',
                };
            }
            return {
                success: true,
                data: sermon,
            };
        }
        catch (error) {
            return {
                success: false,
                error: 'Failed to fetch video sermon',
                details: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    static async getFeaturedVideoSermons(limit = 10) {
        try {
            const sermons = await database_1.prisma.videoSermon.findMany({
                where: {
                    isFeatured: true,
                    isActive: true,
                },
                include: {
                    category: {
                        select: {
                            id: true,
                            name: true,
                            color: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
                take: limit,
            });
            return {
                success: true,
                data: sermons,
            };
        }
        catch (error) {
            return {
                success: false,
                error: 'Failed to fetch featured video sermons',
                details: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    static async getVideoSermonsByCategory(categoryId, limit = 10) {
        try {
            const sermons = await database_1.prisma.videoSermon.findMany({
                where: {
                    categoryId,
                    isActive: true,
                },
                include: {
                    category: {
                        select: {
                            id: true,
                            name: true,
                            color: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
                take: limit,
            });
            return {
                success: true,
                data: sermons,
            };
        }
        catch (error) {
            return {
                success: false,
                error: 'Failed to fetch video sermons by category',
                details: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    static async createVideoSermon(sermonData) {
        try {
            if (sermonData.categoryId) {
                const categoryExists = await database_1.prisma.category.findUnique({
                    where: { id: sermonData.categoryId },
                });
                if (!categoryExists) {
                    return {
                        success: false,
                        error: 'Category not found',
                    };
                }
            }
            const existingSermon = await database_1.prisma.videoSermon.findFirst({
                where: { youtubeId: sermonData.youtubeId },
            });
            if (existingSermon) {
                return {
                    success: false,
                    error: 'A video sermon with this YouTube ID already exists',
                };
            }
            let thumbnailUrl = sermonData.thumbnailUrl;
            if (!thumbnailUrl) {
                const thumbnailResult = await upload_service_1.UploadService.extractYouTubeThumbnail(sermonData.youtubeId);
                if (thumbnailResult.success) {
                    thumbnailUrl = thumbnailResult.data.url;
                }
            }
            const sermon = await database_1.prisma.videoSermon.create({
                data: {
                    title: sermonData.title,
                    speaker: sermonData.speaker,
                    youtubeId: sermonData.youtubeId,
                    description: sermonData.description || null,
                    duration: sermonData.duration || null,
                    categoryId: sermonData.categoryId || null,
                    sermonDate: sermonData.sermonDate ? new Date(sermonData.sermonDate) : null,
                    thumbnailUrl: thumbnailUrl || null,
                    isFeatured: sermonData.isFeatured || false,
                    isActive: sermonData.isActive !== undefined ? sermonData.isActive : true,
                    tags: sermonData.tags || [],
                },
            });
            return {
                success: true,
                data: sermon,
            };
        }
        catch (error) {
            return {
                success: false,
                error: 'Failed to create video sermon',
                details: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    static async updateVideoSermon(id, updateData) {
        try {
            const existingSermon = await database_1.prisma.videoSermon.findUnique({
                where: { id },
            });
            if (!existingSermon) {
                return {
                    success: false,
                    error: 'Video sermon not found',
                };
            }
            if (updateData.categoryId) {
                const categoryExists = await database_1.prisma.category.findUnique({
                    where: { id: updateData.categoryId },
                });
                if (!categoryExists) {
                    return {
                        success: false,
                        error: 'Category not found',
                    };
                }
            }
            if (updateData.youtubeId && updateData.youtubeId !== existingSermon.youtubeId) {
                const duplicateSermon = await database_1.prisma.videoSermon.findFirst({
                    where: {
                        youtubeId: updateData.youtubeId,
                        id: { not: id },
                    },
                });
                if (duplicateSermon) {
                    return {
                        success: false,
                        error: 'A video sermon with this YouTube ID already exists',
                    };
                }
            }
            const updatedSermon = await database_1.prisma.videoSermon.update({
                where: { id },
                data: {
                    ...(updateData.title && { title: updateData.title }),
                    ...(updateData.speaker && { speaker: updateData.speaker }),
                    ...(updateData.youtubeId && { youtubeId: updateData.youtubeId }),
                    ...(updateData.description !== undefined && { description: updateData.description }),
                    ...(updateData.duration !== undefined && { duration: updateData.duration }),
                    ...(updateData.categoryId !== undefined && { categoryId: updateData.categoryId }),
                    ...(updateData.sermonDate !== undefined && { sermonDate: updateData.sermonDate ? new Date(updateData.sermonDate) : null }),
                    ...(updateData.thumbnailUrl !== undefined && { thumbnailUrl: updateData.thumbnailUrl }),
                    ...(updateData.isFeatured !== undefined && { isFeatured: updateData.isFeatured }),
                    ...(updateData.isActive !== undefined && { isActive: updateData.isActive }),
                    ...(updateData.tags !== undefined && { tags: updateData.tags }),
                    updatedAt: new Date(),
                },
            });
            return {
                success: true,
                data: updatedSermon,
            };
        }
        catch (error) {
            return {
                success: false,
                error: 'Failed to update video sermon',
                details: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    static async deleteVideoSermon(id) {
        try {
            const existingSermon = await database_1.prisma.videoSermon.findUnique({
                where: { id },
            });
            if (!existingSermon) {
                return {
                    success: false,
                    error: 'Video sermon not found',
                };
            }
            await database_1.prisma.videoSermon.delete({
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
                error: 'Failed to delete video sermon',
                details: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    static async toggleFeatured(id) {
        try {
            const existingSermon = await database_1.prisma.videoSermon.findUnique({
                where: { id },
                select: { isFeatured: true },
            });
            if (!existingSermon) {
                return {
                    success: false,
                    error: 'Video sermon not found',
                };
            }
            const updatedSermon = await database_1.prisma.videoSermon.update({
                where: { id },
                data: {
                    isFeatured: !existingSermon.isFeatured,
                    updatedAt: new Date(),
                },
                select: {
                    id: true,
                    isFeatured: true,
                },
            });
            return {
                success: true,
                data: updatedSermon,
            };
        }
        catch (error) {
            return {
                success: false,
                error: 'Failed to toggle featured status',
                details: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    static async getVideoSermonStats() {
        try {
            const [total, active, featured] = await Promise.all([
                database_1.prisma.videoSermon.count(),
                database_1.prisma.videoSermon.count({ where: { isActive: true } }),
                database_1.prisma.videoSermon.count({ where: { isFeatured: true, isActive: true } }),
            ]);
            const [categoryStats, speakerStats] = await Promise.all([
                database_1.prisma.videoSermon.groupBy({
                    by: ['categoryId'],
                    _count: { id: true },
                    where: { isActive: true },
                }),
                database_1.prisma.videoSermon.groupBy({
                    by: ['speaker'],
                    _count: { id: true },
                    where: { isActive: true },
                }),
            ]);
            const categoryIds = categoryStats.map(stat => stat.categoryId).filter((id) => id !== null);
            const categories = categoryIds.length > 0 ? await database_1.prisma.category.findMany({
                where: { id: { in: categoryIds } },
                select: { id: true, name: true },
            }) : [];
            const byCategory = categoryStats.map(stat => ({
                categoryName: stat.categoryId
                    ? categories.find(cat => cat.id === stat.categoryId)?.name || 'Unknown'
                    : 'Uncategorized',
                count: stat._count.id,
            }));
            const bySpeaker = speakerStats.map(stat => ({
                speaker: stat.speaker,
                count: stat._count.id,
            })).sort((a, b) => b.count - a.count);
            return {
                success: true,
                data: {
                    total,
                    active,
                    featured,
                    byCategory,
                    bySpeaker,
                },
            };
        }
        catch (error) {
            return {
                success: false,
                error: 'Failed to get video sermon stats',
                details: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
}
exports.VideoSermonService = VideoSermonService;
//# sourceMappingURL=videoSermon.service.js.map