// backend/src/controllers/device.controller.ts
import { Response } from 'express';
import { DeviceService } from '../services/device.service';
import { sendSuccess, sendError } from '../utils/responses';
import { AuthenticatedUserRequest } from '../types';

export class DeviceController {
  static async registerDevice(req: AuthenticatedUserRequest, res: Response): Promise<void> {
    try {
      const { token, platform, csgId, topics } = req.body;

      if (!token || typeof token !== 'string') {
        sendError(res, 'Missing required field: token', 400);
        return;
      }

      const result = await DeviceService.upsertToken(
        {
          token,
          platform: typeof platform === 'string' ? platform : undefined,
          csgId: csgId !== undefined && csgId !== null ? Number(csgId) : undefined,
          topics: Array.isArray(topics) ? topics : undefined,
        },
        req.appUser
      );

      if (result.success) {
        sendSuccess(res, 'Device registered successfully', result.data, 200);
      } else {
        sendError(res, result.error, 400, result.details);
      }
    } catch (error) {
      sendError(res, 'Failed to register device', 500, error);
    }
  }

  static async deleteDevice(req: AuthenticatedUserRequest, res: Response): Promise<void> {
    try {
      const { token } = req.params;

      if (!token) {
        sendError(res, 'Missing required parameter: token', 400);
        return;
      }

      const result = await DeviceService.deleteToken(token);

      if (result.success) {
        sendSuccess(res, 'Device token deleted successfully', result.data);
      } else {
        const statusCode = result.error === 'Push token not found' ? 404 : 500;
        sendError(res, result.error, statusCode, result.details);
      }
    } catch (error) {
      sendError(res, 'Failed to delete device token', 500, error);
    }
  }
}
