import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {
  CreateAdminRequest,
  UpdateAdminRequest,
  AdminLoginRequest,
  AdminLoginResponse,
  JWTPayload,
  ServiceResponse,
  Admin,
  AdminRole
} from '../types';

const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-jwt-refresh-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

export class AdminService {
  // Login admin
  static async login(credentials: AdminLoginRequest): Promise<ServiceResponse<AdminLoginResponse>> {
    try {
      const { email, password } = credentials;

      // Find admin by email
      const admin = await prisma.admin.findUnique({
        where: { email: email.toLowerCase() }
      });

      if (!admin) {
        return {
          success: false,
          error: 'Invalid email or password'
        };
      }

      // Check if admin is active
      if (!admin.isActive) {
        return {
          success: false,
          error: 'Account is deactivated. Please contact a super admin.'
        };
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, admin.passwordHash);
      if (!isPasswordValid) {
        return {
          success: false,
          error: 'Invalid email or password'
        };
      }

      // Generate tokens
      const tokenPayload: JWTPayload = {
        adminId: admin.id,
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions
      };

      const accessToken = jwt.sign(tokenPayload, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN
      });

      const refreshToken = jwt.sign(
        { adminId: admin.id },
        JWT_REFRESH_SECRET,
        { expiresIn: JWT_REFRESH_EXPIRES_IN }
      );

      // Update login statistics
      await prisma.admin.update({
        where: { id: admin.id },
        data: {
          lastLogin: new Date(),
          loginCount: {
            increment: 1
          }
        }
      });

      // Remove password hash from response
      const { passwordHash, ...adminData } = admin;

      return {
        success: true,
        data: {
          admin: adminData,
          accessToken,
          refreshToken
        }
      };
    } catch (error) {
      return {
        success: false,
        error: 'Login failed',
        details: error
      };
    }
  }

  // Refresh access token
  static async refreshToken(refreshToken: string): Promise<ServiceResponse<{ accessToken: string }>> {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as { adminId: number };

      // Find admin
      const admin = await prisma.admin.findUnique({
        where: { id: decoded.adminId }
      });

      if (!admin || !admin.isActive) {
        return {
          success: false,
          error: 'Invalid refresh token'
        };
      }

      // Generate new access token
      const tokenPayload: JWTPayload = {
        adminId: admin.id,
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions
      };

      const accessToken = jwt.sign(tokenPayload, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN
      });

      return {
        success: true,
        data: { accessToken }
      };
    } catch (error) {
      return {
        success: false,
        error: 'Token refresh failed',
        details: error
      };
    }
  }

  // Verify access token
  static async verifyToken(token: string): Promise<ServiceResponse<Omit<Admin, 'passwordHash'>>> {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;

      const admin = await prisma.admin.findUnique({
        where: { id: decoded.adminId }
      });

      if (!admin || !admin.isActive) {
        return {
          success: false,
          error: 'Invalid token'
        };
      }

      const { passwordHash, ...adminData } = admin;

      return {
        success: true,
        data: adminData
      };
    } catch (error) {
      return {
        success: false,
        error: 'Token verification failed',
        details: error
      };
    }
  }

  // Get all admins
  static async getAdmins(includeInactive: boolean = false): Promise<ServiceResponse<Omit<Admin, 'passwordHash'>[]>> {
    try {
      const where = includeInactive ? {} : { isActive: true };

      const admins = await prisma.admin.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          permissions: true,
          isActive: true,
          lastLogin: true,
          loginCount: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: [
          { role: 'asc' },
          { name: 'asc' }
        ]
      });

      return {
        success: true,
        data: admins
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch admins',
        details: error
      };
    }
  }

  // Get admin by ID
  static async getAdminById(id: number): Promise<ServiceResponse<Omit<Admin, 'passwordHash'>>> {
    try {
      const admin = await prisma.admin.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          permissions: true,
          isActive: true,
          lastLogin: true,
          loginCount: true,
          createdAt: true,
          updatedAt: true
        }
      });

      if (!admin) {
        return {
          success: false,
          error: 'Admin not found'
        };
      }

      return {
        success: true,
        data: admin
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch admin',
        details: error
      };
    }
  }

  // Create admin
  static async createAdmin(data: CreateAdminRequest): Promise<ServiceResponse<Omit<Admin, 'passwordHash'>>> {
    try {
      // Check if email already exists
      const existingAdmin = await prisma.admin.findUnique({
        where: { email: data.email.toLowerCase() }
      });

      if (existingAdmin) {
        return {
          success: false,
          error: 'An admin with this email already exists'
        };
      }

      // Validate password strength
      if (data.password.length < 8) {
        return {
          success: false,
          error: 'Password must be at least 8 characters long'
        };
      }

      // Hash password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(data.password, saltRounds);

      // Create admin
      const admin = await prisma.admin.create({
        data: {
          email: data.email.toLowerCase(),
          passwordHash,
          name: data.name,
          role: data.role || 'ADMIN',
          permissions: data.permissions || [],
          isActive: data.isActive ?? true
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          permissions: true,
          isActive: true,
          lastLogin: true,
          loginCount: true,
          createdAt: true,
          updatedAt: true
        }
      });

      return {
        success: true,
        data: admin
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to create admin',
        details: error
      };
    }
  }

  // Update admin
  static async updateAdmin(data: UpdateAdminRequest): Promise<ServiceResponse<Omit<Admin, 'passwordHash'>>> {
    try {
      const { id, ...updateData } = data;

      // Check if admin exists
      const existingAdmin = await prisma.admin.findUnique({
        where: { id }
      });

      if (!existingAdmin) {
        return {
          success: false,
          error: 'Admin not found'
        };
      }

      // Check for email conflicts if email is being updated
      if (updateData.email && updateData.email.toLowerCase() !== existingAdmin.email) {
        const conflictingAdmin = await prisma.admin.findFirst({
          where: {
            email: updateData.email.toLowerCase(),
            id: { not: id }
          }
        });

        if (conflictingAdmin) {
          return {
            success: false,
            error: 'An admin with this email already exists'
          };
        }
      }

      const admin = await prisma.admin.update({
        where: { id },
        data: {
          ...(updateData.email && { email: updateData.email.toLowerCase() }),
          ...(updateData.name && { name: updateData.name }),
          ...(updateData.role && { role: updateData.role }),
          ...(updateData.permissions !== undefined && { permissions: updateData.permissions }),
          ...(updateData.isActive !== undefined && { isActive: updateData.isActive }),
          updatedAt: new Date()
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          permissions: true,
          isActive: true,
          lastLogin: true,
          loginCount: true,
          createdAt: true,
          updatedAt: true
        }
      });

      return {
        success: true,
        data: admin
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to update admin',
        details: error
      };
    }
  }

  // Change admin password
  static async changePassword(
    adminId: number,
    currentPassword: string,
    newPassword: string
  ): Promise<ServiceResponse<{ message: string }>> {
    try {
      // Find admin
      const admin = await prisma.admin.findUnique({
        where: { id: adminId }
      });

      if (!admin) {
        return {
          success: false,
          error: 'Admin not found'
        };
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, admin.passwordHash);
      if (!isCurrentPasswordValid) {
        return {
          success: false,
          error: 'Current password is incorrect'
        };
      }

      // Validate new password
      if (newPassword.length < 8) {
        return {
          success: false,
          error: 'New password must be at least 8 characters long'
        };
      }

      // Hash new password
      const saltRounds = 12;
      const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

      // Update password
      await prisma.admin.update({
        where: { id: adminId },
        data: {
          passwordHash: newPasswordHash,
          updatedAt: new Date()
        }
      });

      return {
        success: true,
        data: { message: 'Password changed successfully' }
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to change password',
        details: error
      };
    }
  }

  // Reset admin password (super admin only)
  static async resetPassword(
    adminId: number,
    newPassword: string
  ): Promise<ServiceResponse<{ message: string }>> {
    try {
      // Check if admin exists
      const admin = await prisma.admin.findUnique({
        where: { id: adminId }
      });

      if (!admin) {
        return {
          success: false,
          error: 'Admin not found'
        };
      }

      // Validate new password
      if (newPassword.length < 8) {
        return {
          success: false,
          error: 'New password must be at least 8 characters long'
        };
      }

      // Hash new password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(newPassword, saltRounds);

      // Update password
      await prisma.admin.update({
        where: { id: adminId },
        data: {
          passwordHash,
          updatedAt: new Date()
        }
      });

      return {
        success: true,
        data: { message: 'Password reset successfully' }
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to reset password',
        details: error
      };
    }
  }

  // Delete admin
  static async deleteAdmin(id: number): Promise<ServiceResponse<{ id: number }>> {
    try {
      // Check if admin exists
      const existingAdmin = await prisma.admin.findUnique({
        where: { id }
      });

      if (!existingAdmin) {
        return {
          success: false,
          error: 'Admin not found'
        };
      }

      // Prevent deletion of super admin if it's the last one
      if (existingAdmin.role === 'SUPER_ADMIN') {
        const superAdminCount = await prisma.admin.count({
          where: { role: 'SUPER_ADMIN', isActive: true }
        });

        if (superAdminCount <= 1) {
          return {
            success: false,
            error: 'Cannot delete the last super admin'
          };
        }
      }

      await prisma.admin.delete({
        where: { id }
      });

      return {
        success: true,
        data: { id }
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to delete admin',
        details: error
      };
    }
  }

  // Toggle admin active status
  static async toggleActive(id: number): Promise<ServiceResponse<{ isActive: boolean }>> {
    try {
      const existingAdmin = await prisma.admin.findUnique({
        where: { id },
        select: { isActive: true, role: true }
      });

      if (!existingAdmin) {
        return {
          success: false,
          error: 'Admin not found'
        };
      }

      // Prevent deactivating the last super admin
      if (existingAdmin.role === 'SUPER_ADMIN' && existingAdmin.isActive) {
        const activeSuperAdminCount = await prisma.admin.count({
          where: { role: 'SUPER_ADMIN', isActive: true }
        });

        if (activeSuperAdminCount <= 1) {
          return {
            success: false,
            error: 'Cannot deactivate the last active super admin'
          };
        }
      }

      const admin = await prisma.admin.update({
        where: { id },
        data: {
          isActive: !existingAdmin.isActive
        },
        select: {
          isActive: true
        }
      });

      return {
        success: true,
        data: { isActive: admin.isActive }
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to toggle admin status',
        details: error
      };
    }
  }

  // Get admin statistics
  static async getAdminStats(): Promise<ServiceResponse<{
    total: number;
    active: number;
    inactive: number;
    byRole: Array<{ role: AdminRole; count: number }>;
    recentLogins: Array<{
      id: number;
      name: string;
      email: string;
      lastLogin: Date | null;
      loginCount: number;
    }>;
  }>> {
    try {
      const [total, active, roleStats, recentLogins] = await Promise.all([
        prisma.admin.count(),
        prisma.admin.count({ where: { isActive: true } }),
        prisma.admin.groupBy({
          by: ['role'],
          _count: { id: true }
        }),
        prisma.admin.findMany({
          where: {
            lastLogin: { not: null }
          },
          select: {
            id: true,
            name: true,
            email: true,
            lastLogin: true,
            loginCount: true
          },
          orderBy: {
            lastLogin: 'desc'
          },
          take: 10
        })
      ]);

      return {
        success: true,
        data: {
          total,
          active,
          inactive: total - active,
          byRole: roleStats.map(stat => ({
            role: stat.role,
            count: stat._count.id
          })),
          recentLogins
        }
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to get admin statistics',
        details: error
      };
    }
  }

  // Check if user has permission
  static hasPermission(admin: Omit<Admin, 'passwordHash'>, permission: string): boolean {
    // Super admin has all permissions
    if (admin.role === 'SUPER_ADMIN') {
      return true;
    }

    // Check if admin has specific permission
    return admin.permissions.includes(permission);
  }

  // Check if user has role
  static hasRole(admin: Omit<Admin, 'passwordHash'>, role: AdminRole): boolean {
    return admin.role === role;
  }

  // Check if user has minimum role level
  static hasMinimumRole(admin: Omit<Admin, 'passwordHash'>, minimumRole: AdminRole): boolean {
    const roleHierarchy: { [key in AdminRole]: number } = {
      EDITOR: 1,
      ADMIN: 2,
      SUPER_ADMIN: 3
    };

    return roleHierarchy[admin.role] >= roleHierarchy[minimumRole];
  }
}