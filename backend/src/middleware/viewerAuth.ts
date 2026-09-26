// backend/src/middleware/viewerAuth.ts
import { Request, Response, NextFunction } from 'express';
import { optionalAuth } from './auth.middleware';
import { optionalAuthenticateUser } from './user.middleware';
import { AuthenticatedRequest, AuthenticatedUserRequest } from '../types';
import type { AnnouncementViewer } from '../services/announcement.service';

/**
 * Identifies the reader of a public route without requiring one: an admin
 * (sees everything), a signed-in member (also sees their groups' content), or
 * a guest. The member check only runs when there's no admin, so dashboard
 * requests don't also go through - and log a failure from - member token
 * verification.
 */
export const viewerAuth = (req: Request, res: Response, next: NextFunction) =>
  optionalAuth(req as AuthenticatedRequest, res, () => {
    if ((req as AuthenticatedRequest).admin) return next();
    return optionalAuthenticateUser(req as AuthenticatedUserRequest, res, next);
  });

/** Who viewerAuth found. */
export const viewerOf = (req: Request): AnnouncementViewer => ({
  isAdmin: !!(req as AuthenticatedRequest).admin,
  appUserId: (req as AuthenticatedUserRequest).appUser?.id,
});
