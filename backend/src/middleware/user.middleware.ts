// backend/src/middleware/user.middleware.ts
// End-user (mobile app) auth - separate from admin auth.middleware.ts since
// it identifies a different actor (AppUser, not Admin). Accepts two token
// types: our own JWT (email+passcode auth, see appUserAuth.service.ts -
// checked first, verified locally, no network call) or a Firebase ID token
// (kept for if that path ever resumes - see _archived/auth.firebase.tsx).
import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { verifyFirebaseIdToken } from '../config/firebaseAdmin';
import { sendError } from '../utils/responses';
import { AuthenticatedUserRequest, AppUser } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'beacon-centre-dev-secret-key';

const extractToken = (req: AuthenticatedUserRequest): string | null => {
  const authHeader = req.headers.authorization;
  return authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;
};

// Looks up the AppUser by firebaseUid, auto-provisioning on first sight.
const resolveFirebaseAppUser = async (decoded: { uid: string; email?: string; name?: string; picture?: string }) => {
  const existing = await prisma.appUser.findUnique({ where: { firebaseUid: decoded.uid } });
  if (existing) {
    return prisma.appUser.update({
      where: { id: existing.id },
      data: { lastSeenAt: new Date() },
    });
  }
  return prisma.appUser.create({
    data: {
      firebaseUid: decoded.uid,
      email: decoded.email,
      displayName: decoded.name,
      photoUrl: decoded.picture,
      lastSeenAt: new Date(),
    },
  });
};

const resolveFromOwnToken = async (token: string): Promise<AppUser | null> => {
  let decoded: { appUserId: number; type: string };
  try {
    decoded = jwt.verify(token, JWT_SECRET) as { appUserId: number; type: string };
  } catch {
    return null;
  }
  if (decoded.type !== 'app_user') return null;

  const user = await prisma.appUser.findUnique({ where: { id: decoded.appUserId } });
  if (!user) return null;
  return prisma.appUser.update({ where: { id: user.id }, data: { lastSeenAt: new Date() } });
};

// Required - rejects the request if there's no valid token of either kind.
// Use for anything that writes data as/for a specific user (join a CSG,
// register a push token tied to an account, saves/notes/progress).
export const authenticateUser = async (
  req: AuthenticatedUserRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const token = extractToken(req);
  if (!token) {
    sendError(res, 'Access token required', 401);
    return;
  }

  const ownUser = await resolveFromOwnToken(token);
  if (ownUser) {
    req.appUser = ownUser;
    next();
    return;
  }

  try {
    const decoded = await verifyFirebaseIdToken(token);
    req.appUser = await resolveFirebaseAppUser(decoded as any);
    next();
  } catch (error) {
    console.warn('authenticateUser: token verification failed', error);
    sendError(res, 'Invalid or expired token', 401);
  }
};

// Optional - never fails the request. Guests (no token) proceed with
// req.appUser undefined. Use for guest-friendly endpoints (giving/initialize,
// prayer requests, contact, device token registration).
export const optionalAuthenticateUser = async (
  req: AuthenticatedUserRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  const token = extractToken(req);
  if (!token) {
    next();
    return;
  }

  const ownUser = await resolveFromOwnToken(token);
  if (ownUser) {
    req.appUser = ownUser;
    next();
    return;
  }

  try {
    const decoded = await verifyFirebaseIdToken(token);
    req.appUser = await resolveFirebaseAppUser(decoded as any);
  } catch (error) {
    console.warn('optionalAuthenticateUser: token verification failed, continuing as guest', error);
  }
  next();
};
