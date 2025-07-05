"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncHandler = exports.notFoundHandler = exports.errorHandler = exports.ApiError = void 0;
class ApiError extends Error {
    constructor(message, statusCode, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.ApiError = ApiError;
const isPrismaError = (error) => {
    return error && typeof error.code === 'string' && error.code.startsWith('P');
};
const isJWTError = (error) => {
    return error && ['JsonWebTokenError', 'TokenExpiredError', 'NotBeforeError'].includes(error.name);
};
const isValidationError = (error) => {
    return error && error.name === 'ValidationError';
};
const handlePrismaError = (error) => {
    switch (error.code) {
        case 'P2002':
            const field = error.meta?.target?.[0] || 'field';
            return new ApiError(`${field} already exists`, 409);
        case 'P2025':
            return new ApiError('Record not found', 404);
        case 'P2003':
            return new ApiError('Referenced record does not exist', 400);
        case 'P2014':
            return new ApiError('Invalid relation in request', 400);
        case 'P2021':
            return new ApiError('Database table does not exist', 500);
        case 'P2022':
            return new ApiError('Database column does not exist', 500);
        default:
            console.error('Unhandled Prisma error:', error);
            return new ApiError('Database operation failed', 500);
    }
};
const handleJWTError = (error) => {
    switch (error.name) {
        case 'JsonWebTokenError':
            return new ApiError('Invalid token', 401);
        case 'TokenExpiredError':
            return new ApiError('Token expired', 401);
        case 'NotBeforeError':
            return new ApiError('Token not active', 401);
        default:
            return new ApiError('Authentication failed', 401);
    }
};
const handleValidationError = (error) => {
    const message = error.details?.map(detail => detail.message).join(', ') || 'Validation failed';
    return new ApiError(message, 400);
};
const errorHandler = (error, req, res, next) => {
    let err = error;
    if (isPrismaError(error)) {
        err = handlePrismaError(error);
    }
    else if (isJWTError(error)) {
        err = handleJWTError(error);
    }
    else if (isValidationError(error)) {
        err = handleValidationError(error);
    }
    if (!(err instanceof ApiError)) {
        const statusCode = 500;
        const message = process.env.NODE_ENV === 'production'
            ? 'Internal server error'
            : error.message;
        err = new ApiError(message, statusCode, false);
    }
    if (process.env.NODE_ENV === 'development') {
        console.error('Error:', {
            message: err.message,
            stack: err.stack,
            url: req.url,
            method: req.method,
            body: req.body,
            params: req.params,
            query: req.query,
        });
    }
    else {
        console.error('Error:', {
            message: err.message,
            statusCode: err.statusCode,
            url: req.url,
            method: req.method,
        });
    }
    res.status(err.statusCode || 500).json({
        success: false,
        error: {
            message: err.message,
            ...(process.env.NODE_ENV === 'development' && {
                stack: err.stack,
                details: error
            }),
        },
    });
};
exports.errorHandler = errorHandler;
const notFoundHandler = (req, res, next) => {
    const error = new ApiError(`Route ${req.originalUrl} not found`, 404);
    next(error);
};
exports.notFoundHandler = notFoundHandler;
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.asyncHandler = asyncHandler;
//# sourceMappingURL=errorHandler.js.map