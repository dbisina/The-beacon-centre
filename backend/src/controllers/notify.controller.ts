// backend/src/controllers/notify.controller.ts
import { Response } from 'express';
import { prisma } from '../config/database';
import { PushService } from '../services/push.service';
import { sendSuccess, sendError } from '../utils/responses';
import { AuthenticatedRequest } from '../types';

interface SendNotificationRequest {
  audience: 'all' | 'topic' | 'csg';
  topic?: string;
  csgId?: number;
  title: string;
  body: string;
  data?: Record<string, any>;
}

export class NotifyController {
  static async sendNotification(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { audience, topic, csgId, title, body, data }: SendNotificationRequest = req.body;

      if (!audience || !['all', 'topic', 'csg'].includes(audience)) {
        sendError(res, 'audience must be one of: all, topic, csg', 400);
        return;
      }

      if (audience === 'topic' && !topic) {
        sendError(res, 'topic is required when audience is "topic"', 400);
        return;
      }

      if (audience === 'csg' && (csgId === undefined || csgId === null)) {
        sendError(res, 'csgId is required when audience is "csg"', 400);
        return;
      }

      if (!title || !body) {
        sendError(res, 'Missing required fields: title and body', 400);
        return;
      }

      const where: any = { isActive: true };
      if (audience === 'topic') {
        where.topics = { has: topic };
      } else if (audience === 'csg') {
        where.csgId = Number(csgId);
      }

      const pushTokens = await prisma.pushToken.findMany({
        where,
        select: { token: true },
      });
      const tokens = pushTokens.map((pt) => pt.token);

      const sendResult = await PushService.sendToTokens(tokens, { title, body, data });

      if (sendResult.invalidTokens.length > 0) {
        await prisma.pushToken.updateMany({
          where: { token: { in: sendResult.invalidTokens } },
          data: { isActive: false },
        });
      }

      sendSuccess(res, 'Notification sent successfully', {
        successCount: sendResult.successCount,
        invalidCount: sendResult.invalidTokens.length,
        totalTargeted: tokens.length,
      });
    } catch (error) {
      sendError(res, 'Failed to send notification', 500, error);
    }
  }
}
