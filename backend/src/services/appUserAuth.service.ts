// backend/src/services/appUserAuth.service.ts
// Lightweight app-user auth: email + name + a 4-6 digit passcode (not a
// password). Separate from admin auth.service.ts (different actor, different
// token payload shape) and from the Firebase path in user.middleware.ts
// (that one's for a future resumption of Firebase auth, this is our own).
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { ServiceResponse } from '../types';
import { JWT_SECRET } from '../config/jwtSecrets';

const PASSCODE_RE = /^\d{4,6}$/;

/**
 * The one failure that counts as a guess. loginThrottle keys its lockout on
 * this exact value, so it lives here rather than as two string literals that
 * could drift apart and silently switch the lockout off.
 */
export const INVALID_CREDENTIALS = 'Invalid email or passcode';

export interface AppUserAuthResponse {
  user: { id: number; email: string | null; name: string | null };
  token: string;
}

function issueToken(appUserId: number): string {
  // No expiry-driven logout - the token is valid for a year, effectively
  // "until the user signs out themselves" without needing a refresh flow.
  return jwt.sign({ appUserId, type: 'app_user' }, JWT_SECRET, { expiresIn: '365d' });
}

function toPublicUser(u: { id: number; email: string | null; displayName: string | null }) {
  return { id: u.id, email: u.email, name: u.displayName };
}

export class AppUserAuthService {
  static async signup(name: string, email: string, passcode: string): Promise<ServiceResponse<AppUserAuthResponse>> {
    if (!name?.trim()) {
      return { success: false, error: 'Name is required' };
    }
    if (!email?.trim() || !email.includes('@')) {
      return { success: false, error: 'A valid email is required' };
    }
    if (!PASSCODE_RE.test(passcode ?? '')) {
      return { success: false, error: 'Passcode must be 4-6 digits' };
    }

    const normalizedEmail = email.trim().toLowerCase();

    try {
      const existing = await prisma.appUser.findUnique({ where: { email: normalizedEmail } });
      if (existing) {
        return { success: false, error: 'An account with this email already exists' };
      }

      const passcodeHash = await bcrypt.hash(passcode, 10);
      const user = await prisma.appUser.create({
        data: {
          email: normalizedEmail,
          displayName: name.trim(),
          passcodeHash,
          lastSeenAt: new Date(),
        },
      });

      return { success: true, data: { user: toPublicUser(user), token: issueToken(user.id) } };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to create account',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async login(email: string, passcode: string): Promise<ServiceResponse<AppUserAuthResponse>> {
    if (!email?.trim() || !passcode) {
      return { success: false, error: 'Email and passcode are required' };
    }

    const normalizedEmail = email.trim().toLowerCase();

    try {
      const user = await prisma.appUser.findUnique({ where: { email: normalizedEmail } });
      if (!user || !user.passcodeHash) {
        return { success: false, error: INVALID_CREDENTIALS };
      }

      const valid = await bcrypt.compare(passcode, user.passcodeHash);
      if (!valid) {
        return { success: false, error: INVALID_CREDENTIALS };
      }

      await prisma.appUser.update({ where: { id: user.id }, data: { lastSeenAt: new Date() } });

      return { success: true, data: { user: toPublicUser(user), token: issueToken(user.id) } };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to sign in',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Apple App Review guideline 5.1.1(v): any app offering account creation
   * must also offer in-app account deletion, and deleting an account has to
   * delete the member's data - not just the login.
   *
   * Cascade covers memberships, saves, notes, progress, RSVPs, push tokens and
   * payment methods. It does NOT cover prayer requests, contact messages or
   * event registrations: those relations are SetNull, so deleting only the
   * AppUser row used to leave every one of them behind, still carrying the
   * member's name, email, phone and what they wrote - while Settings told them
   * "everything" was gone. They're deleted explicitly here, before the user row,
   * because once SetNull has run there's no appUserId left to find them by.
   *
   * Giving transactions are the one deliberate exception: they stay (SetNull)
   * as financial records, and the privacy policy says so.
   */
  static async deleteAccount(appUserId: number): Promise<ServiceResponse<{ id: number }>> {
    try {
      await prisma.$transaction(async (tx) => {
        // memberCount is a denormalised counter; the membership rows are about
        // to cascade away, so give their groups the count back first.
        // Only approved members were ever counted; a pending request wasn't.
        const memberships = await tx.csgMembership.findMany({
          where: { appUserId, isActive: true, status: 'APPROVED' },
          select: { csgId: true },
        });
        for (const { csgId } of memberships) {
          await tx.csg.updateMany({
            where: { id: csgId, memberCount: { gt: 0 } },
            data: { memberCount: { decrement: 1 } },
          });
        }

        await tx.prayerRequest.deleteMany({ where: { appUserId } });
        await tx.contactMessage.deleteMany({ where: { appUserId } });
        await tx.eventRegistration.deleteMany({ where: { appUserId } });
        await tx.appUser.delete({ where: { id: appUserId } });
      });
      return { success: true, data: { id: appUserId } };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to delete account',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async me(appUserId: number): Promise<ServiceResponse<{ id: number; email: string | null; name: string | null }>> {
    try {
      const user = await prisma.appUser.findUnique({ where: { id: appUserId } });
      if (!user) {
        return { success: false, error: 'User not found' };
      }
      return { success: true, data: toPublicUser(user) };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to load user',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
