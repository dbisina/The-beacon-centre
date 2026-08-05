// backend/src/services/user.service.ts
import { prisma } from '../config/database';
import { ServiceResponse, ContentType } from '../types';
import { UserSave, UserNote, UserProgress } from '@prisma/client';

interface MergeSaveItem {
  contentType: ContentType;
  contentId: number;
}

interface MergeNoteItem {
  contentType: ContentType;
  contentId: number;
  body: string;
}

interface MergeProgressItem {
  contentType: ContentType;
  contentId: number;
  positionSeconds: number;
  durationSeconds?: number;
  completed?: boolean;
}

export class UserService {
  // ─── Saves ───

  static async getSaves(appUserId: number, contentType?: ContentType): Promise<ServiceResponse<UserSave[]>> {
    try {
      const where: any = { appUserId };

      if (contentType) {
        where.contentType = contentType;
      }

      const saves = await prisma.userSave.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });

      return {
        success: true,
        data: saves,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch saves',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async createSave(appUserId: number, contentType: ContentType, contentId: number): Promise<ServiceResponse<UserSave>> {
    try {
      const save = await prisma.userSave.upsert({
        where: {
          appUserId_contentType_contentId: { appUserId, contentType, contentId },
        },
        update: {},
        create: { appUserId, contentType, contentId },
      });

      return {
        success: true,
        data: save,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to create save',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async deleteSave(appUserId: number, contentType: ContentType, contentId: number): Promise<ServiceResponse<{ deleted: boolean }>> {
    try {
      await prisma.userSave.delete({
        where: {
          appUserId_contentType_contentId: { appUserId, contentType, contentId },
        },
      });

      return {
        success: true,
        data: { deleted: true },
      };
    } catch (error: any) {
      // P2025 = record to delete does not exist - treat as a no-op success
      if (error?.code === 'P2025') {
        return {
          success: true,
          data: { deleted: false },
        };
      }

      return {
        success: false,
        error: 'Failed to delete save',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // ─── Notes ───
  // No unique constraint on UserNote, so upsert is done manually (find-then-update/create).

  static async getNotes(appUserId: number, contentType?: ContentType, contentId?: number): Promise<ServiceResponse<UserNote[]>> {
    try {
      const where: any = { appUserId };

      if (contentType) {
        where.contentType = contentType;
      }

      if (contentId !== undefined) {
        where.contentId = contentId;
      }

      const notes = await prisma.userNote.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
      });

      return {
        success: true,
        data: notes,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch notes',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async upsertNote(appUserId: number, contentType: ContentType, contentId: number, body: string): Promise<ServiceResponse<UserNote>> {
    try {
      const existing = await prisma.userNote.findFirst({
        where: { appUserId, contentType, contentId },
      });

      const note = existing
        ? await prisma.userNote.update({
            where: { id: existing.id },
            data: { body, updatedAt: new Date() },
          })
        : await prisma.userNote.create({
            data: { appUserId, contentType, contentId, body },
          });

      return {
        success: true,
        data: note,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to save note',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async deleteNote(appUserId: number, contentType: ContentType, contentId: number): Promise<ServiceResponse<{ deleted: boolean }>> {
    try {
      const existing = await prisma.userNote.findFirst({
        where: { appUserId, contentType, contentId },
      });

      if (!existing) {
        return {
          success: true,
          data: { deleted: false },
        };
      }

      await prisma.userNote.delete({ where: { id: existing.id } });

      return {
        success: true,
        data: { deleted: true },
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to delete note',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // ─── Progress ───

  static async getProgress(appUserId: number, contentType: ContentType, contentId: number): Promise<ServiceResponse<UserProgress | null>> {
    try {
      const progress = await prisma.userProgress.findUnique({
        where: {
          appUserId_contentType_contentId: { appUserId, contentType, contentId },
        },
      });

      return {
        success: true,
        data: progress,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch progress',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async upsertProgress(
    appUserId: number,
    contentType: ContentType,
    contentId: number,
    positionSeconds: number,
    durationSeconds?: number,
    completed?: boolean
  ): Promise<ServiceResponse<UserProgress>> {
    try {
      const progress = await prisma.userProgress.upsert({
        where: {
          appUserId_contentType_contentId: { appUserId, contentType, contentId },
        },
        update: {
          positionSeconds,
          ...(durationSeconds !== undefined && { durationSeconds }),
          ...(completed !== undefined && { completed }),
        },
        create: {
          appUserId,
          contentType,
          contentId,
          positionSeconds,
          durationSeconds: durationSeconds ?? null,
          completed: completed ?? false,
        },
      });

      return {
        success: true,
        data: progress,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to save progress',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // ─── Guest data merge ───

  static async mergeGuestData(
    appUserId: number,
    saves?: MergeSaveItem[],
    notes?: MergeNoteItem[],
    progress?: MergeProgressItem[]
  ): Promise<ServiceResponse<{ savesMerged: number; notesMerged: number; progressMerged: number }>> {
    try {
      let savesMerged = 0;
      let notesMerged = 0;
      let progressMerged = 0;

      if (saves && saves.length > 0) {
        for (const item of saves) {
          try {
            await prisma.userSave.upsert({
              where: {
                appUserId_contentType_contentId: {
                  appUserId,
                  contentType: item.contentType,
                  contentId: item.contentId,
                },
              },
              update: {},
              create: { appUserId, contentType: item.contentType, contentId: item.contentId },
            });
            savesMerged++;
          } catch (itemError) {
            console.warn('mergeGuestData: skipping save item', item, itemError);
          }
        }
      }

      if (notes && notes.length > 0) {
        for (const item of notes) {
          try {
            const existing = await prisma.userNote.findFirst({
              where: { appUserId, contentType: item.contentType, contentId: item.contentId },
            });

            if (existing) {
              await prisma.userNote.update({
                where: { id: existing.id },
                data: { body: item.body, updatedAt: new Date() },
              });
            } else {
              await prisma.userNote.create({
                data: { appUserId, contentType: item.contentType, contentId: item.contentId, body: item.body },
              });
            }
            notesMerged++;
          } catch (itemError) {
            console.warn('mergeGuestData: skipping note item', item, itemError);
          }
        }
      }

      if (progress && progress.length > 0) {
        for (const item of progress) {
          try {
            await prisma.userProgress.upsert({
              where: {
                appUserId_contentType_contentId: {
                  appUserId,
                  contentType: item.contentType,
                  contentId: item.contentId,
                },
              },
              update: {
                positionSeconds: item.positionSeconds,
                ...(item.durationSeconds !== undefined && { durationSeconds: item.durationSeconds }),
                ...(item.completed !== undefined && { completed: item.completed }),
              },
              create: {
                appUserId,
                contentType: item.contentType,
                contentId: item.contentId,
                positionSeconds: item.positionSeconds,
                durationSeconds: item.durationSeconds ?? null,
                completed: item.completed ?? false,
              },
            });
            progressMerged++;
          } catch (itemError) {
            console.warn('mergeGuestData: skipping progress item', item, itemError);
          }
        }
      }

      await prisma.appUser.update({
        where: { id: appUserId },
        data: { isGuestMerged: true },
      });

      return {
        success: true,
        data: { savesMerged, notesMerged, progressMerged },
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to merge guest data',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
