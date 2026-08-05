import { apiGet, apiPost } from '@/config/api';

/**
 * CSGs (Community Small Groups) — backed by the real backend
 * (backend/src/routes/csg.routes.ts, csg.controller.ts, csg.service.ts).
 *
 * The list/detail routes are public. The member-facing routes (updates, join,
 * leave, rsvp) require a signed-in Firebase user — config/api.ts already
 * attaches the ID token automatically when `auth.currentUser` exists, so
 * guests will simply get a 401 from the backend. That error is left to
 * propagate here; the calling screen decides how to react (e.g. prompt
 * sign-in) rather than this module swallowing it.
 */

/** Mirrors the Prisma `Csg` model (backend/prisma/schema.prisma). Dates arrive
 *  as ISO strings over JSON, not Date instances. */
export type Csg = {
  id: number;
  name: string;
  description: string | null;
  meetsOn: string | null;
  meetingTime: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  coverImageUrl: string | null;
  coverImageCloudinaryPublicId: string | null;
  memberCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

/** Mirrors the Prisma `CsgUpdate` model. */
export type CsgUpdate = {
  id: number;
  csgId: number;
  authorAdminId: number | null;
  title: string | null;
  body: string;
  notifyMembers: boolean;
  createdAt: string;
  updatedAt: string;
};

/** Mirrors the Prisma `CsgMembership` model — returned by join/rsvp. */
export type CsgMembership = {
  id: number;
  csgId: number;
  appUserId: number;
  isActive: boolean;
  joinedAt: string;
  leftAt: string | null;
  lastRsvpAt: string | null;
};

/** GET /api/csgs — public list, no auth required. */
export function fetchCsgs(): Promise<Csg[]> {
  return apiGet<Csg[]>('/csgs');
}

/** GET /api/csgs/{id} — public detail, no auth required. */
export function fetchCsgById(id: number | string): Promise<Csg> {
  return apiGet<Csg>(`/csgs/${id}`);
}

/**
 * GET /api/csgs/{id}/updates — requires sign-in AND an active membership.
 * The backend 403s with "Not a member of this CSG" otherwise; that (and any
 * other) error is left to propagate so the caller can tell the two apart.
 */
export function fetchCsgUpdates(id: number | string): Promise<CsgUpdate[]> {
  return apiGet<CsgUpdate[]>(`/csgs/${id}/updates`);
}

/** POST /api/csgs/{id}/join — requires sign-in. */
export function joinCsg(id: number | string): Promise<CsgMembership> {
  return apiPost<CsgMembership>(`/csgs/${id}/join`);
}

/** POST /api/csgs/{id}/leave — requires sign-in. */
export function leaveCsg(id: number | string): Promise<{ id: number }> {
  return apiPost<{ id: number }>(`/csgs/${id}/leave`);
}

/** POST /api/csgs/{id}/rsvp — requires sign-in AND an active membership. */
export function rsvpCsg(id: number | string): Promise<CsgMembership> {
  return apiPost<CsgMembership>(`/csgs/${id}/rsvp`);
}
