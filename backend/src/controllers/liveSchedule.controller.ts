// backend/src/controllers/liveSchedule.controller.ts
import { Request, Response } from 'express';
import { LiveScheduleService, CreateLiveScheduleRequest, UpdateLiveScheduleRequest } from '../services/liveSchedule.service';
import { sendSuccess, sendError } from '../utils/responses';

export class LiveScheduleController {
  static async getAllLiveSchedules(req: Request, res: Response): Promise<void> {
    try {
      const result = await LiveScheduleService.getAllLiveSchedules();

      if (result.success) {
        sendSuccess(res, 'Live schedules retrieved successfully', result.data);
      } else {
        sendError(res, result.error, 500, result.details);
      }
    } catch (error) {
      sendError(res, 'Failed to retrieve live schedules', 500, error);
    }
  }

  static async getLiveScheduleById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        sendError(res, 'Invalid live schedule ID', 400);
        return;
      }

      const result = await LiveScheduleService.getLiveScheduleById(id);

      if (result.success) {
        sendSuccess(res, 'Live schedule retrieved successfully', result.data);
      } else {
        const statusCode = result.error === 'Live schedule not found' ? 404 : 500;
        sendError(res, result.error, statusCode, result.details);
      }
    } catch (error) {
      sendError(res, 'Failed to retrieve live schedule', 500, error);
    }
  }

  static async createLiveSchedule(req: Request, res: Response): Promise<void> {
    try {
      const scheduleData: CreateLiveScheduleRequest = req.body;

      if (!scheduleData.name) {
        sendError(res, 'Name is required', 400);
        return;
      }

      if (
        scheduleData.dayOfWeek === undefined ||
        scheduleData.dayOfWeek === null ||
        !Number.isInteger(scheduleData.dayOfWeek) ||
        scheduleData.dayOfWeek < 0 ||
        scheduleData.dayOfWeek > 6
      ) {
        sendError(res, 'dayOfWeek must be an integer between 0 (Sunday) and 6 (Saturday)', 400);
        return;
      }

      if (!scheduleData.time) {
        sendError(res, 'Time is required', 400);
        return;
      }

      const result = await LiveScheduleService.createLiveSchedule(scheduleData);

      if (result.success) {
        sendSuccess(res, 'Live schedule created successfully', result.data, 201);
      } else {
        sendError(res, result.error, 400, result.details);
      }
    } catch (error) {
      sendError(res, 'Failed to create live schedule', 500, error);
    }
  }

  static async updateLiveSchedule(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const updateData: UpdateLiveScheduleRequest = req.body;

      if (isNaN(id)) {
        sendError(res, 'Invalid live schedule ID', 400);
        return;
      }

      if (
        updateData.dayOfWeek !== undefined &&
        (!Number.isInteger(updateData.dayOfWeek) || updateData.dayOfWeek < 0 || updateData.dayOfWeek > 6)
      ) {
        sendError(res, 'dayOfWeek must be an integer between 0 (Sunday) and 6 (Saturday)', 400);
        return;
      }

      const result = await LiveScheduleService.updateLiveSchedule(id, updateData);

      if (result.success) {
        sendSuccess(res, 'Live schedule updated successfully', result.data);
      } else {
        const statusCode = result.error === 'Live schedule not found' ? 404 : 400;
        sendError(res, result.error, statusCode, result.details);
      }
    } catch (error) {
      sendError(res, 'Failed to update live schedule', 500, error);
    }
  }

  static async deleteLiveSchedule(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        sendError(res, 'Invalid live schedule ID', 400);
        return;
      }

      const result = await LiveScheduleService.deleteLiveSchedule(id);

      if (result.success) {
        sendSuccess(res, 'Live schedule deleted successfully', result.data);
      } else {
        const statusCode = result.error === 'Live schedule not found' ? 404 : 400;
        sendError(res, result.error, statusCode, result.details);
      }
    } catch (error) {
      sendError(res, 'Failed to delete live schedule', 500, error);
    }
  }
}
