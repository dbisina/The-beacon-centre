// backend/src/services/auth.service.ts
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { ServiceResponse, AdminLoginRequest, AdminLoginResponse, JWTPayload, AdminRole } from '../types';

// Environment variables with fallbacks for development
const JWT_SECRET = process.env.JWT_SECRET || 'dev-jwt-secret-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

export class AuthService {
  static async login(loginData: AdminLoginRequest): Promise<ServiceResponse<AdminLoginResponse>> {
    try {
      // Find admin by email
      const admin = await prisma.admin.findUnique({
        where: { email: loginData.email.toLowerCase() },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          passwordHash: true,
          permissions: true,
          createdAt: true,
          updatedAt: true,
          lastLogin: true,
          loginCount: true,
        },
      });

      if (!admin) {
        return {
          success: false,
          error: 'Invalid email or password',
        };
      }

      if (!admin.isActive) {
        return {
          success: false,
          error: 'Account is deactivated. Please contact administrator.',
        };
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(loginData.password, admin.passwordHash);
      if (!isPasswordValid) {
        return {
          success: false,
          error: 'Invalid email or password',
        };
      }

      // Generate tokens
      const payload: JWTPayload = {
        adminId: admin.id,
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions,
      };

      const accessToken = jwt.sign(
        payload,
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      const refreshToken = jwt.sign(
        { adminId: admin.id },
        JWT_REFRESH_SECRET,
        { expiresIn: JWT_REFRESH_EXPIRES_IN }
      );

      // Update last login and login count
      await prisma.admin.update({
        where: { id: admin.id },
        data: { 
          lastLogin: new Date(),
          loginCount: { increment: 1 },
          updatedAt: new Date() 
        },
      });

      // Remove password from response
      const { passwordHash, ...adminData } = admin;

      return {
        success: true,
        data: {
          admin: adminData,
          accessToken,
          refreshToken,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: 'Authentication failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async refreshToken(refreshToken: string): Promise<ServiceResponse<{ accessToken: string }>> {
    try {
      const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as { adminId: number };
      
      // Find admin
      const admin = await prisma.admin.findUnique({
        where: { id: decoded.adminId },
        select: {
          id: true,
          email: true,
          role: true,
          isActive: true,
          permissions: true,
        },
      });

      if (!admin || !admin.isActive) {
        return {
          success: false,
          error: 'Invalid refresh token',
        };
      }

      // Generate new access token
      const payload: JWTPayload = {
        adminId: admin.id,
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions,
      };

      const accessToken = jwt.sign(
        payload,
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      return {
        success: true,
        data: { accessToken },
      };
    } catch (error) {
      return {
        success: false,
        error: 'Invalid refresh token',
      };
    }
  }

  static async verifyToken(token: string): Promise<ServiceResponse<JWTPayload>> {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
      
      // Verify admin still exists and is active
      const admin = await prisma.admin.findUnique({
        where: { id: decoded.adminId },
        select: { isActive: true },
      });

      if (!admin || !admin.isActive) {
        return {
          success: false,
          error: 'Token no longer valid',
        };
      }

      return {
        success: true,
        data: decoded,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Invalid token',
      };
    }
  }

  static async createAdmin(adminData: {
    email: string;
    password: string;
    name: string;
    role?: AdminRole;
    permissions?: string[];
  }): Promise<ServiceResponse<{ id: number; email: string; name: string }>> {
    try {
      // Check if admin already exists
      const existingAdmin = await prisma.admin.findUnique({
        where: { email: adminData.email.toLowerCase() },
      });

      if (existingAdmin) {
        return {
          success: false,
          error: 'Admin with this email already exists',
        };
      }

      // Hash password
      const passwordHash = await bcrypt.hash(adminData.password, 12);

      // Create admin
      const admin = await prisma.admin.create({
        data: {
          email: adminData.email.toLowerCase(),
          name: adminData.name,
          passwordHash,
          role: adminData.role || AdminRole.ADMIN,
          permissions: adminData.permissions || [],
          isActive: true,
        },
        select: {
          id: true,
          email: true,
          name: true,
        },
      });

      return {
        success: true,
        data: admin,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to create admin',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}