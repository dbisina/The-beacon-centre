// backend/src/controllers/project.controller.ts
import { Request, Response } from 'express';
import { ProjectService, CreateProjectRequest, UpdateProjectRequest } from '../services/project.service';
import { sendSuccess, sendError } from '../utils/responses';

export class ProjectController {
  static async getAllProjects(_req: Request, res: Response): Promise<void> {
    try {
      const result = await ProjectService.getAllProjects();

      if (result.success) {
        sendSuccess(res, 'Projects retrieved successfully', result.data);
      } else {
        sendError(res, result.error, 500, result.details);
      }
    } catch (error) {
      sendError(res, 'Failed to retrieve projects', 500, error);
    }
  }

  static async getProjectById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        sendError(res, 'Invalid project ID', 400);
        return;
      }

      const result = await ProjectService.getProjectById(id);

      if (result.success) {
        sendSuccess(res, 'Project retrieved successfully', result.data);
      } else {
        const statusCode = result.error === 'Project not found' ? 404 : 500;
        sendError(res, result.error, statusCode, result.details);
      }
    } catch (error) {
      sendError(res, 'Failed to retrieve project', 500, error);
    }
  }

  static async createProject(req: Request, res: Response): Promise<void> {
    try {
      const data: CreateProjectRequest = req.body;

      if (!data.title || data.targetAmount === undefined || data.targetAmount === null) {
        sendError(res, 'Missing required fields: title and targetAmount', 400);
        return;
      }

      if (typeof data.targetAmount !== 'number' || !(data.targetAmount > 0)) {
        sendError(res, 'targetAmount must be a positive number (in Naira)', 400);
        return;
      }

      const result = await ProjectService.createProject(data);

      if (result.success) {
        sendSuccess(res, 'Project created successfully', result.data, 201);
      } else {
        sendError(res, result.error, 400, result.details);
      }
    } catch (error) {
      sendError(res, 'Failed to create project', 500, error);
    }
  }

  static async updateProject(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const data: UpdateProjectRequest = req.body;

      if (isNaN(id)) {
        sendError(res, 'Invalid project ID', 400);
        return;
      }

      if (data.targetAmount !== undefined && (typeof data.targetAmount !== 'number' || !(data.targetAmount > 0))) {
        sendError(res, 'targetAmount must be a positive number (in Naira)', 400);
        return;
      }

      const result = await ProjectService.updateProject(id, data);

      if (result.success) {
        sendSuccess(res, 'Project updated successfully', result.data);
      } else {
        const statusCode = result.error === 'Project not found' ? 404 : 400;
        sendError(res, result.error, statusCode, result.details);
      }
    } catch (error) {
      sendError(res, 'Failed to update project', 500, error);
    }
  }

  static async deleteProject(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        sendError(res, 'Invalid project ID', 400);
        return;
      }

      const result = await ProjectService.deleteProject(id);

      if (result.success) {
        sendSuccess(res, 'Project deleted successfully', result.data);
      } else {
        const statusCode = result.error === 'Project not found' ? 404 : 500;
        sendError(res, result.error, statusCode, result.details);
      }
    } catch (error) {
      sendError(res, 'Failed to delete project', 500, error);
    }
  }
}
