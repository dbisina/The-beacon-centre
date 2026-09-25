// backend/src/controllers/appUserAuth.controller.ts
import { Response } from 'express';
import { AppUserAuthService, INVALID_CREDENTIALS } from '../services/appUserAuth.service';
import { sendSuccess, sendError } from '../utils/responses';
import { AuthenticatedUserRequest } from '../types';
import { passcodeThrottle, throttleKey } from '../middleware/loginThrottle';

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
      const key = throttleKey(email ?? '');

      // Refuse before checking the passcode, so a locked account gives an
      // attacker no signal about whether a guess was right.
      const retryAfter = key ? passcodeThrottle.retryAfterSeconds(key) : 0;
      if (retryAfter > 0) {
        res.set('Retry-After', String(retryAfter));
        const minutes = Math.ceil(retryAfter / 60);
        sendError(
          res,
          `Too many wrong passcodes. Try again in ${minutes} minute${minutes === 1 ? '' : 's'}.`,
          429,
        );
        return;
      }

      const result = await AppUserAuthService.login(email ?? '', passcode ?? '');

      if (result.success) {
        passcodeThrottle.reset(key);
        sendSuccess(res, 'Signed in', result.data);
      } else {
        // Only a wrong email/passcode pair counts. Missing fields or a
        // database hiccup aren't guesses and shouldn't lock anyone out.
        if (key && result.error === INVALID_CREDENTIALS) {
          passcodeThrottle.recordFailure(key);
        }
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
