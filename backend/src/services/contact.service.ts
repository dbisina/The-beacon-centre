// backend/src/services/contact.service.ts
import { prisma } from '../config/database';
import { ServiceResponse, PaginationParams } from '../types';
import { ContactMessage, ContactCategory, ContactMessageStatus } from '@prisma/client';

// Request/response shapes local to this unit (types/index.ts is off-limits -
// other agents are editing it concurrently).
export interface CreateContactMessageRequest {
  name: string;
  email: string;
  phone?: string;
  category?: ContactCategory;
  csgId?: number;
  message: string;
  appUserId?: number;
}

export interface ContactMessageFilters extends PaginationParams {
  status?: ContactMessageStatus;
  category?: ContactCategory;
}

export class ContactService {
  // Validates that csgId references a real Csg row - used when category is CSG.
  static async csgExists(csgId: number): Promise<boolean> {
    const csg = await prisma.csg.findUnique({ where: { id: csgId }, select: { id: true } });
    return !!csg;
  }

  static async createContactMessage(
    data: CreateContactMessageRequest
  ): Promise<ServiceResponse<ContactMessage>> {
    try {
      const contactMessage = await prisma.contactMessage.create({
        data: {
          name: data.name,
          email: data.email,
          phone: data.phone || null,
          category: data.category || 'GENERAL',
          csgId: data.csgId ?? null,
          message: data.message,
          appUserId: data.appUserId ?? null,
        },
      });

      return {
        success: true,
        data: contactMessage,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to create contact message',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async getAllContactMessages(filters: ContactMessageFilters): Promise<ServiceResponse<{
    contactMessages: ContactMessage[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>> {
    try {
      const { page = 1, limit = 10, status, category } = filters;
      const skip = (page - 1) * limit;

      const where: any = {};
      if (status) {
        where.status = status;
      }
      if (category) {
        where.category = category;
      }

      const total = await prisma.contactMessage.count({ where });

      const contactMessages = await prisma.contactMessage.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      });

      const totalPages = Math.ceil(total / limit);

      return {
        success: true,
        data: {
          contactMessages,
          total,
          page,
          limit,
          totalPages,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch contact messages',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async updateContactMessageStatus(
    id: number,
    status: ContactMessageStatus,
    adminId: number
  ): Promise<ServiceResponse<ContactMessage>> {
    try {
      const existing = await prisma.contactMessage.findUnique({ where: { id } });

      if (!existing) {
        return {
          success: false,
          error: 'Contact message not found',
        };
      }

      const isHandled = status === 'HANDLED';

      const updated = await prisma.contactMessage.update({
        where: { id },
        data: {
          status,
          handledByAdminId: isHandled ? adminId : null,
          handledAt: isHandled ? new Date() : null,
          updatedAt: new Date(),
        },
      });

      return {
        success: true,
        data: updated,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to update contact message status',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
