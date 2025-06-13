import { PrismaClient } from '@prisma/client';
import {
  CreateAudioSermonRequest,
  UpdateAudioSermonRequest,
  AudioSermonFilters,
  AudioSermonWithCategory,
  PaginatedResponse,
  ServiceResponse
} from '../types';

const prisma = new PrismaClient();

export class AudioSermonService {
  // Get all audio sermons with filters and pagination
  static async getAudioSermons(
    filters: AudioSermonFilters = {}
  ): Promise<ServiceResponse<PaginatedResponse<AudioSermonWithCategory>>> {
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
      const totalItems = await prisma.audioSermon.count({ where });
      const totalPages = Math.ceil(totalItems / take);

      // Get audio sermons
      const audioSermons = await prisma.audioSermon.findMany({
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
          data: audioSermons,
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
        error: 'Failed to fetch audio sermons',
        details: error
      };
    }
  }

  // Get audio sermon by ID
  static async getAudioSermonById(id: number): Promise<ServiceResponse<AudioSermonWithCategory>> {
    try {
      const audioSermon = await prisma.audioSermon.findUnique({
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

      if (!audioSermon) {
        return {
          success: false,
          error: 'Audio sermon not found'
        };
      }

      return {
        success: true,
        data: audioSermon
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch audio sermon',
        details: error
      };
    }
  }

  // Get featured audio sermons
  static async getFeaturedAudioSermons(limit: number = 5): Promise<ServiceResponse<AudioSermonWithCategory[]>> {
    try {
      const audioSermons = await prisma.audioSermon.findMany({
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
        data: audioSermons
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch featured audio sermons',
        details: error
      };
    }
  }

  // Get audio sermons by category
  static async getAudioSermonsByCategory(
    categoryId: number,
    filters: Omit<AudioSermonFilters, 'categoryId'> = {}
  ): Promise<ServiceResponse<PaginatedResponse<AudioSermonWithCategory>>> {
    return this.getAudioSermons({ ...filters, categoryId });
  }

  // Create audio sermon
  static async createAudioSermon(data: CreateAudioSermonRequest): Promise<ServiceResponse<AudioSermonWithCategory>> {
    try {
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

      const audioSermon = await prisma.audioSermon.create({
        data: {
          title: data.title,
          speaker: data.speaker,
          audioUrl: data.audioUrl,
          cloudinaryPublicId: data.cloudinaryPublicId,
          duration: data.duration,
          fileSize: data.fileSize ? BigInt(data.fileSize) : null,
          categoryId: data.categoryId,
          sermonDate: data.sermonDate ? new Date(data.sermonDate) : null,
          description: data.description,
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
        data: audioSermon
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to create audio sermon',
        details: error
      };
    }
  }

  // Update audio sermon
  static async updateAudioSermon(data: UpdateAudioSermonRequest): Promise<ServiceResponse<AudioSermonWithCategory>> {
    try {
      const { id, ...updateData } = data;

      // Check if audio sermon exists
      const existingSermon = await prisma.audioSermon.findUnique({
        where: { id }
      });

      if (!existingSermon) {
        return {
          success: false,
          error: 'Audio sermon not found'
        };
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

      const audioSermon = await prisma.audioSermon.update({
        where: { id },
        data: {
          ...(updateData.title && { title: updateData.title }),
          ...(updateData.speaker && { speaker: updateData.speaker }),
          ...(updateData.audioUrl && { audioUrl: updateData.audioUrl }),
          ...(updateData.cloudinaryPublicId && { cloudinaryPublicId: updateData.cloudinaryPublicId }),
          ...(updateData.duration && { duration: updateData.duration }),
          ...(updateData.fileSize !== undefined && { fileSize: updateData.fileSize ? BigInt(updateData.fileSize) : null }),
          ...(updateData.categoryId !== undefined && { categoryId: updateData.categoryId }),
          ...(updateData.sermonDate !== undefined && { 
            sermonDate: updateData.sermonDate ? new Date(updateData.sermonDate) : null 
          }),
          ...(updateData.description !== undefined && { description: updateData.description }),
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
        data: audioSermon
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to update audio sermon',
        details: error
      };
    }
  }

  // Delete audio sermon
  static async deleteAudioSermon(id: number): Promise<ServiceResponse<{ id: number; cloudinaryPublicId: string }>> {
    try {
      const existingSermon = await prisma.audioSermon.findUnique({
        where: { id },
        select: {
          id: true,
          cloudinaryPublicId: true
        }
      });

      if (!existingSermon) {
        return {
          success: false,
          error: 'Audio sermon not found'
        };
      }

      await prisma.audioSermon.delete({
        where: { id }
      });

      return {
        success: true,
        data: { 
          id: existingSermon.id,
          cloudinaryPublicId: existingSermon.cloudinaryPublicId
        }
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to delete audio sermon',
        details: error
      };
    }
  }

  // Toggle featured status
  static async toggleFeatured(id: number): Promise<ServiceResponse<{ isFeatured: boolean }>> {
    try {
      const existingSermon = await prisma.audioSermon.findUnique({
        where: { id },
        select: { isFeatured: true }
      });

      if (!existingSermon) {
        return {
          success: false,
          error: 'Audio sermon not found'
        };
      }

      const audioSermon = await prisma.audioSermon.update({
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
        data: { isFeatured: audioSermon.isFeatured }
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to toggle featured status',
        details: error
      };
    }
  }

  // Increment play count
  static async incrementPlayCount(id: number): Promise<ServiceResponse<{ playCount: number }>> {
    try {
      const audioSermon = await prisma.audioSermon.update({
        where: { id },
        data: {
          playCount: {
            increment: 1
          }
        },
        select: {
          playCount: true
        }
      });

      return {
        success: true,
        data: { playCount: audioSermon.playCount }
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to increment play count',
        details: error
      };
    }
  }

  // Increment download count
  static async incrementDownloadCount(id: number): Promise<ServiceResponse<{ downloadCount: number }>> {
    try {
      const audioSermon = await prisma.audioSermon.update({
        where: { id },
        data: {
          downloadCount: {
            increment: 1
          }
        },
        select: {
          downloadCount: true
        }
      });

      return {
        success: true,
        data: { downloadCount: audioSermon.downloadCount }
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to increment download count',
        details: error
      };
    }
  }

  // Get most played audio sermons
  static async getMostPlayedAudioSermons(limit: number = 10): Promise<ServiceResponse<AudioSermonWithCategory[]>> {
    try {
      const audioSermons = await prisma.audioSermon.findMany({
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
          { playCount: 'desc' },
          { createdAt: 'desc' }
        ],
        take: limit
      });

      return {
        success: true,
        data: audioSermons
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch most played audio sermons',
        details: error
      };
    }
  }

  // Get most downloaded audio sermons
  static async getMostDownloadedAudioSermons(limit: number = 10): Promise<ServiceResponse<AudioSermonWithCategory[]>> {
    try {
      const audioSermons = await prisma.audioSermon.findMany({
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
          { downloadCount: 'desc' },
          { createdAt: 'desc' }
        ],
        take: limit
      });

      return {
        success: true,
        data: audioSermons
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch most downloaded audio sermons',
        details: error
      };
    }
  }

  // Get audio sermon statistics
  static async getAudioSermonStats(): Promise<ServiceResponse<{
    total: number;
    active: number;
    featured: number;
    totalPlays: number;
    totalDownloads: number;
    averagePlaysPerSermon: number;
    averageDownloadsPerSermon: number;
    totalStorageUsed: number; // in bytes
    sermonsBySpeaker: Array<{ speaker: string; count: number }>;
  }>> {
    try {
      const [total, active, featured, playsAgg, downloadsAgg, storageAgg, speakerStats] = await Promise.all([
        prisma.audioSermon.count(),
        prisma.audioSermon.count({ where: { isActive: true } }),
        prisma.audioSermon.count({ where: { isFeatured: true } }),
        prisma.audioSermon.aggregate({
          _sum: { playCount: true },
          _avg: { playCount: true }
        }),
        prisma.audioSermon.aggregate({
          _sum: { downloadCount: true },
          _avg: { downloadCount: true }
        }),
        prisma.audioSermon.aggregate({
          _sum: { fileSize: true }
        }),
        prisma.audioSermon.groupBy({
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
          totalPlays: playsAgg._sum.playCount || 0,
          totalDownloads: downloadsAgg._sum.downloadCount || 0,
          averagePlaysPerSermon: Math.round(playsAgg._avg.playCount || 0),
          averageDownloadsPerSermon: Math.round(downloadsAgg._avg.downloadCount || 0),
          totalStorageUsed: Number(storageAgg._sum.fileSize || 0),
          sermonsBySpeaker: speakerStats.map(stat => ({
            speaker: stat.speaker,
            count: stat._count.id
          }))
        }
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to get audio sermon statistics',
        details: error
      };
    }
  }
}