// backend/src/services/csg.service.ts
import { prisma } from '../config/database';
import { ServiceResponse } from '../types';
import { Csg, CsgMembership, CsgUpdate, MembershipStatus, Prisma } from '@prisma/client';
import { PushAudience } from './pushAudience.service';

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

/** What a member submits to ask to join a group. */
export interface JoinRequest {
  fullName: string;
  /** YYYY-MM-DD. */
  dateOfBirth: string;
  addressStreet: string;
  addressArea: string;
}

/** The caller's own standing in one group, as the app renders it. */
export interface MyMembership {
  csgId: number;
  status: 'NONE' | MembershipStatus;
  membershipId: number | null;
  requestedAt: Date | null;
  reviewedAt: Date | null;
}

/**
 * What one member of a group can see about another: a name, and nothing else.
 * Date of birth and address are for the group's leaders, never for peers.
 */
export interface CsgPeer {
  id: number;
  name: string;
  joinedAt: Date;
}

/** What a group leader sees - the full registration, for approved members and requests. */
export interface CsgMemberSummary {
  id: number;
  status: MembershipStatus;
  joinedAt: Date;
  reviewedAt: Date | null;
  fullName: string | null;
  dateOfBirth: Date | null;
  addressStreet: string | null;
  addressArea: string | null;
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
  byCsg: Array<{ id: number; name: string; memberCount: number; pendingCount: number }>;
}

/** The only rows that count as members anywhere in this service. */
const MEMBER: Prisma.CsgMembershipWhereInput = { status: 'APPROVED', isActive: true };

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Validates and normalises a join request. Returns an error string for the
 * member, or the cleaned values. The date of birth must be a real calendar
 * date, in the past, and within a plausible lifetime - a typo like 2205 or
 * 1025 would otherwise sit in front of a group leader looking like data.
 */
export function validateJoinRequest(
  input: Partial<Record<keyof JoinRequest, unknown>>,
  now: Date = new Date(),
): { ok: true; value: { fullName: string; dateOfBirth: Date; addressStreet: string; addressArea: string } } | { ok: false; error: string } {
  const text = (v: unknown) => (typeof v === 'string' ? v.trim().replace(/\s+/g, ' ') : '');
  const fullName = text(input.fullName);
  const addressStreet = text(input.addressStreet);
  const addressArea = text(input.addressArea);
  const dob = text(input.dateOfBirth);

  if (fullName.length < 2) return { ok: false, error: 'Please enter your full name.' };
  if (fullName.length > 120) return { ok: false, error: 'That name is too long.' };
  if (addressStreet.length < 3) return { ok: false, error: 'Please enter your street address.' };
  if (addressStreet.length > 200) return { ok: false, error: 'That street address is too long.' };
  if (addressArea.length < 2) return { ok: false, error: 'Please enter your area.' };
  if (addressArea.length > 120) return { ok: false, error: 'That area is too long.' };

  const m = DATE_RE.exec(dob);
  if (!m) return { ok: false, error: 'Please enter your date of birth.' };
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(Date.UTC(y, mo - 1, d));
  // Round-trip check rejects impossible dates like 2001-02-30.
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== mo - 1 || date.getUTCDate() !== d) {
    return { ok: false, error: 'That date of birth is not a real date.' };
  }
  if (date.getTime() >= now.getTime()) return { ok: false, error: 'Your date of birth must be in the past.' };
  if (now.getUTCFullYear() - y > 120) return { ok: false, error: 'Please check the year of your date of birth.' };

  return { ok: true, value: { fullName, dateOfBirth: date, addressStreet, addressArea } };
}

/** memberCount is denormalised; never let it go negative. */
async function decrementMemberCount(tx: Prisma.TransactionClient, csgId: number): Promise<void> {
  await tx.csg.updateMany({
    where: { id: csgId, memberCount: { gt: 0 } },
    data: { memberCount: { decrement: 1 } },
  });
}

const fail = (error: string, e: unknown) => ({
  success: false as const,
  error,
  details: e instanceof Error ? e.message : 'Unknown error',
});

