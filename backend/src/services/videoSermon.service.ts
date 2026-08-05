// backend/src/services/videoSermon.service.ts
import axios from 'axios';
import { prisma } from '../config/database';
import { ServiceResponse, CreateVideoSermonRequest, UpdateVideoSermonRequest, VideoSermonFilters } from '../types';
import { VideoSermon } from '@prisma/client';
import { UploadService } from './upload.service';

export interface VideoComment {
  id: string;
  author: string;
  authorProfileImageUrl: string | null;
  text: string;
  likeCount: number;
  publishedAt: string;
}

export class VideoSermonService {
  static async getAllVideoSermons(filters: VideoSermonFilters): Promise<ServiceResponse<{
    sermons: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>> {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        categoryId,
        speaker,
        isFeatured,
        isActive = true,
        startDate,
        endDate,
        kind,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = filters;

      const skip = (page - 1) * limit;

      // Build where clause
      const where: any = {};

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

      if (kind) {
        where.kind = kind;
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

      // Get total count
      const total = await prisma.videoSermon.count({ where });

      // Get sermons with category details
      const sermons = await prisma.videoSermon.findMany({
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
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch video sermons',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async getVideoSermonById(id: number): Promise<ServiceResponse<any>> {
    try {
      const sermon = await prisma.videoSermon.findUnique({
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
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch video sermon',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async getFeaturedVideoSermons(limit: number = 10): Promise<ServiceResponse<any[]>> {
    try {
      const sermons = await prisma.videoSermon.findMany({
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
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch featured video sermons',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async getVideoSermonsByCategory(categoryId: number, limit: number = 10): Promise<ServiceResponse<any[]>> {
    try {
      const sermons = await prisma.videoSermon.findMany({
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
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch video sermons by category',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async createVideoSermon(sermonData: CreateVideoSermonRequest): Promise<ServiceResponse<VideoSermon>> {
    try {
      // Validate category if provided
      if (sermonData.categoryId) {
        const categoryExists = await prisma.category.findUnique({
          where: { id: sermonData.categoryId },
        });

        if (!categoryExists) {
          return {
            success: false,
            error: 'Category not found',
          };
        }
      }

      // Check for duplicate YouTube ID
      const existingSermon = await prisma.videoSermon.findFirst({
        where: { youtubeId: sermonData.youtubeId },
      });

      if (existingSermon) {
        return {
          success: false,
          error: 'A video sermon with this YouTube ID already exists',
        };
      }

      // Extract thumbnail from YouTube if not provided
      let thumbnailUrl = sermonData.thumbnailUrl;
      if (!thumbnailUrl) {
        const thumbnailResult = await UploadService.extractYouTubeThumbnail(sermonData.youtubeId);
        if (thumbnailResult.success) {
          thumbnailUrl = thumbnailResult.data.url;
        }
      }

      const sermon = await prisma.videoSermon.create({
        data: {
          title: sermonData.title,
          speaker: sermonData.speaker,
          youtubeId: sermonData.youtubeId,
          description: sermonData.description || null,
          duration: sermonData.duration || null,
          kind: sermonData.kind || 'SERMON',
          series: sermonData.series || null,
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
    } catch (error) {
      return {
        success: false,
        error: 'Failed to create video sermon',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async updateVideoSermon(id: number, updateData: UpdateVideoSermonRequest): Promise<ServiceResponse<VideoSermon>> {
    try {
      // Check if sermon exists
      const existingSermon = await prisma.videoSermon.findUnique({
        where: { id },
      });

      if (!existingSermon) {
        return {
          success: false,
          error: 'Video sermon not found',
        };
      }

      // Validate category if provided
      if (updateData.categoryId) {
        const categoryExists = await prisma.category.findUnique({
          where: { id: updateData.categoryId },
        });

        if (!categoryExists) {
          return {
            success: false,
            error: 'Category not found',
          };
        }
      }

      // Check for duplicate YouTube ID if updating
      if (updateData.youtubeId && updateData.youtubeId !== existingSermon.youtubeId) {
        const duplicateSermon = await prisma.videoSermon.findFirst({
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

      const updatedSermon = await prisma.videoSermon.update({
        where: { id },
        data: {
          ...(updateData.title && { title: updateData.title }),
          ...(updateData.speaker && { speaker: updateData.speaker }),
          ...(updateData.youtubeId && { youtubeId: updateData.youtubeId }),
          ...(updateData.description !== undefined && { description: updateData.description }),
          ...(updateData.duration !== undefined && { duration: updateData.duration }),
          ...(updateData.kind !== undefined && { kind: updateData.kind }),
          ...(updateData.series !== undefined && { series: updateData.series }),
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
    } catch (error) {
      return {
        success: false,
        error: 'Failed to update video sermon',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async deleteVideoSermon(id: number): Promise<ServiceResponse<{ id: number }>> {
    try {
      const existingSermon = await prisma.videoSermon.findUnique({
        where: { id },
      });

      if (!existingSermon) {
        return {
          success: false,
          error: 'Video sermon not found',
        };
      }

      await prisma.videoSermon.delete({
        where: { id },
      });

      return {
        success: true,
        data: { id },
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to delete video sermon',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async bulkUpdateKind(
    ids: number[],
    kind: 'SERMON' | 'EXCERPT' | 'INSPIRATIONAL'
  ): Promise<ServiceResponse<{ count: number }>> {
    try {
      const result = await prisma.videoSermon.updateMany({
        where: { id: { in: ids } },
        data: { kind, updatedAt: new Date() },
      });

      return {
        success: true,
        data: { count: result.count },
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to bulk update videos',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async toggleFeatured(id: number): Promise<ServiceResponse<{ id: number; isFeatured: boolean }>> {
    try {
      const existingSermon = await prisma.videoSermon.findUnique({
        where: { id },
        select: { isFeatured: true },
      });

      if (!existingSermon) {
        return {
          success: false,
          error: 'Video sermon not found',
        };
      }

      const updatedSermon = await prisma.videoSermon.update({
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
    } catch (error) {
      return {
        success: false,
        error: 'Failed to toggle featured status',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async getVideoSermonStats(): Promise<ServiceResponse<{
    total: number;
    active: number;
    featured: number;
    byCategory: Array<{ categoryName: string; count: number }>;
    bySpeaker: Array<{ speaker: string; count: number }>;
  }>> {
    try {
      // Get basic stats
      const [total, active, featured] = await Promise.all([
        prisma.videoSermon.count(),
        prisma.videoSermon.count({ where: { isActive: true } }),
        prisma.videoSermon.count({ where: { isFeatured: true, isActive: true } }),
      ]);

      // Get aggregated data
      const [categoryStats, speakerStats] = await Promise.all([
        prisma.videoSermon.groupBy({
          by: ['categoryId'],
          _count: { id: true },
          where: { isActive: true },
        }),
        prisma.videoSermon.groupBy({
          by: ['speaker'],
          _count: { id: true },
          where: { isActive: true },
        }),
      ]);

      // Get category names
      const categoryIds = categoryStats.map(stat => stat.categoryId).filter((id): id is number => id !== null);
      const categories = categoryIds.length > 0 ? await prisma.category.findMany({
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
    } catch (error) {
      return {
        success: false,
        error: 'Failed to get video sermon stats',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /** Distinct series names already in use, for the admin form's "pick an
   *  existing series or type a new one" picker. */
  static async getDistinctSeries(): Promise<ServiceResponse<string[]>> {
    try {
      const rows = await prisma.videoSermon.findMany({
        where: { series: { not: null } },
        select: { series: true },
        distinct: ['series'],
        orderBy: { series: 'asc' },
      });
      return { success: true, data: rows.map((r) => r.series as string) };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch series list',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // ─── Real YouTube comments (not a fake/mocked feed) ───

  static async getComments(id: number): Promise<ServiceResponse<VideoComment[]>> {
    try {
      const sermon = await prisma.videoSermon.findUnique({ where: { id }, select: { youtubeId: true } });
      if (!sermon) {
        return { success: false, error: 'Video sermon not found' };
      }

      const apiKey = process.env.YOUTUBE_API_KEY;
      if (!apiKey) {
        return { success: false, error: 'Comments are not configured (YOUTUBE_API_KEY unset)' };
      }

      const response = await axios.get('https://www.googleapis.com/youtube/v3/commentThreads', {
        params: {
          part: 'snippet',
          videoId: sermon.youtubeId,
          maxResults: 30,
          order: 'relevance',
          key: apiKey,
        },
      });

      const comments: VideoComment[] = (response.data.items ?? []).map((item: any) => {
        const top = item.snippet.topLevelComment.snippet;
        return {
          id: item.id,
          author: top.authorDisplayName ?? 'Anonymous',
          authorProfileImageUrl: top.authorProfileImageUrl ?? null,
          // textOriginal is plain text - textDisplay is HTML (<a> tags,
          // entities) and would render literally in a RN <Text>.
          text: top.textOriginal ?? '',
          likeCount: top.likeCount ?? 0,
          publishedAt: top.publishedAt,
        };
      });

      return { success: true, data: comments };
    } catch (error) {
      // YouTube 403s this with commentsDisabled when the video owner turned
      // comments off - that's a normal, expected outcome, not a real error.
      if (axios.isAxiosError(error) && error.response?.data?.error?.errors?.[0]?.reason === 'commentsDisabled') {
        return { success: true, data: [] };
      }
      return {
        success: false,
        error: 'Failed to fetch comments',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}