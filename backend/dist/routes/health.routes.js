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
const express_1 = require("express");
const errorHandler_1 = require("../middleware/errorHandler");
const router = (0, express_1.Router)();
router.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'The Beacon Centre API is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        version: '1.0.0',
        status: 'healthy'
    });
});
router.get('/db', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    try {
        if (!process.env.DATABASE_URL) {
            res.status(200).json({
                success: true,
                message: 'Database not configured - running in development mode',
                timestamp: new Date().toISOString(),
                status: 'no-database'
            });
            return;
        }
        const { prisma, isDatabaseConfigured } = await Promise.resolve().then(() => __importStar(require('../config/database')));
        if (!isDatabaseConfigured) {
            res.status(200).json({
                success: true,
                message: 'Database not configured',
                timestamp: new Date().toISOString(),
                status: 'no-database'
            });
            return;
        }
        await prisma.$queryRaw `SELECT 1 as health_check`;
        res.json({
            success: true,
            message: 'Database connection is healthy',
            timestamp: new Date().toISOString(),
            status: 'connected'
        });
    }
    catch (error) {
        res.status(503).json({
            success: false,
            message: 'Database connection failed',
            error: error.message,
            timestamp: new Date().toISOString(),
            status: 'error'
        });
    }
}));
router.get('/system', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const healthCheck = {
        success: true,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: '1.0.0',
        services: {
            database: { status: 'unknown', message: '' },
            cloudinary: { status: 'unknown', message: '' },
            jwt: { status: 'unknown', message: '' },
        },
    };
    if (process.env.JWT_SECRET && process.env.JWT_REFRESH_SECRET) {
        healthCheck.services.jwt = { status: 'configured', message: 'JWT secrets configured' };
    }
    else {
        healthCheck.services.jwt = { status: 'using-defaults', message: 'Using default JWT secrets (development)' };
    }
    try {
        if (!process.env.DATABASE_URL) {
            healthCheck.services.database = { status: 'not-configured', message: 'No DATABASE_URL provided' };
        }
        else {
            const { prisma, isDatabaseConfigured } = await Promise.resolve().then(() => __importStar(require('../config/database')));
            if (!isDatabaseConfigured) {
                healthCheck.services.database = { status: 'not-configured', message: 'Database not configured' };
            }
            else {
                await prisma.$queryRaw `SELECT 1 as health_check`;
                healthCheck.services.database = { status: 'healthy', message: 'Connected and responsive' };
            }
        }
    }
    catch (error) {
        healthCheck.services.database = { status: 'unhealthy', message: error.message };
        healthCheck.success = false;
    }
    if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
        healthCheck.services.cloudinary = { status: 'configured', message: 'All environment variables present' };
    }
    else {
        healthCheck.services.cloudinary = { status: 'not-configured', message: 'Missing environment variables (optional)' };
    }
    const statusCode = healthCheck.success ? 200 : 503;
    res.status(statusCode).json(healthCheck);
}));
exports.default = router;
//# sourceMappingURL=health.routes.js.map