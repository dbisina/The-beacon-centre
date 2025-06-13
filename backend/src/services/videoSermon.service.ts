import { PrismaClient } from '@prisma/client';
import {
  CreateVideoSermonRequest,
  UpdateVideoSermonRequest,
  VideoSermonFilters,
  VideoSermonWithCategory,
  PaginatedResponse,
  ServiceResponse
} from '../types';

const prisma = new PrismaClient();

export class VideoSermonService {
  // Get all video sermons with filters and pagination
  static async getVideoSermons(
    filters: VideoSermonFilters = {}
  ): Promise<ServiceResponse<PaginatedResponse<VideoSermonWithCategory>>> {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        categoryId,
        speaker,
        isFeatured,
        isActive,
        search,
        startDate,
        endDate
      } = filters;

      const skip = (page - 1) * limit;
      const take = Math.min(limit, 100);

      // Build where clause
      const where: any = {};
      
      if (isActive !== undefined) {
        where.isActive = isActive;
      }

      if (isFeatured !== undefined) {
        where.isFeatured = isFeatured;
      }

      if (categoryId) {
        where.categoryId = categoryId;
      }

      if (speaker) {
        where.speaker = { contains: speaker, mode: 'insensitive' };
      }

      if (startDate || endDate) {
        where.sermonDate = {};
        if (startDate) where.sermonDate.gte = new Date(startDate);
        if (endDate) where.sermonDate.lte = new Date(endDate);
      }

      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { speaker: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { tags: { hasSome: [search] } }
        ];
      }

      // Get total count
      const totalItems = await prisma.videoSermon.count({ where });
      const totalPages = Math.ceil(totalItems / take);

      // Get video sermons
      const videoSermons = await prisma.videoSermon.findMany({
        where,
        include: {
          category: true,
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
          data: videoSermons,
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
        error: 'Failed to fetch video sermons',
        details: error
      };
    }
  }

  // Get video sermon by ID
  static async getVideoSermonById(id: number): Promise<ServiceResponse<VideoSermonWithCategory>> {
    try {
      const videoSermon = await prisma.videoSermon.findUnique({
        where: { id },
        include: {
          category: true,
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

      if (!videoSermon) {
        return {
          success: false,
          error: 'Video sermon not found'
        };
      }

      return {
        success: true,
        data: videoSermon
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch video sermon',
        details: error
      };
    }
  }

  // Get featured video sermons
  static async getFeaturedVideoSermons(limit: number = 5): Promise<ServiceResponse<VideoSermonWithCategory[]>> {
    try {
      const videoSermons = await prisma.videoSermon.findMany({
        where: {
          isFeatured: true,
          isActive: true
        },
        include: {
          category: true,
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
        ],
        take: limit
      });

      return {
        success: true,
        data: videoSermons
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch featured video sermons',
        details: error
      };
    }
  }

  // Get video sermons by category
  static async getVideoSermonsByCategory(
    categoryId: number,
    filters: Omit<VideoSermonFilters, 'categoryId'> = {}
  ): Promise<ServiceResponse<PaginatedResponse<VideoSermonWithCategory>>> {
    return this.getVideoSermons({ ...filters, categoryId });
  }

  // Create video sermon
  static async createVideoSermon(data: CreateVideoSermonRequest): Promise<ServiceResponse<VideoSermonWithCategory>> {
    try {
      // Check if YouTube ID already exists
      const existingSermon = await prisma.videoSermon.findUnique({
        where: { youtubeId: data.youtubeId }
      });

      if (existingSermon) {
        return {
          success: false,
          error: 'A video sermon with this YouTube ID already exists'
        };
      }

      // Validate category if provided
      if (data.categoryId) {
        const category = await prisma.category.findUnique({
          where: { id: data.categoryId }
        });

        if (!category) {
          return {
            success: false,
            error: 'Category not found'
          };
        }
      }

      const videoSermon = await prisma.videoSermon.create({
        data: {
          title: data.title,
          speaker: data.speaker,
          youtubeId: data.youtubeId,
          description: data.description,
          duration: data.duration,
          categoryId: data.categoryId,
          sermonDate: data.sermonDate ? new Date(data.sermonDate) : null,
          thumbnailUrl: data.thumbnailUrl,
          isFeatured: data.isFeatured ?? false,
          isActive: data.isActive ?? true,
          tags: data.tags || []
        },
        include: {
          category: true,
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
        data: videoSermon
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to create video sermon',
        details: error
      };
    }
  }

  // Update video sermon
  static async updateVideoSermon(data: UpdateVideoSermonRequest): Promise<ServiceResponse<VideoSermonWithCategory>> {
    try {
      const { id, ...updateData } = data;

      // Check if video sermon exists
      const existingSermon = await prisma.videoSermon.findUnique({
        where: { id }
      });

      if (!existingSermon) {
        return {
          success: false,
          error: 'Video sermon not found'
        };
      }

      // Check for YouTube ID conflicts if being updated
      if (updateData.youtubeId) {
        const conflictingSermon = await prisma.videoSermon.findFirst({
          where: {
            youtubeId: updateData.youtubeId,
            id: { not: id }
          }
        });

        if (conflictingSermon) {
          return {
            success: false,
            error: 'A video sermon with this YouTube ID already exists'
          };
        }
      }

      // Validate category if provided
      if (updateData.categoryId) {
        const category = await prisma.category.findUnique({
          where: { id: updateData.categoryId }
        });

        if (!category) {
          return {
            success: false,
            error: 'Category not found'
          };
        }
      }

      const videoSermon = await prisma.videoSermon.update({
        where: { id },
        data: {
          ...(updateData.title && { title: updateData.title }),
          ...(updateData.speaker && { speaker: updateData.speaker }),
          ...(updateData.youtubeId && { youtubeId: updateData.youtubeId }),
          ...(updateData.description !== undefined && { description: updateData.description }),
          ...(updateData.duration && { duration: updateData.duration }),
          ...(updateData.categoryId !== undefined && { categoryId: updateData.categoryId }),
          ...(updateData.sermonDate !== undefined && { 
            sermonDate: updateData.sermonDate ? new Date(updateData.sermonDate) : null 
          }),
          ...(updateData.thumbnailUrl !== undefined && { thumbnailUrl: updateData.thumbnailUrl }),
          ...(updateData.isFeatured !== undefined && { isFeatured: updateData.isFeatured }),
          ...(updateData.isActive !== undefined && { isActive: updateData.isActive }),
          ...(updateData.tags !== undefined && { tags: updateData.tags }),
          updatedAt: new Date()
        },
        include: {
          category: true,
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
        data: videoSermon
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to update video sermon',
        details: error
      };
    }
  }

  // Delete video sermon
  static async deleteVideoSermon(id: number): Promise<ServiceResponse<{ id: number }>> {
    try {
      const existingSermon = await prisma.videoSermon.findUnique({
        where: { id }
      });

      if (!existingSermon) {
        return {
          success: false,
          error: 'Video sermon not found'
        };
      }

      await prisma.videoSermon.delete({
        where: { id }
      });

      return {
        success: true,
        data: { id }
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to delete video sermon',
        details: error
      };
    }
  }

  // Toggle featured status
  static async toggleFeatured(id: number): Promise<ServiceResponse<{ isFeatured: boolean }>> {
    try {
      const existingSermon = await prisma.videoSermon.findUnique({
        where: { id },
        select: { isFeatured: true }
      });

      if (!existingSermon) {
        return {
          success: false,
          error: 'Video sermon not found'
        };
      }

      const videoSermon = await prisma.videoSermon.update({
        where: { id },
        data: {
          isFeatured: !existingSermon.isFeatured
        },
        select: {
          isFeatured: true
        }
      });

      return {
        success: true,
        data: { isFeatured: videoSermon.isFeatured }
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to toggle featured status',
        details: error
      };
    }
  }

  // Increment view count
  static async incrementViewCount(id: number): Promise<ServiceResponse<{ viewCount: number }>> {
    try {
      const videoSermon = await prisma.videoSermon.update({
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
        data: { viewCount: videoSermon.viewCount }
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to increment view count',
        details: error
      };
    }
  }

  // Get most viewed video sermons
  static async getMostViewedVideoSermons(limit: number = 10): Promise<ServiceResponse<VideoSermonWithCategory[]>> {
    try {
      const videoSermons = await prisma.videoSermon.findMany({
        where: {
          isActive: true
        },
        include: {
          category: true,
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
          { viewCount: 'desc' },
          { createdAt: 'desc' }
        ],
        take: limit
      });

      return {
        success: true,
        data: videoSermons
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch most viewed video sermons',
        details: error
      };
    }
  }

  // Get video sermon statistics
  static async getVideoSermonStats(): Promise<ServiceResponse<{
    total: number;
    active: number;
    featured: number;
    totalViews: number;
    averageViewsPerSermon: number;
    sermonsBySpeaker: Array<{ speaker: string; count: number }>;
  }>> {
    try {
      const [total, active, featured, viewsAgg, speakerStats] = await Promise.all([
        prisma.videoSermon.count(),
        prisma.videoSermon.count({ where: { isActive: true } }),
        prisma.videoSermon.count({ where: { isFeatured: true } }),
        prisma.videoSermon.aggregate({
          _sum: { viewCount: true },
          _avg: { viewCount: true }
        }),
        prisma.videoSermon.groupBy({
          by: ['speaker'],
          _count: {
            id: true
          },
          orderBy: {
            _count: {
              id: 'desc'
            }
          },
          take: 10
        })
      ]);

      return {
        success: true,
        data: {
          total,
          active,
          featured,
          totalViews: viewsAgg._sum.viewCount || 0,
          averageViewsPerSermon: Math.round(viewsAgg._avg.viewCount || 0),
          sermonsBySpeaker: speakerStats.map(stat => ({
            speaker: stat.speaker,
            count: stat._count.id
          }))
        }
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to get video sermon statistics',
        details: error
      };
    }
  }
}