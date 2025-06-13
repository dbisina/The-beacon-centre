// backend/src/controllers/admin.controller.ts
import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { sendSuccess, sendError } from '../utils/responses';
import { AdminLoginRequest, AuthenticatedRequest, AdminRole } from '../types';

export class AdminController {
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const loginData: AdminLoginRequest = req.body;

      // Validation
      if (!loginData.email || !loginData.password) {
        sendError(res, 'Email and password are required', 400);
        return;
      }

      const result = await AuthService.login(loginData);

      if (result.success) {
        // Set refresh token as httpOnly cookie
        res.cookie('refreshToken', result.data.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        sendSuccess(res, 'Login successful', {
          admin: result.data.admin,
          accessToken: result.data.accessToken,
        });
      } else {
        sendError(res, result.error, 401, result.details);
      }
    } catch (error) {
      sendError(res, 'Login failed', 500, error);
    }
  }

  static async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

      if (!refreshToken) {
        sendError(res, 'Refresh token required', 401);
        return;
      }

      const result = await AuthService.refreshToken(refreshToken);

      if (result.success) {
        sendSuccess(res, 'Token refreshed successfully', result.data);
      } else {
        // Clear invalid refresh token cookie
        res.clearCookie('refreshToken');
        sendError(res, result.error, 401);
      }
    } catch (error) {
      sendError(res, 'Token refresh failed', 500, error);
    }
  }

  static async logout(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Clear refresh token cookie
      res.clearCookie('refreshToken');
      sendSuccess(res, 'Logout successful');
    } catch (error) {
      sendError(res, 'Logout failed', 500, error);
    }
  }

  static async getProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.admin) {
        sendError(res, 'Admin not found', 404);
        return;
      }

      sendSuccess(res, 'Profile retrieved successfully', req.admin);
    } catch (error) {
      sendError(res, 'Failed to get profile', 500, error);
    }
  }

  static async createAdmin(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Only super admins can create other admins
      if (req.admin?.role !== AdminRole.SUPER_ADMIN) {
        sendError(res, 'Only super admins can create new admins', 403);
        return;
      }

      const { email, password, name, role, permissions } = req.body;

      if (!email || !password || !name) {
        sendError(res, 'Email, password, and name are required', 400);
        return;
      }

      const result = await AuthService.createAdmin({
        email,
        password,
        name,
        role: role || AdminRole.ADMIN,
        permissions: permissions || [],
      });

      if (result.success) {
        sendSuccess(res, 'Admin created successfully', result.data, 201);
      } else {
        sendError(res, result.error, 400, result.details);
      }
    } catch (error) {
      sendError(res, 'Failed to create admin', 500, error);
    }
  }

  static async getAllAdmins(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Only super admins can view all admins
      if (req.admin?.role !== AdminRole.SUPER_ADMIN) {
        sendError(res, 'Only super admins can view all admins', 403);
        return;
      }

      const { prisma } = await import('../config/database');
      const admins = await prisma.admin.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          permissions: true,
          createdAt: true,
          updatedAt: true,
          lastLogin: true,
          loginCount: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      sendSuccess(res, 'Admins retrieved successfully', admins);
    } catch (error) {
      sendError(res, 'Failed to retrieve admins', 500, error);
    }
  }

  static async updateAdmin(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const adminId = parseInt(req.params.id);
      const { name, role, permissions, isActive } = req.body;

      if (isNaN(adminId)) {
        sendError(res, 'Invalid admin ID', 400);
        return;
      }

      // Only super admins can update other admins, or admins can update themselves (limited fields)
      if (req.admin?.role !== AdminRole.SUPER_ADMIN && req.admin?.id !== adminId) {
        sendError(res, 'Insufficient permissions', 403);
        return;
      }

      const { prisma } = await import('../config/database');
      
      // Check if admin exists
      const existingAdmin = await prisma.admin.findUnique({
        where: { id: adminId },
      });

      if (!existingAdmin) {
        sendError(res, 'Admin not found', 404);
        return;
      }

      // Prepare update data based on permissions
      const updateData: any = {};
      
      if (name) updateData.name = name;
      
      // Only super admins can update role, permissions, and active status
      if (req.admin?.role === AdminRole.SUPER_ADMIN) {
        if (role) updateData.role = role;
        if (permissions !== undefined) updateData.permissions = permissions;
        if (isActive !== undefined) updateData.isActive = isActive;
      }

      updateData.updatedAt = new Date();

      const updatedAdmin = await prisma.admin.update({
        where: { id: adminId },
        data: updateData,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          permissions: true,
          updatedAt: true,
          createdAt: true,
          lastLogin: true,
          loginCount: true,
        },
      });

      sendSuccess(res, 'Admin updated successfully', updatedAdmin);
    } catch (error) {
      sendError(res, 'Failed to update admin', 500, error);
    }
  }

  static async deleteAdmin(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const adminId = parseInt(req.params.id);

      if (isNaN(adminId)) {
        sendError(res, 'Invalid admin ID', 400);
        return;
      }

      // Only super admins can delete other admins
      if (req.admin?.role !== AdminRole.SUPER_ADMIN) {
        sendError(res, 'Only super admins can delete admins', 403);
        return;
      }

      // Prevent self-deletion
      if (req.admin?.id === adminId) {
        sendError(res, 'Cannot delete your own account', 400);
        return;
      }

      const { prisma } = await import('../config/database');
      
      // Check if admin exists
      const existingAdmin = await prisma.admin.findUnique({
        where: { id: adminId },
      });

      if (!existingAdmin) {
        sendError(res, 'Admin not found', 404);
        return;
      }

      await prisma.admin.delete({
        where: { id: adminId },
      });

      sendSuccess(res, 'Admin deleted successfully', { id: adminId });
    } catch (error) {
      sendError(res, 'Failed to delete admin', 500, error);
    }
  }
}