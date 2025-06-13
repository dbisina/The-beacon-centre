import { PrismaClient } from '@prisma/client';
import {
  CreateAnnouncementRequest,
  UpdateAnnouncementRequest,
  AnnouncementFilters,
  AnnouncementWithInteractions,
  PaginatedResponse,
  ServiceResponse,
  Priority
} from '../types';

const prisma = new PrismaClient();

export class AnnouncementService {
  // Get all announcements with filters and pagination
  static async getAnnouncements(
    filters: AnnouncementFilters = {}
  ): Promise<ServiceResponse<PaginatedResponse<AnnouncementWithInteractions>>> {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        priority,
        isActive,
        isExpired,
        search
      } = filters;

      const skip = (page - 1) * limit;
      const take = Math.min(limit, 100);

      // Build where clause
      const where: any = {};
      
      if (isActive !== undefined) {
        where.isActive = isActive;
      }

      if (priority) {
        where.priority = priority;
      }

      if (isExpired !== undefined) {
        const now = new Date();
        if (isExpired) {
          where.expiryDate = {
            lte: now
          };
        } else {
          where.OR = [
            { expiryDate: null },
            { expiryDate: { gt: now } }
          ];
        }
      }

      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { content: { contains: search, mode: 'insensitive' } },
          { actionText: { contains: search, mode: 'insensitive' } }
        ];
      }

      // Get total count
      const totalItems = await prisma.announcement.count({ where });
      const totalPages = Math.ceil(totalItems / take);

      // Get announcements
      const announcements = await prisma.announcement.findMany({
        where,
        include: {
          interactions: {
            select: {
              id: true,
              interactionType: true,
              createdAt: true
            }
          },
          _count: {
            select: {
              interactions: true
            }
          }
        },
        orderBy: {
          [sortBy]: sortOrder
        },
        skip,
        take
      });

      return {
        success: true,
        data: {
          data: announcements,
          pagination: {
            currentPage: page,
            totalPages,
            totalItems,
            itemsPerPage: take,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1
          }
        }
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch announcements',
        details: error
      };
    }
  }

  // Get announcement by ID
  static async getAnnouncementById(id: number): Promise<ServiceResponse<AnnouncementWithInteractions>> {
    try {
      const announcement = await prisma.announcement.findUnique({
        where: { id },
        include: {
          interactions: {
            select: {
              id: true,
              interactionType: true,
              createdAt: true
            }
          },
          _count: {
            select: {
              interactions: true
            }
          }
        }
      });

      if (!announcement) {
        return {
          success: false,
          error: 'Announcement not found'
        };
      }

      return {
        success: true,
        data: announcement
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch announcement',
        details: error
      };
    }
  }

  // Get active announcements (not expired)
  static async getActiveAnnouncements(limit?: number): Promise<ServiceResponse<AnnouncementWithInteractions[]>> {
    try {
      const now = new Date();
      
      const announcements = await prisma.announcement.findMany({
        where: {
          isActive: true,
          startDate: {
            lte: now
          },
          OR: [
            { expiryDate: null },
            { expiryDate: { gt: now } }
          ]
        },
        include: {
          interactions: {
            select: {
              id: true,
              interactionType: true,
              createdAt: true
            }
          },
          _count: {
            select: {
              interactions: true
            }
          }
        },
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' }
        ],
        ...(limit && { take: limit })
      });

      return {
        success: true,
        data: announcements
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch active announcements',
        details: error
      };
    }
  }

  // Get high priority active announcements
  static async getHighPriorityAnnouncements(): Promise<ServiceResponse<AnnouncementWithInteractions[]>> {
    try {
      const now = new Date();
      
      const announcements = await prisma.announcement.findMany({
        where: {
          isActive: true,
          priority: 'HIGH',
          startDate: {
            lte: now
          },
          OR: [
            { expiryDate: null },
            { expiryDate: { gt: now } }
          ]
        },
        include: {
          interactions: {
            select: {
              id: true,
              interactionType: true,
              createdAt: true
            }
          },
          _count: {
            select: {
              interactions: true
            }
          }
        },
        orderBy: [
          { createdAt: 'desc' }
        ]
      });

      return {
        success: true,
        data: announcements
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch high priority announcements',
        details: error
      };
    }
  }

  // Create announcement
  static async createAnnouncement(data: CreateAnnouncementRequest): Promise<ServiceResponse<AnnouncementWithInteractions>> {
    try {
      // Validate dates
      const startDate = new Date(data.startDate);
      const expiryDate = data.expiryDate ? new Date(data.expiryDate) : null;

      if (expiryDate && expiryDate <= startDate) {
        return {
          success: false,
          error: 'Expiry date must be after start date'
        };
      }

      const announcement = await prisma.announcement.create({
        data: {
          title: data.title,
          content: data.content,
          priority: data.priority || 'MEDIUM',
          startDate,
          expiryDate,
          imageUrl: data.imageUrl,
          cloudinaryPublicId: data.cloudinaryPublicId,
          actionUrl: data.actionUrl,
          actionText: data.actionText,
          isActive: data.isActive ?? true
        },
        include: {
          interactions: {
            select: {
              id: true,
              interactionType: true,
              createdAt: true
            }
          },
          _count: {
            select: {
              interactions: true
            }
          }
        }
      });

      return {
        success: true,
        data: announcement
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to create announcement',
        details: error
      };
    }
  }

  // Update announcement
  static async updateAnnouncement(data: UpdateAnnouncementRequest): Promise<ServiceResponse<AnnouncementWithInteractions>> {
    try {
      const { id, ...updateData } = data;

      // Check if announcement exists
      const existingAnnouncement = await prisma.announcement.findUnique({
        where: { id }
      });

      if (!existingAnnouncement) {
        return {
          success: false,
          error: 'Announcement not found'
        };
      }

      // Validate dates if being updated
      let startDate = existingAnnouncement.startDate;
      let expiryDate = existingAnnouncement.expiryDate;

      if (updateData.startDate) {
        startDate = new Date(updateData.startDate);
      }

      if (updateData.expiryDate !== undefined) {
        expiryDate = updateData.expiryDate ? new Date(updateData.expiryDate) : null;
      }

      if (expiryDate && expiryDate <= startDate) {
        return {
          success: false,
          error: 'Expiry date must be after start date'
        };
      }

      const announcement = await prisma.announcement.update({
        where: { id },
        data: {
          ...(updateData.title && { title: updateData.title }),
          ...(updateData.content && { content: updateData.content }),
          ...(updateData.priority && { priority: updateData.priority }),
          ...(updateData.startDate && { startDate: new Date(updateData.startDate) }),
          ...(updateData.expiryDate !== undefined && { 
            expiryDate: updateData.expiryDate ? new Date(updateData.expiryDate) : null 
          }),
          ...(updateData.imageUrl !== undefined && { imageUrl: updateData.imageUrl }),
          ...(updateData.cloudinaryPublicId !== undefined && { cloudinaryPublicId: updateData.cloudinaryPublicId }),
          ...(updateData.actionUrl !== undefined && { actionUrl: updateData.actionUrl }),
          ...(updateData.actionText !== undefined && { actionText: updateData.actionText }),
          ...(updateData.isActive !== undefined && { isActive: updateData.isActive }),
          updatedAt: new Date()
        },
        include: {
          interactions: {
            select: {
              id: true,
              interactionType: true,
              createdAt: true
            }
          },
          _count: {
            select: {
              interactions: true
            }
          }
        }
      });

      return {
        success: true,
        data: announcement
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to update announcement',
        details: error
      };
    }
  }

  // Delete announcement
  static async deleteAnnouncement(id: number): Promise<ServiceResponse<{ id: number; cloudinaryPublicId?: string }>> {
    try {
      const existingAnnouncement = await prisma.announcement.findUnique({
        where: { id },
        select: {
          id: true,
          cloudinaryPublicId: true
        }
      });

      if (!existingAnnouncement) {
        return {
          success: false,
          error: 'Announcement not found'
        };
      }

      await prisma.announcement.delete({
        where: { id }
      });

      return {
        success: true,
        data: { 
          id: existingAnnouncement.id,
          cloudinaryPublicId: existingAnnouncement.cloudinaryPublicId || undefined
        }
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to delete announcement',
        details: error
      };
    }
  }

  // Toggle active status
  static async toggleActive(id: number): Promise<ServiceResponse<{ isActive: boolean }>> {
    try {
      const existingAnnouncement = await prisma.announcement.findUnique({
        where: { id },
        select: { isActive: true }
      });

      if (!existingAnnouncement) {
        return {
          success: false,
          error: 'Announcement not found'
        };
      }

      const announcement = await prisma.announcement.update({
        where: { id },
        data: {
          isActive: !existingAnnouncement.isActive
        },
        select: {
          isActive: true
        }
      });

      return {
        success: true,
        data: { isActive: announcement.isActive }
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to toggle active status',
        details: error
      };
    }
  }

  // Increment view count
  static async incrementViewCount(id: number): Promise<ServiceResponse<{ viewCount: number }>> {
    try {
      const announcement = await prisma.announcement.update({
        where: { id },
        data: {
          viewCount: {
            increment: 1
          }
        },
        select: {
          viewCount: true
        }
      });

      return {
        success: true,
        data: { viewCount: announcement.viewCount }
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to increment view count',
        details: error
      };
    }
  }

  // Get expired announcements
  static async getExpiredAnnouncements(): Promise<ServiceResponse<AnnouncementWithInteractions[]>> {
    try {
      const now = new Date();
      
      const announcements = await prisma.announcement.findMany({
        where: {
          expiryDate: {
            lte: now
          }
        },
        include: {
          interactions: {
            select: {
              id: true,
              interactionType: true,
              createdAt: true
            }
          },
          _count: {
            select: {
              interactions: true
            }
          }
        },
        orderBy: [
          { expiryDate: 'desc' }
        ]
      });

      return {
        success: true,
        data: announcements
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch expired announcements',
        details: error
      };
    }
  }

  // Get announcements expiring soon (within next 7 days)
  static async getAnnouncementsExpiringSoon(): Promise<ServiceResponse<AnnouncementWithInteractions[]>> {
    try {
      const now = new Date();
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      const announcements = await prisma.announcement.findMany({
        where: {
          isActive: true,
          expiryDate: {
            gte: now,
            lte: nextWeek
          }
        },
        include: {
          interactions: {
            select: {
              id: true,
              interactionType: true,
              createdAt: true
            }
          },
          _count: {
            select: {
              interactions: true
            }
          }
        },
        orderBy: [
          { expiryDate: 'asc' }
        ]
      });

      return {
        success: true,
        data: announcements
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch announcements expiring soon',
        details: error
      };
    }
  }

  // Get announcement statistics
  static async getAnnouncementStats(): Promise<ServiceResponse<{
    total: number;
    active: number;
    expired: number;
    expiringSoon: number;
    byPriority: Array<{ priority: Priority; count: number }>;
    totalViews: number;
    averageViewsPerAnnouncement: number;
  }>> {
    try {
      const now = new Date();
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const [
        total,
        active,
        expired,
        expiringSoon,
        priorityStats,
        viewsAgg
      ] = await Promise.all([
        prisma.announcement.count(),
        prisma.announcement.count({
          where: {
            isActive: true,
            OR: [
              { expiryDate: null },
              { expiryDate: { gt: now } }
            ]
          }
        }),
        prisma.announcement.count({
          where: {
            expiryDate: {
              lte: now
            }
          }
        }),
        prisma.announcement.count({
          where: {
            isActive: true,
            expiryDate: {
              gte: now,
              lte: nextWeek
            }
          }
        }),
        prisma.announcement.groupBy({
          by: ['priority'],
          _count: {
            id: true
          }
        }),
        prisma.announcement.aggregate({
          _sum: { viewCount: true },
          _avg: { viewCount: true }
        })
      ]);

      return {
        success: true,
        data: {
          total,
          active,
          expired,
          expiringSoon,
          byPriority: priorityStats.map(stat => ({
            priority: stat.priority,
            count: stat._count.id
          })),
          totalViews: viewsAgg._sum.viewCount || 0,
          averageViewsPerAnnouncement: Math.round(viewsAgg._avg.viewCount || 0)
        }
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to get announcement statistics',
        details: error
      };
    }
  }
}