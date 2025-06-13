import { PrismaClient } from '@prisma/client';
import {
  CreateDevotionalRequest,
  UpdateDevotionalRequest,
  DevotionalFilters,
  DevotionalWithInteractions,
  PaginatedResponse,
  ServiceResponse
} from '../types';

const prisma = new PrismaClient();

export class DevotionalService {
  // Get all devotionals with filters and pagination
  static async getDevotionals(
    filters: DevotionalFilters = {}
  ): Promise<ServiceResponse<PaginatedResponse<DevotionalWithInteractions>>> {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = 'date',
        sortOrder = 'desc',
        startDate,
        endDate,
        search,
        isActive
      } = filters;

      const skip = (page - 1) * limit;
      const take = Math.min(limit, 100); // Max 100 items per page

      // Build where clause
      const where: any = {};
      
      if (isActive !== undefined) {
        where.isActive = isActive;
      }

      if (startDate || endDate) {
        where.date = {};
        if (startDate) where.date.gte = new Date(startDate);
        if (endDate) where.date.lte = new Date(endDate);
      }

      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { content: { contains: search, mode: 'insensitive' } },
          { verseReference: { contains: search, mode: 'insensitive' } },
          { verseText: { contains: search, mode: 'insensitive' } }
        ];
      }

      // Get total count for pagination
      const totalItems = await prisma.devotional.count({ where });
      const totalPages = Math.ceil(totalItems / take);

      // Get devotionals with interactions
      const devotionals = await prisma.devotional.findMany({
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
          data: devotionals,
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
        error: 'Failed to fetch devotionals',
        details: error
      };
    }
  }

  // Get devotional by ID
  static async getDevotionalById(id: number): Promise<ServiceResponse<DevotionalWithInteractions>> {
    try {
      const devotional = await prisma.devotional.findUnique({
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

      if (!devotional) {
        return {
          success: false,
          error: 'Devotional not found'
        };
      }

      return {
        success: true,
        data: devotional
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch devotional',
        details: error
      };
    }
  }

  // Get devotional by date
  static async getDevotionalByDate(date: string): Promise<ServiceResponse<DevotionalWithInteractions>> {
    try {
      const devotional = await prisma.devotional.findUnique({
        where: { date: new Date(date) },
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

      if (!devotional) {
        return {
          success: false,
          error: 'No devotional found for this date'
        };
      }

      return {
        success: true,
        data: devotional
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch devotional',
        details: error
      };
    }
  }

  // Get today's devotional
  static async getTodaysDevotional(): Promise<ServiceResponse<DevotionalWithInteractions>> {
    const today = new Date().toISOString().split('T')[0];
    return this.getDevotionalByDate(today);
  }

  // Create devotional
  static async createDevotional(data: CreateDevotionalRequest): Promise<ServiceResponse<DevotionalWithInteractions>> {
    try {
      // Check if devotional already exists for this date
      const existingDevotional = await prisma.devotional.findUnique({
        where: { date: new Date(data.date) }
      });

      if (existingDevotional) {
        return {
          success: false,
          error: 'A devotional already exists for this date'
        };
      }

      const devotional = await prisma.devotional.create({
        data: {
          date: new Date(data.date),
          title: data.title,
          verseText: data.verseText,
          verseReference: data.verseReference,
          content: data.content,
          prayer: data.prayer,
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
        data: devotional
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to create devotional',
        details: error
      };
    }
  }

  // Update devotional
  static async updateDevotional(data: UpdateDevotionalRequest): Promise<ServiceResponse<DevotionalWithInteractions>> {
    try {
      const { id, ...updateData } = data;

      // Check if devotional exists
      const existingDevotional = await prisma.devotional.findUnique({
        where: { id }
      });

      if (!existingDevotional) {
        return {
          success: false,
          error: 'Devotional not found'
        };
      }

      // If date is being updated, check for conflicts
      if (updateData.date) {
        const conflictingDevotional = await prisma.devotional.findFirst({
          where: {
            date: new Date(updateData.date),
            id: { not: id }
          }
        });

        if (conflictingDevotional) {
          return {
            success: false,
            error: 'A devotional already exists for this date'
          };
        }
      }

      const devotional = await prisma.devotional.update({
        where: { id },
        data: {
          ...(updateData.date && { date: new Date(updateData.date) }),
          ...(updateData.title && { title: updateData.title }),
          ...(updateData.verseText && { verseText: updateData.verseText }),
          ...(updateData.verseReference && { verseReference: updateData.verseReference }),
          ...(updateData.content && { content: updateData.content }),
          ...(updateData.prayer !== undefined && { prayer: updateData.prayer }),
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
        data: devotional
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to update devotional',
        details: error
      };
    }
  }

  // Delete devotional
  static async deleteDevotional(id: number): Promise<ServiceResponse<{ id: number }>> {
    try {
      const existingDevotional = await prisma.devotional.findUnique({
        where: { id }
      });

      if (!existingDevotional) {
        return {
          success: false,
          error: 'Devotional not found'
        };
      }

      await prisma.devotional.delete({
        where: { id }
      });

      return {
        success: true,
        data: { id }
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to delete devotional',
        details: error
      };
    }
  }

  // Bulk create devotionals
  static async bulkCreateDevotionals(devotionals: CreateDevotionalRequest[]): Promise<ServiceResponse<{ created: number; skipped: number }>> {
    try {
      let created = 0;
      let skipped = 0;

      for (const devotionalData of devotionals) {
        const result = await this.createDevotional(devotionalData);
        if (result.success) {
          created++;
        } else {
          skipped++;
        }
      }

      return {
        success: true,
        data: { created, skipped }
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to bulk create devotionals',
        details: error
      };
    }
  }

  // Increment view count
  static async incrementViewCount(id: number): Promise<ServiceResponse<{ viewCount: number }>> {
    try {
      const devotional = await prisma.devotional.update({
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
        data: { viewCount: devotional.viewCount }
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to increment view count',
        details: error
      };
    }
  }

  // Get devotional statistics
  static async getDevotionalStats(): Promise<ServiceResponse<{
    total: number;
    active: number;
    inactive: number;
    totalViews: number;
    averageViewsPerDevotional: number;
  }>> {
    try {
      const [total, active, viewsAgg] = await Promise.all([
        prisma.devotional.count(),
        prisma.devotional.count({ where: { isActive: true } }),
        prisma.devotional.aggregate({
          _sum: { viewCount: true },
          _avg: { viewCount: true }
        })
      ]);

      return {
        success: true,
        data: {
          total,
          active,
          inactive: total - active,
          totalViews: viewsAgg._sum.viewCount || 0,
          averageViewsPerDevotional: Math.round(viewsAgg._avg.viewCount || 0)
        }
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to get devotional statistics',
        details: error
      };
    }
  }
}