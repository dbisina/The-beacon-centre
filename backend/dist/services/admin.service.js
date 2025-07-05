"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma = new client_1.PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-jwt-refresh-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
class AdminService {
    static async login(credentials) {
        try {
            const { email, password } = credentials;
            const admin = await prisma.admin.findUnique({
                where: { email: email.toLowerCase() }
            });
            if (!admin) {
                return {
                    success: false,
                    error: 'Invalid email or password'
                };
            }
            if (!admin.isActive) {
                return {
                    success: false,
                    error: 'Account is deactivated. Please contact a super admin.'
                };
            }
            const isPasswordValid = await bcryptjs_1.default.compare(password, admin.passwordHash);
            if (!isPasswordValid) {
                return {
                    success: false,
                    error: 'Invalid email or password'
                };
            }
            const tokenPayload = {
                adminId: admin.id,
                email: admin.email,
                role: admin.role,
                permissions: admin.permissions
            };
            const accessToken = jsonwebtoken_1.default.sign(tokenPayload, JWT_SECRET, {
                expiresIn: JWT_EXPIRES_IN
            });
            const refreshToken = jsonwebtoken_1.default.sign({ adminId: admin.id }, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN });
            await prisma.admin.update({
                where: { id: admin.id },
                data: {
                    lastLogin: new Date(),
                    loginCount: {
                        increment: 1
                    }
                }
            });
            const { passwordHash, ...adminData } = admin;
            return {
                success: true,
                data: {
                    admin: adminData,
                    accessToken,
                    refreshToken
                }
            };
        }
        catch (error) {
            return {
                success: false,
                error: 'Login failed',
                details: error
            };
        }
    }
    static async refreshToken(refreshToken) {
        try {
            const decoded = jsonwebtoken_1.default.verify(refreshToken, JWT_REFRESH_SECRET);
            const admin = await prisma.admin.findUnique({
                where: { id: decoded.adminId }
            });
            if (!admin || !admin.isActive) {
                return {
                    success: false,
                    error: 'Invalid refresh token'
                };
            }
            const tokenPayload = {
                adminId: admin.id,
                email: admin.email,
                role: admin.role,
                permissions: admin.permissions
            };
            const accessToken = jsonwebtoken_1.default.sign(tokenPayload, JWT_SECRET, {
                expiresIn: JWT_EXPIRES_IN
            });
            return {
                success: true,
                data: { accessToken }
            };
        }
        catch (error) {
            return {
                success: false,
                error: 'Token refresh failed',
                details: error
            };
        }
    }
    static async verifyToken(token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
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
        }
        catch (error) {
            return {
                success: false,
                error: 'Token verification failed',
                details: error
            };
        }
    }
    static async getAdmins(includeInactive = false) {
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
        }
        catch (error) {
            return {
                success: false,
                error: 'Failed to fetch admins',
                details: error
            };
        }
    }
    static async getAdminById(id) {
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
        }
        catch (error) {
            return {
                success: false,
                error: 'Failed to fetch admin',
                details: error
            };
        }
    }
    static async createAdmin(data) {
        try {
            const existingAdmin = await prisma.admin.findUnique({
                where: { email: data.email.toLowerCase() }
            });
            if (existingAdmin) {
                return {
                    success: false,
                    error: 'An admin with this email already exists'
                };
            }
            if (data.password.length < 8) {
                return {
                    success: false,
                    error: 'Password must be at least 8 characters long'
                };
            }
            const saltRounds = 12;
            const passwordHash = await bcryptjs_1.default.hash(data.password, saltRounds);
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
        }
        catch (error) {
            return {
                success: false,
                error: 'Failed to create admin',
                details: error
            };
        }
    }
    static async updateAdmin(data) {
        try {
            const { id, ...updateData } = data;
            const existingAdmin = await prisma.admin.findUnique({
                where: { id }
            });
            if (!existingAdmin) {
                return {
                    success: false,
                    error: 'Admin not found'
                };
            }
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
        }
        catch (error) {
            return {
                success: false,
                error: 'Failed to update admin',
                details: error
            };
        }
    }
    static async changePassword(adminId, currentPassword, newPassword) {
        try {
            const admin = await prisma.admin.findUnique({
                where: { id: adminId }
            });
            if (!admin) {
                return {
                    success: false,
                    error: 'Admin not found'
                };
            }
            const isCurrentPasswordValid = await bcryptjs_1.default.compare(currentPassword, admin.passwordHash);
            if (!isCurrentPasswordValid) {
                return {
                    success: false,
                    error: 'Current password is incorrect'
                };
            }
            if (newPassword.length < 8) {
                return {
                    success: false,
                    error: 'New password must be at least 8 characters long'
                };
            }
            const saltRounds = 12;
            const newPasswordHash = await bcryptjs_1.default.hash(newPassword, saltRounds);
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
        }
        catch (error) {
            return {
                success: false,
                error: 'Failed to change password',
                details: error
            };
        }
    }
    static async resetPassword(adminId, newPassword) {
        try {
            const admin = await prisma.admin.findUnique({
                where: { id: adminId }
            });
            if (!admin) {
                return {
                    success: false,
                    error: 'Admin not found'
                };
            }
            if (newPassword.length < 8) {
                return {
                    success: false,
                    error: 'New password must be at least 8 characters long'
                };
            }
            const saltRounds = 12;
            const passwordHash = await bcryptjs_1.default.hash(newPassword, saltRounds);
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
        }
        catch (error) {
            return {
                success: false,
                error: 'Failed to reset password',
                details: error
            };
        }
    }
    static async deleteAdmin(id) {
        try {
            const existingAdmin = await prisma.admin.findUnique({
                where: { id }
            });
            if (!existingAdmin) {
                return {
                    success: false,
                    error: 'Admin not found'
                };
            }
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
        }
        catch (error) {
            return {
                success: false,
                error: 'Failed to delete admin',
                details: error
            };
        }
    }
    static async toggleActive(id) {
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
        }
        catch (error) {
            return {
                success: false,
                error: 'Failed to toggle admin status',
                details: error
            };
        }
    }
    static async getAdminStats() {
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
        }
        catch (error) {
            return {
                success: false,
                error: 'Failed to get admin statistics',
                details: error
            };
        }
    }
    static hasPermission(admin, permission) {
        if (admin.role === 'SUPER_ADMIN') {
            return true;
        }
        return admin.permissions.includes(permission);
    }
    static hasRole(admin, role) {
        return admin.role === role;
    }
    static hasMinimumRole(admin, minimumRole) {
        const roleHierarchy = {
            EDITOR: 1,
            ADMIN: 2,
            SUPER_ADMIN: 3
        };
        return roleHierarchy[admin.role] >= roleHierarchy[minimumRole];
    }
}
exports.AdminService = AdminService;
//# sourceMappingURL=admin.service.js.map