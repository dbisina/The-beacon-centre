// backend/src/services/pushAudience.service.ts
//
// Resolves *who* a push goes to, then hands tokens to PushService, which only
// talks to Expo and never touches the database.
//
// Group pushes used to target PushToken.csgId - a column the app never sets,
// so "notify members" on a CSG update reached nobody. Targeting by the member's
// account instead reaches every device they're signed in on, and stays right
// when they join a second group, which a single csgId on a token never could.
import { prisma } from '../config/database';
import { PushService, PushNotificationInput } from './push.service';

export class PushAudience {
  /**
   * Push to every active device signed in as one of these members. Never
   * throws: a failed push must not fail the action that triggered it (an
   * approval, an update post). Returns how many devices accepted it.
   */
  static async toAppUsers(appUserIds: number[], notification: PushNotificationInput): Promise<number> {
    if (appUserIds.length === 0) return 0;
    try {
      const rows = await prisma.pushToken.findMany({
        where: { appUserId: { in: appUserIds }, isActive: true },
        select: { token: true },
      });
      return await this.send(rows.map((r) => r.token), notification);
    } catch (error) {
      console.error('PushAudience: failed to push to app users', error);
      return 0;
    }
  }

  /** Push to every approved, active member of one group. */
  static async toCsgMembers(csgId: number, notification: PushNotificationInput): Promise<number> {
    try {
      const members = await prisma.csgMembership.findMany({
        where: { csgId, status: 'APPROVED', isActive: true },
        select: { appUserId: true },
      });
      return await this.toAppUsers(members.map((m) => m.appUserId), notification);
    } catch (error) {
      console.error('PushAudience: failed to push to CSG members', error);
      return 0;
    }
  }

  /** Push to every active device that opted into a topic. */
  static async toTopic(topic: string, notification: PushNotificationInput): Promise<number> {
    try {
      const rows = await prisma.pushToken.findMany({
        where: { isActive: true, topics: { has: topic } },
        select: { token: true },
      });
      return await this.send(rows.map((r) => r.token), notification);
    } catch (error) {
      console.error('PushAudience: failed to push to topic', topic, error);
      return 0;
    }
  }

  private static async send(tokens: string[], notification: PushNotificationInput): Promise<number> {
    if (tokens.length === 0) return 0;
    const result = await PushService.sendToTokens(tokens, notification);
    if (result.invalidTokens.length > 0) {
      // Uninstalled apps and expired tokens: stop sending to them.
      await prisma.pushToken.updateMany({
        where: { token: { in: result.invalidTokens } },
        data: { isActive: false },
      });
    }
    return result.successCount;
  }
}
