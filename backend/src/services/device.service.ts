// backend/src/services/device.service.ts
import { prisma } from '../config/database';
import { ServiceResponse } from '../types';
import { PushToken, AppUser } from '@prisma/client';

export interface RegisterDeviceRequest {
  token: string;
  platform?: string;
  csgId?: number;
  topics?: string[];
}

export class DeviceService {
  // Upserts by the unique `token` field. appUserId is only ever SET when an
  // authenticated appUser is present on this request - a guest re-registering
  // a token that was previously linked to an account must not null it out.
  static async upsertToken(
    data: RegisterDeviceRequest,
    appUser?: AppUser
  ): Promise<ServiceResponse<PushToken>> {
    try {
      const { token, platform, csgId, topics } = data;

      const pushToken = await prisma.pushToken.upsert({
        where: { token },
        create: {
          token,
          platform: platform ?? null,
          csgId: csgId ?? null,
          topics: topics ?? [],
          isActive: true,
          lastRegisteredAt: new Date(),
          ...(appUser && { appUserId: appUser.id }),
        },
        update: {
          platform: platform ?? null,
          csgId: csgId ?? null,
          topics: topics ?? [],
          isActive: true,
          lastRegisteredAt: new Date(),
          ...(appUser && { appUserId: appUser.id }),
        },
      });

      return {
        success: true,
        data: pushToken,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to register device token',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async deleteToken(token: string): Promise<ServiceResponse<{ token: string }>> {
    try {
      const existing = await prisma.pushToken.findUnique({ where: { token } });

      if (!existing) {
        return {
          success: false,
          error: 'Push token not found',
        };
      }

      await prisma.pushToken.delete({ where: { token } });

      return {
        success: true,
        data: { token },
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to delete device token',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
