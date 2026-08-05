// backend/src/services/collage.service.ts
import { prisma } from '../config/database';
import { ServiceResponse } from '../types';
import { Collage, CollagePhoto } from '@prisma/client';
import { cloudinary } from '../config/cloudinary';

export interface CreateCollageRequest {
  date: string;
  photos: { url: string; publicId: string }[];
  /** Index into `photos` of the one to use as the cover. */
  coverIndex: number;
}

export class CollageService {
  static async getToday(): Promise<ServiceResponse<(Collage & { photos: CollagePhoto[] }) | null>> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const collage = await prisma.collage.findFirst({
        where: { date: today, isActive: true },
        include: { photos: { orderBy: { sortOrder: 'asc' } } },
      });

      return { success: true, data: collage };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch today\'s collage',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async getAll(): Promise<ServiceResponse<(Collage & { photoCount: number })[]>> {
    try {
      const collages = await prisma.collage.findMany({
        where: { isActive: true },
        orderBy: { date: 'desc' },
        include: { _count: { select: { photos: true } } },
      });

      return {
        success: true,
        data: collages.map(({ _count, ...c }) => ({ ...c, photoCount: _count.photos })),
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch collages',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async getById(id: number): Promise<ServiceResponse<Collage & { photos: CollagePhoto[] }>> {
    try {
      const collage = await prisma.collage.findUnique({
        where: { id },
        include: { photos: { orderBy: { sortOrder: 'asc' } } },
      });

      if (!collage) {
        return { success: false, error: 'Collage not found' };
      }

      return { success: true, data: collage };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch collage',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async create(data: CreateCollageRequest): Promise<ServiceResponse<Collage & { photos: CollagePhoto[] }>> {
    try {
      if (!data.photos.length) {
        return { success: false, error: 'At least one photo is required' };
      }
      const cover = data.photos[data.coverIndex];
      if (!cover) {
        return { success: false, error: 'coverIndex does not match any uploaded photo' };
      }

      const date = new Date(data.date);
      date.setHours(0, 0, 0, 0);

      const existing = await prisma.collage.findUnique({ where: { date } });
      if (existing) {
        return { success: false, error: 'A collage already exists for this date' };
      }

      const collage = await prisma.collage.create({
        data: {
          date,
          coverImageUrl: cover.url,
          coverImageCloudinaryPublicId: cover.publicId,
          photos: {
            create: data.photos.map((p, i) => ({
              imageUrl: p.url,
              cloudinaryPublicId: p.publicId,
              sortOrder: i,
            })),
          },
        },
        include: { photos: { orderBy: { sortOrder: 'asc' } } },
      });

      return { success: true, data: collage };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to create collage',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async delete(id: number): Promise<ServiceResponse<{ id: number }>> {
    try {
      const collage = await prisma.collage.findUnique({ where: { id }, include: { photos: true } });
      if (!collage) {
        return { success: false, error: 'Collage not found' };
      }

      // Best-effort Cloudinary cleanup - a failed delete here shouldn't block
      // removing the DB rows the admin is trying to delete.
      const publicIds = [collage.coverImageCloudinaryPublicId, ...collage.photos.map((p) => p.cloudinaryPublicId)];
      await Promise.allSettled(publicIds.map((pid) => cloudinary.uploader.destroy(pid)));

      await prisma.collage.delete({ where: { id } });

      return { success: true, data: { id } };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to delete collage',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
