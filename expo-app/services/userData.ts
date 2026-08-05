import { apiGet, apiPost, apiPut, apiDelete } from '@/config/api';

/**
 * "My data" — saves, notes, and playback progress — backed by the real
 * backend (backend/src/routes/user.routes.ts, user.controller.ts,
 * user.service.ts), mounted at /api/users.
 *
 * Every route here requires a signed-in Firebase user (authenticateUser
 * middleware) and is scoped server-side to the caller's own account —
 * config/api.ts already attaches the ID token automatically when
 * `auth.currentUser` exists. Guests will get a 401 from the backend; that
 * error is left to propagate here, same convention as services/csg.ts.
 */

/** Mirrors the backend's Prisma `ContentType` enum (backend/prisma/schema.prisma). */
export type ContentType = 'DEVOTIONAL' | 'VIDEO_SERMON' | 'AUDIO_SERMON' | 'ANNOUNCEMENT';

/** Mirrors the Prisma `UserSave` model. Dates arrive as ISO strings over JSON. */
export type UserSave = {
  id: number;
  appUserId: number;
  contentType: ContentType;
  contentId: number;
  createdAt: string;
};

/** Mirrors the Prisma `UserNote` model. */
export type UserNote = {
  id: number;
  appUserId: number;
  contentType: ContentType;
  contentId: number;
  body: string;
  createdAt: string;
  updatedAt: string;
};

/** Mirrors the Prisma `UserProgress` model. */
export type UserProgress = {
  id: number;
  appUserId: number;
  contentType: ContentType;
  contentId: number;
  positionSeconds: number;
  durationSeconds: number | null;
  completed: boolean;
  updatedAt: string;
};

export type MergeGuestDataPayload = {
  saves?: Array<{ contentType: ContentType; contentId: number }>;
  notes?: Array<{ contentType: ContentType; contentId: number; body: string }>;
  progress?: Array<{
    contentType: ContentType;
    contentId: number;
    positionSeconds: number;
    durationSeconds?: number;
    completed?: boolean;
  }>;
};

export type MergeGuestDataResult = {
  savesMerged: number;
  notesMerged: number;
  progressMerged: number;
};

/* --------------------------------------------------------------- saves --- */

/** GET /api/users/me/saves — optionally filtered to one content type. */
export function fetchSaves(contentType?: ContentType): Promise<UserSave[]> {
  return apiGet<UserSave[]>('/users/me/saves', contentType ? { contentType } : undefined);
}

/** POST /api/users/me/saves — idempotent (upserts server-side). */
export function createSave(contentType: ContentType, contentId: number): Promise<UserSave> {
  return apiPost<UserSave>('/users/me/saves', { contentType, contentId });
}

/** DELETE /api/users/me/saves/{contentType}/{contentId} — a no-op success if not saved. */
export function deleteSave(contentType: ContentType, contentId: number): Promise<{ deleted: boolean }> {
  return apiDelete<{ deleted: boolean }>(`/users/me/saves/${contentType}/${contentId}`);
}

/* --------------------------------------------------------------- notes --- */

/** GET /api/users/me/notes — optionally filtered by content type and/or content id. */
export function fetchNotes(contentType?: ContentType, contentId?: number): Promise<UserNote[]> {
  const params: Record<string, any> = {};
  if (contentType) params.contentType = contentType;
  if (contentId !== undefined) params.contentId = contentId;
  return apiGet<UserNote[]>('/users/me/notes', Object.keys(params).length ? params : undefined);
}

/** PUT /api/users/me/notes/{contentType}/{contentId} — creates or updates the note. */
export function upsertNote(contentType: ContentType, contentId: number, body: string): Promise<UserNote> {
  return apiPut<UserNote>(`/users/me/notes/${contentType}/${contentId}`, { body });
}

/** DELETE /api/users/me/notes/{contentType}/{contentId} — a no-op success if there was none. */
export function deleteNote(contentType: ContentType, contentId: number): Promise<{ deleted: boolean }> {
  return apiDelete<{ deleted: boolean }>(`/users/me/notes/${contentType}/${contentId}`);
}

/* ----------------------------------------------------------- progress --- */

/** GET /api/users/me/progress/{contentType}/{contentId} — null if never recorded. */
export function fetchProgress(contentType: ContentType, contentId: number): Promise<UserProgress | null> {
  return apiGet<UserProgress | null>(`/users/me/progress/${contentType}/${contentId}`);
}

/** PUT /api/users/me/progress/{contentType}/{contentId} — creates or updates the record. */
export function upsertProgress(
  contentType: ContentType,
  contentId: number,
  positionSeconds: number,
  durationSeconds?: number,
  completed?: boolean
): Promise<UserProgress> {
  return apiPut<UserProgress>(`/users/me/progress/${contentType}/${contentId}`, {
    positionSeconds,
    ...(durationSeconds !== undefined && { durationSeconds }),
    ...(completed !== undefined && { completed }),
  });
}

/* ------------------------------------------------------- guest-data merge --- */

/**
 * POST /api/users/me/merge-guest-data — called once right after a guest
 * signs up/in (see services/auth.tsx mergeGuestData). The backend silently
 * skips any item it can't validate rather than failing the whole request.
 */
export function mergeGuestDataToBackend(payload: MergeGuestDataPayload): Promise<MergeGuestDataResult> {
  return apiPost<MergeGuestDataResult>('/users/me/merge-guest-data', payload);
}
