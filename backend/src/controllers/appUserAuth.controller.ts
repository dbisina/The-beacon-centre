// backend/src/controllers/appUserAuth.controller.ts
import { Response } from 'express';
import { AppUserAuthService } from '../services/appUserAuth.service';
import { sendSuccess, sendError } from '../utils/responses';
import { AuthenticatedUserRequest } from '../types';

export class AppUserAuthController {
  static async signup(req: AuthenticatedUserRequest, res: Response): Promise<void> {
    try {
      const { name, email, passcode } = req.body as { name?: string; email?: string; passcode?: string };
      const result = await AppUserAuthService.signup(name ?? '', email ?? '', passcode ?? '');

      if (result.success) {
        sendSuccess(res, 'Account created', result.data, 201);
      } else {
        sendError(res, result.error, 400, result.details);
      }
    } catch (error) {
      sendError(res, 'Failed to create account', 500, error);
    }
  }

  static async login(req: AuthenticatedUserRequest, res: Response): Promise<void> {
    try {
      const { email, passcode } = req.body as { email?: string; passcode?: string };
      const result = await AppUserAuthService.login(email ?? '', passcode ?? '');

      if (result.success) {
        sendSuccess(res, 'Signed in', result.data);
      } else {
        sendError(res, result.error, 401, result.details);
      }
    } catch (error) {
      sendError(res, 'Failed to sign in', 500, error);
    }
  }

  static async me(req: AuthenticatedUserRequest, res: Response): Promise<void> {
    if (!req.appUser) {
      sendError(res, 'Not authenticated', 401);
      return;
    }
    sendSuccess(res, 'Current user', {
      id: req.appUser.id,
      email: req.appUser.email,
      name: req.appUser.displayName,
    });
  }

  static async deleteAccount(req: AuthenticatedUserRequest, res: Response): Promise<void> {
    if (!req.appUser) {
      sendError(res, 'Not authenticated', 401);
      return;
    }
    try {
      const result = await AppUserAuthService.deleteAccount(req.appUser.id);
      if (result.success) {
        sendSuccess(res, 'Account deleted', result.data);
      } else {
        sendError(res, result.error, 500, result.details);
      }
    } catch (error) {
      sendError(res, 'Failed to delete account', 500, error);
    }
  }
}
