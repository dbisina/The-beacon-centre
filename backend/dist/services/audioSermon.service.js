"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AudioSermonService = void 0;
const database_1 = require("../config/database");
const upload_service_1 = require("./upload.service");
class AudioSermonService {
    static async getAllAudioSermons(filters) {
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
            const total = await database_1.prisma.audioSermon.count({ where });
            const sermons = await database_1.prisma.audioSermon.findMany({
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
                error: 'Failed to fetch audio sermons',
                details: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    static async getAudioSermonById(id) {
        try {
            const sermon = await database_1.prisma.audioSermon.findUnique({
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
                    error: 'Audio sermon not found',
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
                error: 'Failed to fetch audio sermon',
                details: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    static async getFeaturedAudioSermons(limit = 10) {
        try {
            const sermons = await database_1.prisma.audioSermon.findMany({
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
                error: 'Failed to fetch featured audio sermons',
                details: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    static async getAudioSermonsByCategory(categoryId, limit = 10) {
        try {
            const sermons = await database_1.prisma.audioSermon.findMany({
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
                error: 'Failed to fetch audio sermons by category',
                details: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    static async createAudioSermon(sermonData) {
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
            const sermon = await database_1.prisma.audioSermon.create({
                data: {
                    title: sermonData.title,
                    speaker: sermonData.speaker,
                    audioUrl: sermonData.audioUrl,
                    cloudinaryPublicId: sermonData.cloudinaryPublicId,
                    duration: sermonData.duration != null ? String(sermonData.duration) : null,
                    fileSize: sermonData.fileSize || null,
                    categoryId: sermonData.categoryId || null,
                    sermonDate: sermonData.sermonDate ? new Date(sermonData.sermonDate) : null,
                    description: sermonData.description || null,
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
                error: 'Failed to create audio sermon',
                details: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    static async updateAudioSermon(id, updateData) {
        try {
            const existingSermon = await database_1.prisma.audioSermon.findUnique({
                where: { id },
            });
            if (!existingSermon) {
                return {
                    success: false,
                    error: 'Audio sermon not found',
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
            const updatedSermon = await database_1.prisma.audioSermon.update({
                where: { id },
                data: {
                    ...(updateData.title && { title: updateData.title }),
                    ...(updateData.speaker && { speaker: updateData.speaker }),
                    ...(updateData.audioUrl && { audioUrl: updateData.audioUrl }),
                    ...(updateData.cloudinaryPublicId && { cloudinaryPublicId: updateData.cloudinaryPublicId }),
                    ...(updateData.duration !== undefined && { duration: updateData.duration }),
                    ...(updateData.fileSize !== undefined && { fileSize: updateData.fileSize }),
                    ...(updateData.categoryId !== undefined && { categoryId: updateData.categoryId }),
                    ...(updateData.sermonDate !== undefined && { sermonDate: updateData.sermonDate ? new Date(updateData.sermonDate) : null }),
                    ...(updateData.description !== undefined && { description: updateData.description }),
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
                error: 'Failed to update audio sermon',
                details: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    static async deleteAudioSermon(id) {
        try {
            const existingSermon = await database_1.prisma.audioSermon.findUnique({
                where: { id },
                select: { cloudinaryPublicId: true },
            });
            if (!existingSermon) {
                return {
                    success: false,
                    error: 'Audio sermon not found',
                };
            }
            await database_1.prisma.audioSermon.delete({
                where: { id },
            });
            if (existingSermon.cloudinaryPublicId) {
                await upload_service_1.UploadService.deleteFile(existingSermon.cloudinaryPublicId, 'video');
            }
            return {
                success: true,
                data: { id },
            };
        }
        catch (error) {
            return {
                success: false,
                error: 'Failed to delete audio sermon',
                details: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    static async toggleFeatured(id) {
        try {
            const existingSermon = await database_1.prisma.audioSermon.findUnique({
                where: { id },
                select: { isFeatured: true },
            });
            if (!existingSermon) {
                return {
                    success: false,
                    error: 'Audio sermon not found',
                };
            }
            const updatedSermon = await database_1.prisma.audioSermon.update({
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
    static async getAudioSermonStats() {
        try {
            const [total, active, featured] = await Promise.all([
                database_1.prisma.audioSermon.count(),
                database_1.prisma.audioSermon.count({ where: { isActive: true } }),
                database_1.prisma.audioSermon.count({ where: { isFeatured: true, isActive: true } }),
            ]);
            const [sizeData, categoryStats, speakerStats] = await Promise.all([
                database_1.prisma.audioSermon.aggregate({
                    _sum: { fileSize: true },
                    where: { isActive: true },
                }),
                database_1.prisma.audioSermon.groupBy({
                    by: ['categoryId'],
                    _count: { id: true },
                    where: { isActive: true },
                }),
                database_1.prisma.audioSermon.groupBy({
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
            const totalSizeBytes = Number(sizeData._sum.fileSize || 0);
            const totalSize = this.formatFileSize(totalSizeBytes);
            return {
                success: true,
                data: {
                    total,
                    active,
                    featured,
                    totalDuration: 'N/A',
                    totalSize,
                    byCategory,
                    bySpeaker,
                },
            };
        }
        catch (error) {
            return {
                success: false,
                error: 'Failed to get audio sermon stats',
                details: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    static formatFileSize(bytes) {
        if (bytes === 0)
            return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}
exports.AudioSermonService = AudioSermonService;
//# sourceMappingURL=audioSermon.service.js.map