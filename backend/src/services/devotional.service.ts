// backend/src/services/devotional.service.ts
import { prisma } from '../config/database';
import { ServiceResponse, CreateDevotionalRequest, UpdateDevotionalRequest, DevotionalFilters } from '../types';
import { Devotional } from '@prisma/client';
import { GeminiService } from './gemini.service';
import { cloudinary } from '../config/cloudinary';

export interface GenerateCardRequest {
  title: string;
  passage: string;
  reference: string;
}

export class DevotionalService {
  static async getAllDevotionals(filters: DevotionalFilters): Promise<ServiceResponse<{
    devotionals: Devotional[];
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
        startDate,
        endDate,
        sortBy = 'date',
        sortOrder = 'desc',
      } = filters;

      const skip = (page - 1) * limit;

      // Build where clause
      const where: any = {};

      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { content: { contains: search, mode: 'insensitive' } },
          { verseReference: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (startDate) {
        where.date = { ...where.date, gte: new Date(startDate) };
      }

      if (endDate) {
        where.date = { ...where.date, lte: new Date(endDate) };
      }

      // Get total count
      const total = await prisma.devotional.count({ where });

      // Get devotionals
      const devotionals = await prisma.devotional.findMany({
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
          devotionals,
          total,
          page,
          limit,
          totalPages,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch devotionals',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async getDevotionalById(id: number): Promise<ServiceResponse<Devotional>> {
    try {
      const devotional = await prisma.devotional.findUnique({
        where: { id },
      });

      if (!devotional) {
        return {
          success: false,
          error: 'Devotional not found',
        };
      }

      return {
        success: true,
        data: devotional,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch devotional',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async getDevotionalByDate(date: string): Promise<ServiceResponse<Devotional>> {
    try {
      const devotional = await prisma.devotional.findUnique({
        where: { date: new Date(date) },
      });

      if (!devotional) {
        return {
          success: false,
          error: 'No devotional found for this date',
        };
      }

      return {
        success: true,
        data: devotional,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch devotional',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async getTodaysDevotional(): Promise<ServiceResponse<Devotional>> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const devotional = await prisma.devotional.findUnique({
        where: { date: today },
      });

      if (!devotional) {
        return {
          success: false,
          error: 'No devotional available for today',
        };
      }

      return {
        success: true,
        data: devotional,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch today\'s devotional',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async createDevotional(devotionalData: CreateDevotionalRequest): Promise<ServiceResponse<Devotional>> {
    try {
      // Check if devotional already exists for this date
      const existingDevotional = await prisma.devotional.findUnique({
        where: { date: new Date(devotionalData.date) },
      });

      if (existingDevotional) {
        return {
          success: false,
          error: 'A devotional already exists for this date',
        };
      }

      const devotional = await prisma.devotional.create({
        data: {
          title: devotionalData.title,
          date: new Date(devotionalData.date),
          verseText: devotionalData.verseText,
          verseReference: devotionalData.verseReference,
          content: devotionalData.content,
          prayer: devotionalData.prayer || null,
        },
      });

      return {
        success: true,
        data: devotional,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to create devotional',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async updateDevotional(id: number, updateData: UpdateDevotionalRequest): Promise<ServiceResponse<Devotional>> {
    try {
      // Check if devotional exists
      const existingDevotional = await prisma.devotional.findUnique({
        where: { id },
      });

      if (!existingDevotional) {
        return {
          success: false,
          error: 'Devotional not found',
        };
      }

      // If updating date, check for conflicts
      if (updateData.date) {
        const dateConflict = await prisma.devotional.findFirst({
          where: {
            date: new Date(updateData.date),
            id: { not: id },
          },
        });

        if (dateConflict) {
          return {
            success: false,
            error: 'Another devotional already exists for this date',
          };
        }
      }

      const updatedDevotional = await prisma.devotional.update({
        where: { id },
        data: {
          ...(updateData.title && { title: updateData.title }),
          ...(updateData.date && { date: new Date(updateData.date) }),
          ...(updateData.verseText && { verseText: updateData.verseText }),
          ...(updateData.verseReference && { verseReference: updateData.verseReference }),
          ...(updateData.content && { content: updateData.content }),
          ...(updateData.prayer !== undefined && { prayer: updateData.prayer }),
          updatedAt: new Date(),
        },
      });

      return {
        success: true,
        data: updatedDevotional,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to update devotional',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async deleteDevotional(id: number): Promise<ServiceResponse<{ id: number }>> {
    try {
      const existingDevotional = await prisma.devotional.findUnique({
        where: { id },
      });

      if (!existingDevotional) {
        return {
          success: false,
          error: 'Devotional not found',
        };
      }

      await prisma.devotional.delete({
        where: { id },
      });

      return {
        success: true,
        data: { id },
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to delete devotional',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async bulkCreateDevotionals(devotionals: CreateDevotionalRequest[]): Promise<ServiceResponse<{
    created: number;
    skipped: number;
    errors: string[];
  }>> {
    try {
      const results = {
        created: 0,
        skipped: 0,
        errors: [] as string[],
      };

      for (const devotionalData of devotionals) {
        try {
          const result = await this.createDevotional(devotionalData);
          if (result.success) {
            results.created++;
          } else {
            results.skipped++;
            results.errors.push(`Date ${devotionalData.date}: ${result.error}`);
          }
        } catch (error) {
          results.skipped++;
          results.errors.push(`Date ${devotionalData.date}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      return {
        success: true,
        data: results,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Bulk creation failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // ─── Shareable verse card (Gemini background photo + Cloudinary text overlay) ───

  static async generateCard(req: GenerateCardRequest): Promise<ServiceResponse<{ imageUrl: string }>> {
    try {
      const prompt =
        `A high quality, cinematic photograph - not an illustration, not clipart, no text or words anywhere in the image - ` +
        `that visually captures the mood and theme of this Bible verse, shot with warm natural lighting and a shallow depth ` +
        `of field: "${req.passage}" (${req.reference}). The bottom third of the frame should already read as naturally ` +
        `darker/dimmer (like a soft cinematic gradient toward the base), since white text will be overlaid there. Serene, ` +
        `reverent, uncluttered composition.`;

      let image;
      try {
        image = await GeminiService.generateImage(prompt, '3:4');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return {
          success: false,
          error: message.includes('not configured')
            ? 'Card generation is not configured yet'
            : 'Failed to generate background image',
          details: message,
        };
      }

      // Keep the overlaid verse readable on a card-sized image - long
      // passages get truncated rather than shrinking the font illegibly.
      const verseText = req.passage.length > 160 ? `${req.passage.slice(0, 157).trimEnd()}…` : req.passage;

      const upload = await cloudinary.uploader.upload(`data:${image.mimeType};base64,${image.data}`, {
        resource_type: 'image',
        folder: 'beacon-devotionals/cards',
        tags: ['devotional-card', 'beacon-centre'],
        transformation: [
          { width: 1080, height: 1440, crop: 'fill', gravity: 'auto', quality: 'auto:good' },
          {
            overlay: { font_family: 'Arial', font_size: 54, font_weight: 'bold', text: verseText },
            color: 'white',
            width: 900,
            crop: 'fit',
            gravity: 'south',
            y: 230,
          },
          {
            overlay: { font_family: 'Arial', font_size: 32, font_weight: 'bold', text: req.reference.toUpperCase() },
            color: '#41BBAC',
            width: 900,
            crop: 'fit',
            gravity: 'south',
            y: 150,
          },
          {
            overlay: { font_family: 'Arial', font_size: 22, text: 'THE BEACON CENTRE' },
            color: 'white',
            opacity: 70,
            gravity: 'south',
            y: 60,
          },
        ],
      });

      return { success: true, data: { imageUrl: upload.secure_url } };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to generate card',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
