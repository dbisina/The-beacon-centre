"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.smartRateLimiter = exports.createDevLimiter = exports.analyticsLimiter = exports.uploadLimiter = exports.adminApiLimiter = exports.adminAuthLimiter = exports.generalApiLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
exports.generalApiLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 500,
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        return req.path.startsWith('/api/admin/');
    },
});
exports.adminAuthLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: {
        success: false,
        message: 'Too many login attempts, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
});
exports.adminApiLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: (req) => {
        const authReq = req;
        if (authReq.admin) {
            return 2000;
        }
        return 50;
    },
    message: {
        success: false,
        message: 'Too many admin requests, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        const authReq = req;
        return authReq.admin
            ? `admin_${authReq.admin.id}`
            : req.ip || 'unknown-ip';
    },
});
exports.uploadLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000,
    max: 100,
    message: {
        success: false,
        message: 'Upload limit exceeded, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});
exports.analyticsLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    message: {
        success: false,
        message: 'Analytics limit exceeded.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});
const createDevLimiter = () => (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 0,
    skip: () => process.env.NODE_ENV === 'development',
});
exports.createDevLimiter = createDevLimiter;
const smartRateLimiter = (req, res, next) => {
    if (process.env.NODE_ENV === 'development') {
        return next();
    }
    const path = req.path;
    if (path.includes('/admin/auth/')) {
        return (0, exports.adminAuthLimiter)(req, res, next);
    }
    if (path.startsWith('/api/admin/')) {
        return (0, exports.adminApiLimiter)(req, res, next);
    }
    if (path.includes('/upload')) {
        return (0, exports.uploadLimiter)(req, res, next);
    }
    if (path.includes('/analytics')) {
        return (0, exports.analyticsLimiter)(req, res, next);
    }
    return (0, exports.generalApiLimiter)(req, res, next);
};
exports.smartRateLimiter = smartRateLimiter;
//# sourceMappingURL=rateLimiter.js.map