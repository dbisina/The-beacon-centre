// backend/src/services/project.service.ts
import { prisma } from '../config/database';
import { ServiceResponse } from '../types';
import { Project } from '@prisma/client';

// Request-shape interfaces kept local to this service (not added to
// src/types/index.ts - see backend unit instructions).
export interface CreateProjectRequest {
  title: string;
  blurb?: string;
  description?: string;
  imageUrl?: string;
  cloudinaryPublicId?: string;
  targetAmount: number; // Naira, not kobo
  deadline?: string; // ISO date string
}

export interface UpdateProjectRequest extends Partial<CreateProjectRequest> {}

export interface ProjectWithProgress extends Project {
  progressPct: number;
}

// raisedAmount/targetAmount are BigInt (kobo). Safe to convert to Number
// here purely for the percentage math - donation amounts are nowhere near
// Number.MAX_SAFE_INTEGER.
const withProgressPct = (project: Project): ProjectWithProgress => {
  const target = Number(project.targetAmount);
  const raised = Number(project.raisedAmount);
  const progressPct = target > 0 ? Math.min(Math.round((raised / target) * 100), 100) : 0;
  return { ...project, progressPct };
};

export class ProjectService {
  static async getAllProjects(): Promise<ServiceResponse<ProjectWithProgress[]>> {
    try {
      const projects = await prisma.project.findMany({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
      });

      return { success: true, data: projects.map(withProgressPct) };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch projects',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async getProjectById(id: number): Promise<ServiceResponse<ProjectWithProgress>> {
    try {
      const project = await prisma.project.findUnique({ where: { id } });

      if (!project) {
        return { success: false, error: 'Project not found' };
      }

      return { success: true, data: withProgressPct(project) };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch project',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async createProject(data: CreateProjectRequest): Promise<ServiceResponse<ProjectWithProgress>> {
    try {
      const project = await prisma.project.create({
        data: {
          title: data.title,
          blurb: data.blurb ?? null,
          description: data.description ?? null,
          imageUrl: data.imageUrl ?? null,
          cloudinaryPublicId: data.cloudinaryPublicId ?? null,
          targetAmount: BigInt(Math.round(data.targetAmount * 100)),
          raisedAmount: BigInt(0),
          donorCount: 0,
          deadline: data.deadline ? new Date(data.deadline) : null,
        },
      });

      return { success: true, data: withProgressPct(project) };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to create project',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async updateProject(id: number, data: UpdateProjectRequest): Promise<ServiceResponse<ProjectWithProgress>> {
    try {
      const existing = await prisma.project.findUnique({ where: { id } });

      if (!existing) {
        return { success: false, error: 'Project not found' };
      }

      // raisedAmount/donorCount are deliberately not settable here - they are
      // server-computed only, via the giving webhook/verify flow.
      const updated = await prisma.project.update({
        where: { id },
        data: {
          ...(data.title !== undefined && { title: data.title }),
          ...(data.blurb !== undefined && { blurb: data.blurb }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
          ...(data.cloudinaryPublicId !== undefined && { cloudinaryPublicId: data.cloudinaryPublicId }),
          ...(data.targetAmount !== undefined && { targetAmount: BigInt(Math.round(data.targetAmount * 100)) }),
          ...(data.deadline !== undefined && { deadline: data.deadline ? new Date(data.deadline) : null }),
          updatedAt: new Date(),
        },
      });

      return { success: true, data: withProgressPct(updated) };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to update project',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Soft delete only - GivingTransaction rows may reference this project's
  // history, never hard-delete.
  static async deleteProject(id: number): Promise<ServiceResponse<{ id: number }>> {
    try {
      const existing = await prisma.project.findUnique({ where: { id } });

      if (!existing) {
        return { success: false, error: 'Project not found' };
      }

      await prisma.project.update({
        where: { id },
        data: { isActive: false, updatedAt: new Date() },
      });

      return { success: true, data: { id } };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to delete project',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
