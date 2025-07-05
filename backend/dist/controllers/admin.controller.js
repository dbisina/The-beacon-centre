"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = void 0;
const auth_service_1 = require("../services/auth.service");
const responses_1 = require("../utils/responses");
const types_1 = require("../types");
class AdminController {
    static async login(req, res) {
        try {
            const loginData = req.body;
            if (!loginData.email || !loginData.password) {
                (0, responses_1.sendError)(res, 'Email and password are required', 400);
                return;
            }
            const result = await auth_service_1.AuthService.login(loginData);
            if (result.success) {
                res.cookie('refreshToken', result.data.refreshToken, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'strict',
                    maxAge: 7 * 24 * 60 * 60 * 1000,
                });
                (0, responses_1.sendSuccess)(res, 'Login successful', {
                    admin: result.data.admin,
                    accessToken: result.data.accessToken,
                });
            }
            else {
                (0, responses_1.sendError)(res, result.error, 401, result.details);
            }
        }
        catch (error) {
            (0, responses_1.sendError)(res, 'Login failed', 500, error);
        }
    }
    static async refreshToken(req, res) {
        try {
            const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
            if (!refreshToken) {
                (0, responses_1.sendError)(res, 'Refresh token required', 401);
                return;
            }
            const result = await auth_service_1.AuthService.refreshToken(refreshToken);
            if (result.success) {
                (0, responses_1.sendSuccess)(res, 'Token refreshed successfully', result.data);
            }
            else {
                res.clearCookie('refreshToken');
                (0, responses_1.sendError)(res, result.error, 401);
            }
        }
        catch (error) {
            (0, responses_1.sendError)(res, 'Token refresh failed', 500, error);
        }
    }
    static async logout(req, res) {
        try {
            res.clearCookie('refreshToken');
            (0, responses_1.sendSuccess)(res, 'Logout successful');
        }
        catch (error) {
            (0, responses_1.sendError)(res, 'Logout failed', 500, error);
        }
    }
    static async getProfile(req, res) {
        try {
            if (!req.admin) {
                (0, responses_1.sendError)(res, 'Admin not found', 404);
                return;
            }
            (0, responses_1.sendSuccess)(res, 'Profile retrieved successfully', req.admin);
        }
        catch (error) {
            (0, responses_1.sendError)(res, 'Failed to get profile', 500, error);
        }
    }
    static async createAdmin(req, res) {
        try {
            if (req.admin?.role !== types_1.AdminRole.SUPER_ADMIN) {
                (0, responses_1.sendError)(res, 'Only super admins can create new admins', 403);
                return;
            }
            const { email, password, name, role, permissions } = req.body;
            if (!email || !password || !name) {
                (0, responses_1.sendError)(res, 'Email, password, and name are required', 400);
                return;
            }
            const result = await auth_service_1.AuthService.createAdmin({
                email,
                password,
                name,
                role: role || types_1.AdminRole.ADMIN,
                permissions: permissions || [],
            });
            if (result.success) {
                (0, responses_1.sendSuccess)(res, 'Admin created successfully', result.data, 201);
            }
            else {
                (0, responses_1.sendError)(res, result.error, 400, result.details);
            }
        }
        catch (error) {
            (0, responses_1.sendError)(res, 'Failed to create admin', 500, error);
        }
    }
    static async getAllAdmins(req, res) {
        try {
            if (req.admin?.role !== types_1.AdminRole.SUPER_ADMIN) {
                (0, responses_1.sendError)(res, 'Only super admins can view all admins', 403);
                return;
            }
            const { prisma } = await Promise.resolve().then(() => __importStar(require('../config/database')));
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
            (0, responses_1.sendSuccess)(res, 'Admins retrieved successfully', admins);
        }
        catch (error) {
            (0, responses_1.sendError)(res, 'Failed to retrieve admins', 500, error);
        }
    }
    static async updateAdmin(req, res) {
        try {
            const adminId = parseInt(req.params.id);
            const { name, role, permissions, isActive } = req.body;
            if (isNaN(adminId)) {
                (0, responses_1.sendError)(res, 'Invalid admin ID', 400);
                return;
            }
            if (req.admin?.role !== types_1.AdminRole.SUPER_ADMIN && req.admin?.id !== adminId) {
                (0, responses_1.sendError)(res, 'Insufficient permissions', 403);
                return;
            }
            const { prisma } = await Promise.resolve().then(() => __importStar(require('../config/database')));
            const existingAdmin = await prisma.admin.findUnique({
                where: { id: adminId },
            });
            if (!existingAdmin) {
                (0, responses_1.sendError)(res, 'Admin not found', 404);
                return;
            }
            const updateData = {};
            if (name)
                updateData.name = name;
            if (req.admin?.role === types_1.AdminRole.SUPER_ADMIN) {
                if (role)
                    updateData.role = role;
                if (permissions !== undefined)
                    updateData.permissions = permissions;
                if (isActive !== undefined)
                    updateData.isActive = isActive;
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
            (0, responses_1.sendSuccess)(res, 'Admin updated successfully', updatedAdmin);
        }
        catch (error) {
            (0, responses_1.sendError)(res, 'Failed to update admin', 500, error);
        }
    }
    static async deleteAdmin(req, res) {
        try {
            const adminId = parseInt(req.params.id);
            if (isNaN(adminId)) {
                (0, responses_1.sendError)(res, 'Invalid admin ID', 400);
                return;
            }
            if (req.admin?.role !== types_1.AdminRole.SUPER_ADMIN) {
                (0, responses_1.sendError)(res, 'Only super admins can delete admins', 403);
                return;
            }
            if (req.admin?.id === adminId) {
                (0, responses_1.sendError)(res, 'Cannot delete your own account', 400);
                return;
            }
            const { prisma } = await Promise.resolve().then(() => __importStar(require('../config/database')));
            const existingAdmin = await prisma.admin.findUnique({
                where: { id: adminId },
            });
            if (!existingAdmin) {
                (0, responses_1.sendError)(res, 'Admin not found', 404);
                return;
            }
            await prisma.admin.delete({
                where: { id: adminId },
            });
            (0, responses_1.sendSuccess)(res, 'Admin deleted successfully', { id: adminId });
        }
        catch (error) {
            (0, responses_1.sendError)(res, 'Failed to delete admin', 500, error);
        }
    }
}
exports.AdminController = AdminController;
//# sourceMappingURL=admin.controller.js.map