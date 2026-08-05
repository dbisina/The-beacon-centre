// backend/src/services/push.service.ts
// Sends Expo push notifications. This service only talks to Expo's push API -
// it does not touch the database; callers (e.g. the notify/device services in
// Phase 3) are responsible for flipping PushToken.isActive=false for any
// token this returns in `invalidTokens`.
import { Expo, ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';

const expo = new Expo();

export interface PushNotificationInput {
  title: string;
  body: string;
  data?: Record<string, any>;
}

export interface PushSendResult {
  successCount: number;
  invalidTokens: string[];
}

export class PushService {
  static async sendToTokens(tokens: string[], notification: PushNotificationInput): Promise<PushSendResult> {
    const validTokens = tokens.filter((token) => Expo.isExpoPushToken(token));

    if (validTokens.length === 0) {
      return { successCount: 0, invalidTokens: tokens.filter((t) => !Expo.isExpoPushToken(t)) };
    }

    const messages: ExpoPushMessage[] = validTokens.map((token) => ({
      to: token,
      sound: 'default',
      title: notification.title,
      body: notification.body,
      data: notification.data,
    }));

    const chunks = expo.chunkPushNotifications(messages);
    const tickets: ExpoPushTicket[] = [];

    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        console.error('PushService: failed to send a notification chunk', error);
      }
    }

    const invalidTokens: string[] = tokens.filter((t) => !Expo.isExpoPushToken(t));
    let successCount = 0;

    tickets.forEach((ticket, index) => {
      if (ticket.status === 'ok') {
        successCount += 1;
        return;
      }
      // A ticket-level error (e.g. DeviceNotRegistered can also surface here,
      // not just in receipts) - map back to the token by position.
      const token = validTokens[index];
      if (token) invalidTokens.push(token);
    });

    return { successCount, invalidTokens };
  }
}
