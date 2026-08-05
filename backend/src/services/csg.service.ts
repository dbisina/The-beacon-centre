// backend/src/services/csg.service.ts
import { prisma } from '../config/database';
import { ServiceResponse } from '../types';
import { Csg, CsgMembership, CsgUpdate } from '@prisma/client';
import { PushService } from './push.service';

export interface CreateCsgRequest {
  name: string;
  description?: string;
  meetsOn?: string;
  meetingTime?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  coverImageUrl?: string;
  coverImageCloudinaryPublicId?: string;
}

export interface UpdateCsgRequest {
  name?: string;
  description?: string;
  meetsOn?: string;
  meetingTime?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  coverImageUrl?: string;
  coverImageCloudinaryPublicId?: string;
}

export interface CreateCsgUpdateRequest {
  title?: string;
  body: string;
  notifyMembers?: boolean;
}

export interface CsgMemberSummary {
  id: number;
  joinedAt: Date;
  appUser: {
    id: number;
    email: string | null;
    displayName: string | null;
    photoUrl: string | null;
  };
}

export interface CsgAdminStats {
  totalCsgs: number;
  totalActiveMembers: number;
  byCsg: Array<{ id: number; name: string; memberCount: number }>;
}

export class CsgService {
  static async getAllCsgs(): Promise<ServiceResponse<Csg[]>> {
    try {
      const csgs = await prisma.csg.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
      });

