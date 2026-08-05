// backend/src/controllers/user.controller.ts
import { Response } from 'express';
import { UserService } from '../services/user.service';
import { sendSuccess, sendError } from '../utils/responses';
import { AuthenticatedUserRequest, ContentType } from '../types';

const VALID_CONTENT_TYPES: string[] = Object.values(ContentType);

const isValidContentType = (value: string | undefined): boolean =>
  value !== undefined && VALID_CONTENT_TYPES.includes(value);

interface CreateSaveRequest {
  contentType: ContentType;
  contentId: number;
}

interface UpsertNoteRequest {
  body: string;
}

interface UpsertProgressRequest {
  positionSeconds: number;
  durationSeconds?: number;
  completed?: boolean;
}

interface MergeGuestDataRequest {
  saves?: Array<{ contentType: ContentType; contentId: number }>;
  notes?: Array<{ contentType: ContentType; contentId: number; body: string }>;
  progress?: Array<{
    contentType: ContentType;
    contentId: number;
    positionSeconds: number;
    durationSeconds?: number;
    completed?: boolean;
  }>;
}

export class UserController {
  // ─── Saves ───

  static async getSaves(req: AuthenticatedUserRequest, res: Response): Promise<void> {
    try {
      const appUserId = req.appUser!.id;
      const contentTypeQuery = req.query.contentType as string | undefined;

      if (contentTypeQuery && !isValidContentType(contentTypeQuery)) {
        sendError(res, 'Invalid contentType', 400);
        return;
      }

      const result = await UserService.getSaves(appUserId, contentTypeQuery as ContentType | undefined);

      if (result.success) {
        sendSuccess(res, 'Saves retrieved successfully', result.data);
      } else {
        sendError(res, result.error, 500, result.details);
      }
    } catch (error) {
      sendError(res, 'Failed to retrieve saves', 500, error);
    }
  }

  static async createSave(req: AuthenticatedUserRequest, res: Response): Promise<void> {
    try {
      const appUserId = req.appUser!.id;
      const { contentType, contentId }: CreateSaveRequest = req.body;

      if (!contentType || !isValidContentType(contentType)) {
        sendError(res, 'Invalid contentType', 400);
        return;
      }

      const parsedContentId = Number(contentId);
      if (!Number.isInteger(parsedContentId)) {
        sendError(res, 'contentId must be an integer', 400);
        return;
      }

      const result = await UserService.createSave(appUserId, contentType as ContentType, parsedContentId);

      if (result.success) {
        sendSuccess(res, 'Save created successfully', result.data, 201);
      } else {
        sendError(res, result.error, 400, result.details);
      }
    } catch (error) {
      sendError(res, 'Failed to create save', 500, error);
    }
  }

  static async deleteSave(req: AuthenticatedUserRequest, res: Response): Promise<void> {
    try {
      const appUserId = req.appUser!.id;
      const { contentType, contentId } = req.params;

      if (!isValidContentType(contentType)) {
        sendError(res, 'Invalid contentType', 400);
        return;
      }

      const parsedContentId = parseInt(contentId, 10);
      if (isNaN(parsedContentId)) {
        sendError(res, 'Invalid contentId', 400);
        return;
      }

      const result = await UserService.deleteSave(appUserId, contentType as ContentType, parsedContentId);

      if (result.success) {
        sendSuccess(res, 'Save deleted successfully', result.data);
      } else {
        sendError(res, result.error, 500, result.details);
      }
    } catch (error) {
      sendError(res, 'Failed to delete save', 500, error);
    }
  }

  // ─── Notes ───

  static async getNotes(req: AuthenticatedUserRequest, res: Response): Promise<void> {
    try {
      const appUserId = req.appUser!.id;
      const contentTypeQuery = req.query.contentType as string | undefined;
      const contentIdQuery = req.query.contentId as string | undefined;

      if (contentTypeQuery && !isValidContentType(contentTypeQuery)) {
        sendError(res, 'Invalid contentType', 400);
        return;
      }

      let contentId: number | undefined;
      if (contentIdQuery !== undefined) {
        contentId = parseInt(contentIdQuery, 10);
        if (isNaN(contentId)) {
          sendError(res, 'Invalid contentId', 400);
          return;
        }
      }

      const result = await UserService.getNotes(appUserId, contentTypeQuery as ContentType | undefined, contentId);

      if (result.success) {
        sendSuccess(res, 'Notes retrieved successfully', result.data);
      } else {
        sendError(res, result.error, 500, result.details);
      }
    } catch (error) {
      sendError(res, 'Failed to retrieve notes', 500, error);
    }
  }

