// backend/src/services/liveSchedule.service.ts
import { prisma } from '../config/database';
import { ServiceResponse } from '../types';
import { LiveSchedule } from '@prisma/client';

export interface CreateLiveScheduleRequest {
  name: string;
  dayOfWeek: number;
  time: string;
  timezone?: string;
  notes?: string;
}

export interface UpdateLiveScheduleRequest extends Partial<CreateLiveScheduleRequest> {}

export class LiveScheduleService {
  static async getAllLiveSchedules(): Promise<ServiceResponse<LiveSchedule[]>> {
    try {
      const schedules = await prisma.liveSchedule.findMany({
        where: { isActive: true },
        orderBy: {
          dayOfWeek: 'asc',
        },
      });

      return {
        success: true,
        data: schedules,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch live schedules',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async getLiveScheduleById(id: number): Promise<ServiceResponse<LiveSchedule>> {
    try {
      const schedule = await prisma.liveSchedule.findUnique({
        where: { id },
      });

      if (!schedule) {
        return {
          success: false,
          error: 'Live schedule not found',
        };
      }

      return {
        success: true,
        data: schedule,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch live schedule',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async createLiveSchedule(scheduleData: CreateLiveScheduleRequest): Promise<ServiceResponse<LiveSchedule>> {
    try {
      const schedule = await prisma.liveSchedule.create({
        data: {
          name: scheduleData.name,
          dayOfWeek: scheduleData.dayOfWeek,
          time: scheduleData.time,
          timezone: scheduleData.timezone || 'Africa/Lagos',
          notes: scheduleData.notes || null,
        },
      });

      return {
        success: true,
        data: schedule,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to create live schedule',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async updateLiveSchedule(id: number, updateData: UpdateLiveScheduleRequest): Promise<ServiceResponse<LiveSchedule>> {
    try {
      const existingSchedule = await prisma.liveSchedule.findUnique({
        where: { id },
      });

      if (!existingSchedule) {
        return {
          success: false,
          error: 'Live schedule not found',
        };
      }

      const updatedSchedule = await prisma.liveSchedule.update({
        where: { id },
        data: {
          ...(updateData.name !== undefined && { name: updateData.name }),
          ...(updateData.dayOfWeek !== undefined && { dayOfWeek: updateData.dayOfWeek }),
          ...(updateData.time !== undefined && { time: updateData.time }),
          ...(updateData.timezone !== undefined && { timezone: updateData.timezone }),
          ...(updateData.notes !== undefined && { notes: updateData.notes }),
          updatedAt: new Date(),
        },
      });

      return {
        success: true,
        data: updatedSchedule,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to update live schedule',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async deleteLiveSchedule(id: number): Promise<ServiceResponse<{ id: number }>> {
    try {
      const existingSchedule = await prisma.liveSchedule.findUnique({
        where: { id },
      });

      if (!existingSchedule) {
        return {
          success: false,
          error: 'Live schedule not found',
        };
      }

      await prisma.liveSchedule.delete({
        where: { id },
      });

      return {
        success: true,
        data: { id },
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to delete live schedule',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
