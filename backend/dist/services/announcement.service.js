"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnnouncementService = void 0;
const database_1 = require("../config/database");
const upload_service_1 = require("./upload.service");
class AnnouncementService {
    static async getAllAnnouncements(filters) {
        try {
            const { page = 1, limit = 10, search, priority, isActive = true, isExpired = false, sortBy = 'createdAt', sortOrder = 'desc', } = filters;
            const skip = (page - 1) * limit;
            const currentDate = new Date();
            const where = {};
            if (isActive !== undefined) {
                where.isActive = isActive;
            }
            if (search) {
                where.OR = [
                    { title: { contains: search, mode: 'insensitive' } },
                    { content: { contains: search, mode: 'insensitive' } },
                ];
            }
            if (priority) {
                where.priority = priority;
            }
            if (isExpired === false) {
                where.OR = [
                    { expiryDate: null },
                    { expiryDate: { gte: currentDate } },
                ];
            }
            else if (isExpired === true) {
                where.expiryDate = { lt: currentDate };
            }
            const total = await database_1.prisma.announcement.count({ where });
            const announcements = await database_1.prisma.announcement.findMany({
                where,
                skip,
                take: limit,
                orderBy: {
                    [sortBy]: sortOrder,
                },
            });
            const totalPages = Math.ceil(total / limit);
            return {
                success: true,
                data: {
                    announcements,
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
                error: 'Failed to fetch announcements',
                details: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    static async getActiveAnnouncements() {
        try {
            const currentDate = new Date();
            const announcements = await database_1.prisma.announcement.findMany({
                where: {
                    isActive: true,
                    startDate: { lte: currentDate },
                    OR: [
                        { expiryDate: null },
                        { expiryDate: { gte: currentDate } },
                    ],
                },
                orderBy: [
                    { priority: 'desc' },
                    { createdAt: 'desc' },
                ],
            });
            return {
                success: true,
                data: announcements,
            };
        }
        catch (error) {
            return {
                success: false,
                error: 'Failed to fetch active announcements',
                details: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    static async getAnnouncementById(id) {
        try {
            const announcement = await database_1.prisma.announcement.findUnique({
                where: { id },
            });
            if (!announcement) {
                return {
                    success: false,
                    error: 'Announcement not found',
                };
            }
            return {
                success: true,
                data: announcement,
            };
        }
        catch (error) {
            return {
                success: false,
                error: 'Failed to fetch announcement',
                details: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    static async createAnnouncement(announcementData) {
        try {
            const announcement = await database_1.prisma.announcement.create({
                data: {
                    title: announcementData.title,
                    content: announcementData.content,
                    priority: announcementData.priority || 'MEDIUM',
                    startDate: new Date(announcementData.startDate),
                    expiryDate: announcementData.expiryDate ? new Date(announcementData.expiryDate) : null,
                    imageUrl: announcementData.imageUrl || null,
                    cloudinaryPublicId: announcementData.cloudinaryPublicId || null,
                    actionUrl: announcementData.actionUrl || null,
                    actionText: announcementData.actionText || null,
                    isActive: announcementData.isActive !== undefined ? announcementData.isActive : true,
                },
            });
            return {
                success: true,
                data: announcement,
            };
        }
        catch (error) {
            return {
                success: false,
                error: 'Failed to create announcement',
                details: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    static async updateAnnouncement(id, updateData) {
        try {
            const existingAnnouncement = await database_1.prisma.announcement.findUnique({
                where: { id },
            });
            if (!existingAnnouncement) {
                return {
                    success: false,
                    error: 'Announcement not found',
                };
            }
            const updatedAnnouncement = await database_1.prisma.announcement.update({
                where: { id },
                data: {
                    ...(updateData.title && { title: updateData.title }),
                    ...(updateData.content && { content: updateData.content }),
                    ...(updateData.priority && { priority: updateData.priority }),
                    ...(updateData.startDate && { startDate: new Date(updateData.startDate) }),
                    ...(updateData.expiryDate !== undefined && { expiryDate: updateData.expiryDate ? new Date(updateData.expiryDate) : null }),
                    ...(updateData.imageUrl !== undefined && { imageUrl: updateData.imageUrl }),
                    ...(updateData.cloudinaryPublicId !== undefined && { cloudinaryPublicId: updateData.cloudinaryPublicId }),
                    ...(updateData.actionUrl !== undefined && { actionUrl: updateData.actionUrl }),
                    ...(updateData.actionText !== undefined && { actionText: updateData.actionText }),
                    ...(updateData.isActive !== undefined && { isActive: updateData.isActive }),
                    updatedAt: new Date(),
                },
            });
            return {
                success: true,
                data: updatedAnnouncement,
            };
        }
        catch (error) {
            return {
                success: false,
                error: 'Failed to update announcement',
                details: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    static async deleteAnnouncement(id) {
        try {
            const existingAnnouncement = await database_1.prisma.announcement.findUnique({
                where: { id },
                select: { cloudinaryPublicId: true },
            });
            if (!existingAnnouncement) {
                return {
                    success: false,
                    error: 'Announcement not found',
                };
            }
            await database_1.prisma.announcement.delete({
                where: { id },
            });
            if (existingAnnouncement.cloudinaryPublicId) {
                await upload_service_1.UploadService.deleteFile(existingAnnouncement.cloudinaryPublicId, 'image');
            }
            return {
                success: true,
                data: { id },
            };
        }
        catch (error) {
            return {
                success: false,
                error: 'Failed to delete announcement',
                details: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    static async toggleActive(id) {
        try {
            const existingAnnouncement = await database_1.prisma.announcement.findUnique({
                where: { id },
                select: { isActive: true },
            });
            if (!existingAnnouncement) {
                return {
                    success: false,
                    error: 'Announcement not found',
                };
            }
            const updatedAnnouncement = await database_1.prisma.announcement.update({
                where: { id },
                data: {
                    isActive: !existingAnnouncement.isActive,
                    updatedAt: new Date(),
                },
                select: {
                    id: true,
                    isActive: true,
                },
            });
            return {
                success: true,
                data: updatedAnnouncement,
            };
        }
        catch (error) {
            return {
                success: false,
                error: 'Failed to toggle active status',
                details: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
}
exports.AnnouncementService = AnnouncementService;
//# sourceMappingURL=announcement.service.js.map