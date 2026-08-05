// backend/src/services/appUserAuth.service.ts
// Lightweight app-user auth: email + name + a 4-6 digit passcode (not a
// password). Separate from admin auth.service.ts (different actor, different
// token payload shape) and from the Firebase path in user.middleware.ts
// (that one's for a future resumption of Firebase auth, this is our own).
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { ServiceResponse } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'beacon-centre-dev-secret-key';
const PASSCODE_RE = /^\d{4,6}$/;

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
        return { success: false, error: 'Invalid email or passcode' };
      }

      const valid = await bcrypt.compare(passcode, user.passcodeHash);
      if (!valid) {
        return { success: false, error: 'Invalid email or passcode' };
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
   * must also offer in-app account deletion. Hard-deletes the row - Prisma's
   * onDelete: Cascade on every AppUser relation (memberships, saves, notes,
   * progress, push tokens, payment methods) takes care of the rest. Giving
   * transactions keep appUserId nullable-on-delete by design (financial
   * records shouldn't vanish with the account) - check schema if that
   * changes.
   */
  static async deleteAccount(appUserId: number): Promise<ServiceResponse<{ id: number }>> {
    try {
      await prisma.appUser.delete({ where: { id: appUserId } });
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