export class CsgService {
  static async getAllCsgs(): Promise<ServiceResponse<Csg[]>> {
    try {
      const csgs = await prisma.csg.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
      });
      return { success: true, data: csgs };
    } catch (error) {
      return fail('Failed to fetch CSGs', error);
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
      return fail('Failed to fetch CSG', error);
    }
  }

  // ─── The member's own view ───

  /** The caller's standing in one group - replaces inferring it from a 403. */
  static async getMyMembership(csgId: number, appUserId: number): Promise<ServiceResponse<MyMembership>> {
    try {
      const row = await prisma.csgMembership.findUnique({
        where: { csgId_appUserId: { csgId, appUserId } },
      });
      const live = row && row.isActive;
      return {
        success: true,
        data: {
          csgId,
          status: live ? row.status : 'NONE',
          membershipId: live ? row.id : null,
          requestedAt: live ? row.joinedAt : null,
          reviewedAt: live ? row.reviewedAt : null,
        },
      };
    } catch (error) {
      return fail('Failed to fetch membership', error);
    }
  }

  /** Every group the caller belongs to or has asked to join - for "Your groups". */
  static async getMyMemberships(appUserId: number): Promise<ServiceResponse<MyMembership[]>> {
    try {
      const rows = await prisma.csgMembership.findMany({
        where: { appUserId, isActive: true, status: { in: ['PENDING', 'APPROVED'] }, csg: { isActive: true } },
        orderBy: { joinedAt: 'desc' },
      });
      return {
        success: true,
        data: rows.map((r) => ({
          csgId: r.csgId,
          status: r.status,
          membershipId: r.id,
          requestedAt: r.joinedAt,
          reviewedAt: r.reviewedAt,
        })),
      };
    } catch (error) {
      return fail('Failed to fetch memberships', error);
    }
  }

  /**
   * Ask to join. Creates a PENDING request carrying the registration details,
   * or refreshes the member's existing row: the (csgId, appUserId) pair is
   * unique, so someone who was declined or left re-applies on the same row.
   * An approved member asking again is a no-op, not a demotion to PENDING.
   */
  static async requestToJoin(
    csgId: number,
    appUserId: number,
    input: Partial<Record<keyof JoinRequest, unknown>>,
  ): Promise<ServiceResponse<MyMembership>> {
    const parsed = validateJoinRequest(input);
    if (!parsed.ok) return { success: false, error: parsed.error };

    try {
      const csg = await prisma.csg.findUnique({ where: { id: csgId } });
      if (!csg || !csg.isActive) {
        return { success: false, error: 'CSG not found' };
      }

      const existing = await prisma.csgMembership.findUnique({
        where: { csgId_appUserId: { csgId, appUserId } },
      });

      if (existing && existing.isActive && existing.status === 'APPROVED') {
        return this.getMyMembership(csgId, appUserId);
      }

      const fields = {
        ...parsed.value,
        status: 'PENDING' as const,
        isActive: true,
        joinedAt: new Date(),
        leftAt: null,
        reviewedAt: null,
        reviewedByAdminId: null,
      };

      if (existing) {
        await prisma.csgMembership.update({ where: { id: existing.id }, data: fields });
      } else {
        await prisma.csgMembership.create({ data: { csgId, appUserId, ...fields } });
      }

      return this.getMyMembership(csgId, appUserId);
    } catch (error) {
      return fail('Failed to send join request', error);
    }
  }

  /**
   * Leave a group, or withdraw a request that hasn't been answered. Only an
   * approved member was ever counted, so only leaving one decrements.
   */
  static async leaveCsg(csgId: number, appUserId: number): Promise<ServiceResponse<{ id: number }>> {
    try {
      const existing = await prisma.csgMembership.findUnique({
        where: { csgId_appUserId: { csgId, appUserId } },
      });
      if (!existing || !existing.isActive) {
        return { success: false, error: 'Membership not found' };
      }

      await prisma.$transaction(async (tx) => {
        await tx.csgMembership.update({
          where: { id: existing.id },
          data: { isActive: false, leftAt: new Date() },
        });
        if (existing.status === 'APPROVED') await decrementMemberCount(tx, csgId);
      });

      return { success: true, data: { id: existing.id } };
    } catch (error) {
      return fail('Failed to leave CSG', error);
    }
  }

  static async getCsgUpdates(csgId: number, appUserId: number): Promise<ServiceResponse<CsgUpdate[]>> {
    try {
      const membership = await prisma.csgMembership.findFirst({ where: { csgId, appUserId, ...MEMBER } });
      if (!membership) {
        return { success: false, error: 'Not a member of this CSG' };
      }
      const updates = await prisma.csgUpdate.findMany({
        where: { csgId },
        orderBy: { createdAt: 'desc' },
      });
      return { success: true, data: updates };
    } catch (error) {
      return fail('Failed to fetch CSG updates', error);
    }
  }

  /**
   * The group's member list, for its approved members only. Names only: the
   * name they registered with, falling back to their account name for members
   * who joined before registration existed.
   */
  static async getPeers(csgId: number, appUserId: number): Promise<ServiceResponse<CsgPeer[]>> {
    try {
      const self = await prisma.csgMembership.findFirst({ where: { csgId, appUserId, ...MEMBER } });
      if (!self) {
        return { success: false, error: 'Not a member of this CSG' };
      }
      const rows = await prisma.csgMembership.findMany({
        where: { csgId, ...MEMBER },
        orderBy: { joinedAt: 'asc' },
        select: { id: true, fullName: true, joinedAt: true, appUser: { select: { displayName: true } } },
      });
      return {
        success: true,
        data: rows.map((r) => ({
          id: r.id,
          name: r.fullName || r.appUser.displayName || 'Member',
          joinedAt: r.joinedAt,
        })),
      };
    } catch (error) {
      return fail('Failed to fetch members', error);
    }
  }

  static async rsvp(csgId: number, appUserId: number): Promise<ServiceResponse<CsgMembership>> {
    try {
      const existing = await prisma.csgMembership.findFirst({ where: { csgId, appUserId, ...MEMBER } });
      if (!existing) {
        return { success: false, error: 'Not a member of this CSG' };
      }
      const membership = await prisma.csgMembership.update({
        where: { id: existing.id },
        data: { lastRsvpAt: new Date() },
      });
      return { success: true, data: membership };
    } catch (error) {
      return fail('Failed to record RSVP', error);
    }
  }

  // ─── Group leaders ───

  static async getAdminMembers(
    csgId: number,
    status: MembershipStatus = 'APPROVED',
  ): Promise<ServiceResponse<CsgMemberSummary[]>> {
    try {
      const memberships = await prisma.csgMembership.findMany({
        where: { csgId, status, isActive: true },
        // Requests oldest-first so nobody waits at the bottom of the queue;
        // members newest-first, which is how leaders look for someone new.
        orderBy: { joinedAt: status === 'PENDING' ? 'asc' : 'desc' },
        select: {
          id: true,
          status: true,
          joinedAt: true,
          reviewedAt: true,
          fullName: true,
          dateOfBirth: true,
          addressStreet: true,
          addressArea: true,
          appUser: { select: { id: true, email: true, displayName: true, photoUrl: true } },
        },
      });
      return { success: true, data: memberships };
    } catch (error) {
      return fail('Failed to fetch CSG members', error);
    }
  }

  /**
   * Approve or decline a request. The membership must belong to this group -
   * the route's CSG-admin check is on :id, so without this a leader of one
   * group could answer requests for another by guessing a membership id.
   */
  static async reviewRequest(
    csgId: number,
    membershipId: number,
    adminId: number,
    decision: 'APPROVED' | 'REJECTED',
  ): Promise<ServiceResponse<{ id: number; status: MembershipStatus }>> {
    try {
      const membership = await prisma.csgMembership.findFirst({
        where: { id: membershipId, csgId, isActive: true },
        include: { csg: { select: { name: true } } },
      });
      if (!membership) {
        return { success: false, error: 'Request not found' };
      }
      if (membership.status !== 'PENDING') {
        return { success: false, error: 'This request has already been answered' };
      }

      await prisma.$transaction(async (tx) => {
        // Conditional on PENDING so two leaders approving at once count once.
        const updated = await tx.csgMembership.updateMany({
          where: { id: membershipId, status: 'PENDING' },
          data: { status: decision, reviewedAt: new Date(), reviewedByAdminId: adminId },
        });
        if (updated.count === 1 && decision === 'APPROVED') {
          await tx.csg.update({ where: { id: csgId }, data: { memberCount: { increment: 1 } } });
        }
      });

      await PushAudience.toAppUsers([membership.appUserId], decision === 'APPROVED'
        ? {
            title: `Welcome to ${membership.csg.name}`,
            body: 'Your request to join was approved. You can now see the group and its members.',
            data: { url: `/csg/${csgId}` },
          }
        : {
            title: membership.csg.name,
            body: 'Your request to join was not approved this time. You can reach the group through Contact.',
            data: { url: `/csg/${csgId}` },
          });

      return { success: true, data: { id: membershipId, status: decision } };
    } catch (error) {
      return fail('Failed to update request', error);
    }
  }

  static async removeMember(csgId: number, membershipId: number): Promise<ServiceResponse<{ id: number }>> {
    try {
      const membership = await prisma.csgMembership.findFirst({
        where: { id: membershipId, csgId, isActive: true },
      });
      if (!membership) {
        return { success: false, error: 'Membership not found' };
      }

      await prisma.$transaction(async (tx) => {
        await tx.csgMembership.update({
          where: { id: membershipId },
          data: { isActive: false, leftAt: new Date() },
        });
        if (membership.status === 'APPROVED') await decrementMemberCount(tx, csgId);
      });

      return { success: true, data: { id: membershipId } };
    } catch (error) {
      return fail('Failed to remove member', error);
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
        // Never lets a push failure fail the update itself.
        await PushAudience.toCsgMembers(csgId, {
          title: payload.title || csg.name,
          body: payload.body.substring(0, 150),
          data: { url: `/csg/${csgId}` },
        });
      }

      return { success: true, data: update };
    } catch (error) {
      return fail('Failed to create CSG update', error);
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

  static async getAdminStats(): Promise<ServiceResponse<CsgAdminStats>> {
    try {
      const [csgs, totalActiveMembers, pending] = await Promise.all([
        prisma.csg.findMany({
          where: { isActive: true },
          select: { id: true, name: true, memberCount: true },
          orderBy: { name: 'asc' },
        }),
        prisma.csgMembership.count({ where: MEMBER }),
        prisma.csgMembership.groupBy({
          by: ['csgId'],
          where: { status: 'PENDING', isActive: true },
          _count: { _all: true },
        }),
      ]);
      const pendingBy = new Map(pending.map((p) => [p.csgId, p._count._all]));

      return {
        success: true,
        data: {
          totalCsgs: csgs.length,
          totalActiveMembers,
          byCsg: csgs.map((c) => ({ ...c, pendingCount: pendingBy.get(c.id) ?? 0 })),
        },
      };
    } catch (error) {
      return fail('Failed to fetch CSG statistics', error);
    }
  }
}