      return { success: true, data: csgs };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch CSGs',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async getCsgById(id: number): Promise<ServiceResponse<Csg>> {
    try {
      const csg = await prisma.csg.findUnique({ where: { id } });

      if (!csg || !csg.isActive) {
        return { success: false, error: 'CSG not found' };
      }

      return { success: true, data: csg };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch CSG',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async getCsgUpdates(csgId: number, appUserId: number): Promise<ServiceResponse<CsgUpdate[]>> {
    try {
      const membership = await prisma.csgMembership.findUnique({
        where: { csgId_appUserId: { csgId, appUserId } },
      });

      if (!membership || !membership.isActive) {
        return { success: false, error: 'Not a member of this CSG' };
      }

      const updates = await prisma.csgUpdate.findMany({
        where: { csgId },
        orderBy: { createdAt: 'desc' },
      });

      return { success: true, data: updates };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch CSG updates',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async getAdminMembers(csgId: number): Promise<ServiceResponse<CsgMemberSummary[]>> {
    try {
      const memberships = await prisma.csgMembership.findMany({
        where: { csgId, isActive: true },
        orderBy: { joinedAt: 'desc' },
        include: {
          appUser: {
            select: { id: true, email: true, displayName: true, photoUrl: true },
          },
        },
      });

      return { success: true, data: memberships };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch CSG members',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async joinCsg(csgId: number, appUserId: number): Promise<ServiceResponse<CsgMembership>> {
    try {
      const csg = await prisma.csg.findUnique({ where: { id: csgId } });

      if (!csg || !csg.isActive) {
        return { success: false, error: 'CSG not found' };
      }

      const existing = await prisma.csgMembership.findUnique({
        where: { csgId_appUserId: { csgId, appUserId } },
      });

      // Already an active member - idempotent, no-op.
      if (existing && existing.isActive) {
        return { success: true, data: existing };
      }

      let membership: CsgMembership;

      if (existing) {
        // Reactivate a previously-left membership.
        membership = await prisma.csgMembership.update({
          where: { id: existing.id },
          data: { isActive: true, joinedAt: new Date(), leftAt: null },
        });
      } else {
        membership = await prisma.csgMembership.create({
          data: { csgId, appUserId, isActive: true, joinedAt: new Date() },
        });
      }

      // A genuinely new join (created or reactivated) - bump the denormalized count.
      await prisma.csg.update({
        where: { id: csgId },
        data: { memberCount: { increment: 1 } },
      });

      return { success: true, data: membership };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to join CSG',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async leaveCsg(csgId: number, appUserId: number): Promise<ServiceResponse<{ id: number }>> {
    try {
      const existing = await prisma.csgMembership.findUnique({
        where: { csgId_appUserId: { csgId, appUserId } },
      });

      if (!existing || !existing.isActive) {
        return { success: false, error: 'Membership not found' };
      }

      await prisma.csgMembership.update({
        where: { id: existing.id },
        data: { isActive: false, leftAt: new Date() },
      });

      const csg = await prisma.csg.findUnique({ where: { id: csgId }, select: { memberCount: true } });
      const newCount = Math.max((csg?.memberCount ?? 1) - 1, 0);

      await prisma.csg.update({
        where: { id: csgId },
        data: { memberCount: newCount },
      });

      return { success: true, data: { id: existing.id } };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to leave CSG',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async rsvp(csgId: number, appUserId: number): Promise<ServiceResponse<CsgMembership>> {
    try {
      const existing = await prisma.csgMembership.findUnique({
        where: { csgId_appUserId: { csgId, appUserId } },
      });

      if (!existing || !existing.isActive) {
        return { success: false, error: 'Not a member of this CSG' };
      }

      const membership = await prisma.csgMembership.update({
        where: { id: existing.id },
        data: { lastRsvpAt: new Date() },
      });

      return { success: true, data: membership };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to record RSVP',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async createUpdate(
    csgId: number,
    authorAdminId: number,
    payload: CreateCsgUpdateRequest
  ): Promise<ServiceResponse<CsgUpdate>> {
    try {
      const csg = await prisma.csg.findUnique({ where: { id: csgId } });

      if (!csg) {
        return { success: false, error: 'CSG not found' };
      }

      const update = await prisma.csgUpdate.create({
        data: {
          csgId,
          authorAdminId,
          title: payload.title || null,
          body: payload.body,
          notifyMembers: payload.notifyMembers ?? false,
        },
      });

      if (payload.notifyMembers) {
        try {
          const pushTokens = await prisma.pushToken.findMany({
            where: { csgId, isActive: true },
            select: { token: true },
          });
          const tokens = pushTokens.map((t) => t.token);

          if (tokens.length > 0) {
            const result = await PushService.sendToTokens(tokens, {
              title: payload.title || csg.name,
              body: payload.body.substring(0, 150),
            });

            if (result.invalidTokens.length > 0) {
              await prisma.pushToken.updateMany({
                where: { token: { in: result.invalidTokens } },
                data: { isActive: false },
              });
            }
          }
        } catch (pushError) {
          // Never let a push failure fail the update creation itself.
          console.error('CsgService: failed to send push notifications for CSG update', pushError);
        }
      }

      return { success: true, data: update };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to create CSG update',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async createCsg(data: CreateCsgRequest): Promise<ServiceResponse<Csg>> {
    try {
      const csg = await prisma.csg.create({
        data: {
          name: data.name,
          description: data.description || null,
          meetsOn: data.meetsOn || null,
          meetingTime: data.meetingTime || null,
          address: data.address || null,
          latitude: data.latitude ?? null,
          longitude: data.longitude ?? null,
          coverImageUrl: data.coverImageUrl || null,
          coverImageCloudinaryPublicId: data.coverImageCloudinaryPublicId || null,
          memberCount: 0,
        },
      });

      return { success: true, data: csg };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to create CSG',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async updateCsg(id: number, data: UpdateCsgRequest): Promise<ServiceResponse<Csg>> {
    try {
      const existing = await prisma.csg.findUnique({ where: { id } });

      if (!existing) {
        return { success: false, error: 'CSG not found' };
      }

      const updated = await prisma.csg.update({
        where: { id },
        data: {
          ...(data.name !== undefined && { name: data.name }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.meetsOn !== undefined && { meetsOn: data.meetsOn }),
          ...(data.meetingTime !== undefined && { meetingTime: data.meetingTime }),
          ...(data.address !== undefined && { address: data.address }),
          ...(data.latitude !== undefined && { latitude: data.latitude }),
          ...(data.longitude !== undefined && { longitude: data.longitude }),
          ...(data.coverImageUrl !== undefined && { coverImageUrl: data.coverImageUrl }),
          ...(data.coverImageCloudinaryPublicId !== undefined && {
            coverImageCloudinaryPublicId: data.coverImageCloudinaryPublicId,
          }),
          updatedAt: new Date(),
        },
      });

      return { success: true, data: updated };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to update CSG',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async deleteCsg(id: number): Promise<ServiceResponse<{ id: number }>> {
    try {
      const existing = await prisma.csg.findUnique({ where: { id } });

      if (!existing) {
        return { success: false, error: 'CSG not found' };
      }

      // Soft delete only - historical memberships/updates may reference this CSG.
      await prisma.csg.update({
        where: { id },
        data: { isActive: false, updatedAt: new Date() },
      });

      return { success: true, data: { id } };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to delete CSG',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async removeMember(csgId: number, membershipId: number): Promise<ServiceResponse<{ id: number }>> {
    try {
      const membership = await prisma.csgMembership.findFirst({
        where: { id: membershipId, csgId },
      });

      if (!membership) {
        return { success: false, error: 'Membership not found' };
      }

      await prisma.csgMembership.update({
        where: { id: membershipId },
        data: { isActive: false, leftAt: new Date() },
      });

      const csg = await prisma.csg.findUnique({ where: { id: csgId }, select: { memberCount: true } });
      const newCount = Math.max((csg?.memberCount ?? 1) - 1, 0);

      await prisma.csg.update({
        where: { id: csgId },
        data: { memberCount: newCount },
      });

      return { success: true, data: { id: membershipId } };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to remove member',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async getAdminStats(): Promise<ServiceResponse<CsgAdminStats>> {
    try {
      const [csgs, totalActiveMembers] = await Promise.all([
        prisma.csg.findMany({
          where: { isActive: true },
          select: { id: true, name: true, memberCount: true },
          orderBy: { name: 'asc' },
        }),
        prisma.csgMembership.count({ where: { isActive: true } }),
      ]);

      return {
        success: true,
        data: {
          totalCsgs: csgs.length,
          totalActiveMembers,
          byCsg: csgs,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch CSG statistics',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