  static async upsertNote(req: AuthenticatedUserRequest, res: Response): Promise<void> {
    try {
      const appUserId = req.appUser!.id;
      const { contentType, contentId } = req.params;
      const { body }: UpsertNoteRequest = req.body;

      if (!isValidContentType(contentType)) {
        sendError(res, 'Invalid contentType', 400);
        return;
      }

      const parsedContentId = parseInt(contentId, 10);
      if (isNaN(parsedContentId)) {
        sendError(res, 'Invalid contentId', 400);
        return;
      }

      if (!body || typeof body !== 'string') {
        sendError(res, 'Missing required field: body', 400);
        return;
      }

      const result = await UserService.upsertNote(appUserId, contentType as ContentType, parsedContentId, body);

      if (result.success) {
        sendSuccess(res, 'Note saved successfully', result.data);
      } else {
        sendError(res, result.error, 400, result.details);
      }
    } catch (error) {
      sendError(res, 'Failed to save note', 500, error);
    }
  }

  static async deleteNote(req: AuthenticatedUserRequest, res: Response): Promise<void> {
    try {
      const appUserId = req.appUser!.id;
      const { contentType, contentId } = req.params;

      if (!isValidContentType(contentType)) {
        sendError(res, 'Invalid contentType', 400);
        return;
      }

      const parsedContentId = parseInt(contentId, 10);
      if (isNaN(parsedContentId)) {
        sendError(res, 'Invalid contentId', 400);
        return;
      }

      const result = await UserService.deleteNote(appUserId, contentType as ContentType, parsedContentId);

      if (result.success) {
        sendSuccess(res, 'Note deleted successfully', result.data);
      } else {
        sendError(res, result.error, 500, result.details);
      }
    } catch (error) {
      sendError(res, 'Failed to delete note', 500, error);
    }
  }

  // ─── Progress ───

  static async getProgress(req: AuthenticatedUserRequest, res: Response): Promise<void> {
    try {
      const appUserId = req.appUser!.id;
      const { contentType, contentId } = req.params;

      if (!isValidContentType(contentType)) {
        sendError(res, 'Invalid contentType', 400);
        return;
      }

      const parsedContentId = parseInt(contentId, 10);
      if (isNaN(parsedContentId)) {
        sendError(res, 'Invalid contentId', 400);
        return;
      }

      const result = await UserService.getProgress(appUserId, contentType as ContentType, parsedContentId);

      if (result.success) {
        sendSuccess(res, 'Progress retrieved successfully', result.data);
      } else {
        sendError(res, result.error, 500, result.details);
      }
    } catch (error) {
      sendError(res, 'Failed to retrieve progress', 500, error);
    }
  }

  static async upsertProgress(req: AuthenticatedUserRequest, res: Response): Promise<void> {
    try {
      const appUserId = req.appUser!.id;
      const { contentType, contentId } = req.params;
      const { positionSeconds, durationSeconds, completed }: UpsertProgressRequest = req.body;

      if (!isValidContentType(contentType)) {
        sendError(res, 'Invalid contentType', 400);
        return;
      }

      const parsedContentId = parseInt(contentId, 10);
      if (isNaN(parsedContentId)) {
        sendError(res, 'Invalid contentId', 400);
        return;
      }

      const parsedPositionSeconds = Number(positionSeconds);
      if (positionSeconds === undefined || !Number.isInteger(parsedPositionSeconds)) {
        sendError(res, 'positionSeconds is required and must be an integer', 400);
        return;
      }

      const parsedDurationSeconds = durationSeconds !== undefined ? Number(durationSeconds) : undefined;

      const result = await UserService.upsertProgress(
        appUserId,
        contentType as ContentType,
        parsedContentId,
        parsedPositionSeconds,
        parsedDurationSeconds,
        completed
      );

      if (result.success) {
        sendSuccess(res, 'Progress saved successfully', result.data);
      } else {
        sendError(res, result.error, 400, result.details);
      }
    } catch (error) {
      sendError(res, 'Failed to save progress', 500, error);
    }
  }

  // ─── Guest data merge ───

  static async mergeGuestData(req: AuthenticatedUserRequest, res: Response): Promise<void> {
    try {
      const appUserId = req.appUser!.id;
      const { saves, notes, progress }: MergeGuestDataRequest = req.body;

      const validSaves = Array.isArray(saves)
        ? saves.filter(
            (item) => item && isValidContentType(item.contentType) && Number.isInteger(Number(item.contentId))
          )
        : undefined;

      const validNotes = Array.isArray(notes)
        ? notes.filter(
            (item) =>
              item &&
              isValidContentType(item.contentType) &&
              Number.isInteger(Number(item.contentId)) &&
              typeof item.body === 'string'
          )
        : undefined;

      const validProgress = Array.isArray(progress)
        ? progress.filter(
            (item) =>
              item &&
              isValidContentType(item.contentType) &&
              Number.isInteger(Number(item.contentId)) &&
              item.positionSeconds !== undefined &&
              Number.isInteger(Number(item.positionSeconds))
          )
        : undefined;

      const result = await UserService.mergeGuestData(appUserId, validSaves, validNotes, validProgress);

      if (result.success) {
        sendSuccess(res, 'Guest data merged successfully', result.data);
      } else {
        sendError(res, result.error, 500, result.details);
      }
    } catch (error) {
      sendError(res, 'Failed to merge guest data', 500, error);
    }
  }
}
