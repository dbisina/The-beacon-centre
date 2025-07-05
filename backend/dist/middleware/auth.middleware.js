"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureDefaultAdmin = exports.optionalAuth = exports.verifyRefreshToken = exports.generateTokens = exports.requireSuperAdmin = exports.requirePermission = exports.requireRole = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const types_1 = require("../types");
const responses_1 = require("../utils/responses");
let prisma = null;
try {
    prisma = new client_1.PrismaClient();
}
catch (error) {
    console.warn('Auth middleware: Prisma client initialization failed');
    prisma = null;
}
const JWT_SECRET = process.env.JWT_SECRET || 'beacon-centre-dev-secret-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'beacon-centre-dev-refresh-secret';
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.startsWith('Bearer ')
            ? authHeader.substring(7)
            : null;
        if (!token) {
            (0, responses_1.sendError)(res, 'Access token required', 401);
            return;
        }
        let decoded;
        try {
            decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        }
        catch (jwtError) {
            console.warn('JWT verification failed:', jwtError.message);
            if (jwtError.name === 'TokenExpiredError') {
                (0, responses_1.sendError)(res, 'Token expired', 401, { expired: true });
            }
            else if (jwtError.name === 'JsonWebTokenError') {
                (0, responses_1.sendError)(res, 'Invalid token', 401, { invalid: true });
            }
            else {
                (0, responses_1.sendError)(res, 'Token verification failed', 401);
            }
            return;
        }
        if (!decoded.adminId || !decoded.email) {
            (0, responses_1.sendError)(res, 'Invalid token payload', 401);
            return;
        }
        let admin = null;
        if (prisma) {
            try {
                admin = await prisma.admin.findUnique({
                    where: { id: decoded.adminId },
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        role: true,
                        permissions: true,
                        isActive: true,
                        createdAt: true,
                        updatedAt: true,
                        lastLogin: true,
                        loginCount: true,
                    },
                });
                if (!admin) {
                    (0, responses_1.sendError)(res, 'Admin not found', 401);
                    return;
                }
                if (!admin.isActive) {
                    (0, responses_1.sendError)(res, 'Admin account is inactive', 401);
                    return;
                }
            }
            catch (dbError) {
                console.warn('Database query failed in auth middleware, using token data:', dbError);
                admin = {
                    id: decoded.adminId,
                    email: decoded.email,
                    name: 'Admin User',
                    role: decoded.role || types_1.AdminRole.ADMIN,
                    permissions: decoded.permissions || [],
                    isActive: true,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    lastLogin: new Date(),
                    loginCount: 1,
                };
            }
        }
        else {
            admin = {
                id: decoded.adminId,
                email: decoded.email,
                name: 'Admin User',
                role: decoded.role || types_1.AdminRole.ADMIN,
                permissions: decoded.permissions || [],
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
                lastLogin: new Date(),
                loginCount: 1,
            };
        }
        req.admin = admin;
        req.adminId = admin.id;
        console.log(`✅ Authentication successful for admin: ${admin.email}`);
        next();
    }
    catch (error) {
        console.error('Authentication middleware error:', error);
        (0, responses_1.sendError)(res, 'Authentication failed', 500, error);
    }
};
exports.authenticate = authenticate;
const requireRole = (requiredRoles) => {
    return (req, res, next) => {
        if (!req.admin) {
            (0, responses_1.sendError)(res, 'Authentication required', 401);
            return;
        }
        const hasRequiredRole = requiredRoles.includes(req.admin.role);
        if (!hasRequiredRole) {
            (0, responses_1.sendError)(res, 'Insufficient permissions', 403, {
                required: requiredRoles,
                current: req.admin.role,
            });
            return;
        }
        next();
    };
};
exports.requireRole = requireRole;
const requirePermission = (requiredPermissions) => {
    return (req, res, next) => {
        if (!req.admin) {
            (0, responses_1.sendError)(res, 'Authentication required', 401);
            return;
        }
        const adminPermissions = req.admin.permissions || [];
        const hasAllPermissions = requiredPermissions.every(permission => adminPermissions.includes(permission));
        if (!hasAllPermissions) {
            (0, responses_1.sendError)(res, 'Insufficient permissions', 403, {
                required: requiredPermissions,
                current: adminPermissions,
            });
            return;
        }
        next();
    };
};
exports.requirePermission = requirePermission;
exports.requireSuperAdmin = (0, exports.requireRole)([types_1.AdminRole.SUPER_ADMIN]);
const generateTokens = (admin) => {
    const payload = {
        adminId: admin.id,
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions || [],
    };
    const accessToken = jsonwebtoken_1.default.sign(payload, JWT_SECRET, {
        expiresIn: '15m',
        issuer: 'beacon-centre-api',
        audience: 'beacon-centre-admin',
    });
    const refreshToken = jsonwebtoken_1.default.sign({ adminId: admin.id }, JWT_REFRESH_SECRET, {
        expiresIn: '7d',
        issuer: 'beacon-centre-api',
        audience: 'beacon-centre-admin',
    });
    return { accessToken, refreshToken };
};
exports.generateTokens = generateTokens;
const verifyRefreshToken = (token) => {
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_REFRESH_SECRET);
        return decoded;
    }
    catch (error) {
        throw new Error(`Invalid refresh token: ${error.message}`);
    }
};
exports.verifyRefreshToken = verifyRefreshToken;
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.startsWith('Bearer ')
            ? authHeader.substring(7)
            : null;
        if (!token) {
            next();
            return;
        }
        try {
            const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
            if (prisma) {
                const admin = await prisma.admin.findUnique({
                    where: { id: decoded.adminId },
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        role: true,
                        permissions: true,
                        isActive: true,
                        createdAt: true,
                        updatedAt: true,
                        lastLogin: true,
                        loginCount: true,
                    },
                });
                if (admin && admin.isActive) {
                    req.admin = admin;
                    req.adminId = admin.id;
                }
            }
            else {
                const admin = {
                    id: decoded.adminId,
                    email: decoded.email,
                    name: 'Admin User',
                    role: decoded.role || types_1.AdminRole.ADMIN,
                    permissions: decoded.permissions || [],
                    isActive: true,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    lastLogin: new Date(),
                    loginCount: 1,
                };
                req.admin = admin;
                req.adminId = admin.id;
            }
        }
        catch (authError) {
            console.log('Optional auth failed:', authError);
        }
        next();
    }
    catch (error) {
        console.warn('Optional auth middleware error:', error);
        next();
    }
};
exports.optionalAuth = optionalAuth;
const ensureDefaultAdmin = async () => {
    if (!prisma || process.env.NODE_ENV === 'production') {
        return;
    }
    try {
        const adminCount = await prisma.admin.count();
        if (adminCount === 0) {
            const bcrypt = require('bcryptjs');
            const hashedPassword = await bcrypt.hash('admin123', 10);
            await prisma.admin.create({
                data: {
                    email: 'admin@beaconcentre.org',
                    passwordHash: hashedPassword,
                    name: 'Default Admin',
                    role: types_1.AdminRole.SUPER_ADMIN,
                    permissions: ['*'],
                    isActive: true,
                },
            });
            console.log('✅ Default admin created: admin@beaconcentre.org / admin123');
        }
    }
    catch (error) {
        console.warn('Failed to create default admin:', error);
    }
};
exports.ensureDefaultAdmin = ensureDefaultAdmin;
if (process.env.NODE_ENV !== 'production') {
    (0, exports.ensureDefaultAdmin)();
}
exports.default = {
    authenticate: exports.authenticate,
    requireRole: exports.requireRole,
    requirePermission: exports.requirePermission,
    requireSuperAdmin: exports.requireSuperAdmin,
    optionalAuth: exports.optionalAuth,
    generateTokens: exports.generateTokens,
    verifyRefreshToken: exports.verifyRefreshToken,
};
//# sourceMappingURL=auth.middleware.js.map