import { apiGet, apiPost } from '@/config/api';

/**
 * CSGs (Community Service Groups) — backed by the real backend
 * (backend/src/routes/csg.routes.ts, csg.controller.ts, csg.service.ts).
 *
 * The list/detail routes are public. Everything about the caller's own
 * membership needs a signed-in member (config/api.ts attaches the token), and
 * guests get a 401 that is left to propagate - the screen decides how to react.
 *
 * Joining is a request: it carries the member's registration details and
 * waits for a group leader to approve it. Only an approved member sees the
 * group's updates and member list.
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

/** Mirrors the Prisma `CsgMembership` model — returned by rsvp. */
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

export type MembershipStatus = 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED';

/** The caller's own standing in one group. */
export type MyMembership = {
  csgId: number;
  status: MembershipStatus;
  membershipId: number | null;
  requestedAt: string | null;
  reviewedAt: string | null;
};

/** A fellow member, as another member sees them: a name, nothing more. */
export type CsgPeer = { id: number; name: string; joinedAt: string };

/** What a member submits to ask to join. `dateOfBirth` is YYYY-MM-DD. */
export type JoinRequest = {
  fullName: string;
  dateOfBirth: string;
  addressStreet: string;
  addressArea: string;
};

/** GET /api/csgs/{id}/membership — the caller's standing; requires sign-in. */
export function fetchMyMembership(id: number | string): Promise<MyMembership> {
  return apiGet<MyMembership>(`/csgs/${id}/membership`);
}

/** GET /api/csgs/mine — groups the caller belongs to or has asked to join. */
export function fetchMyMemberships(): Promise<MyMembership[]> {
  return apiGet<MyMembership[]>('/csgs/mine');
}

/** GET /api/csgs/{id}/members — fellow members' names; approved members only. */
export function fetchCsgPeers(id: number | string): Promise<CsgPeer[]> {
  return apiGet<CsgPeer[]>(`/csgs/${id}/members`);
}

/** POST /api/csgs/{id}/join — sends a request for a leader to approve. */
export function requestToJoinCsg(id: number | string, request: JoinRequest): Promise<MyMembership> {
  return apiPost<MyMembership>(`/csgs/${id}/join`, request);
}

/** POST /api/csgs/{id}/leave — leaves, or withdraws an unanswered request. */
export function leaveCsg(id: number | string): Promise<{ id: number }> {
  return apiPost<{ id: number }>(`/csgs/${id}/leave`);
}

/** POST /api/csgs/{id}/rsvp — requires sign-in AND an approved membership. */
export function rsvpCsg(id: number | string): Promise<CsgMembership> {
  return apiPost<CsgMembership>(`/csgs/${id}/rsvp`);
}
