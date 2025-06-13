import { Request, Response, NextFunction } from 'express';

// Define custom error types
interface PrismaError extends Error {
  code: string;
  meta?: any;
}

interface JWTError extends Error {
  name: 'JsonWebTokenError' | 'TokenExpiredError' | 'NotBeforeError';
}

interface ValidationError extends Error {
  details?: any[];
}

// Custom error class for API errors
export class ApiError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

// Type guards for different error types
const isPrismaError = (error: any): error is PrismaError => {
  return error && typeof error.code === 'string' && error.code.startsWith('P');
};

const isJWTError = (error: any): error is JWTError => {
  return error && ['JsonWebTokenError', 'TokenExpiredError', 'NotBeforeError'].includes(error.name);
};

const isValidationError = (error: any): error is ValidationError => {
  return error && error.name === 'ValidationError';
};

// Handle Prisma database errors
const handlePrismaError = (error: PrismaError): ApiError => {
  switch (error.code) {
    case 'P2002':
      // Unique constraint violation
      const field = error.meta?.target?.[0] || 'field';
      return new ApiError(`${field} already exists`, 409);
    
    case 'P2025':
      // Record not found
      return new ApiError('Record not found', 404);
    
    case 'P2003':
      // Foreign key constraint violation
      return new ApiError('Referenced record does not exist', 400);
    
    case 'P2014':
      // Invalid relation
      return new ApiError('Invalid relation in request', 400);
    
    case 'P2021':
      // Table does not exist
      return new ApiError('Database table does not exist', 500);
    
    case 'P2022':
      // Column does not exist
      return new ApiError('Database column does not exist', 500);
    
    default:
      console.error('Unhandled Prisma error:', error);
      return new ApiError('Database operation failed', 500);
  }
};

// Handle JWT errors
const handleJWTError = (error: JWTError): ApiError => {
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

// Handle validation errors
const handleValidationError = (error: ValidationError): ApiError => {
  const message = error.details?.map(detail => detail.message).join(', ') || 'Validation failed';
  return new ApiError(message, 400);
};

// Main error handling middleware
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let err = error;

  // Convert known error types to ApiError
  if (isPrismaError(error)) {
    err = handlePrismaError(error);
  } else if (isJWTError(error)) {
    err = handleJWTError(error);
  } else if (isValidationError(error)) {
    err = handleValidationError(error);
  }

  // If it's still not an ApiError, create one
  if (!(err instanceof ApiError)) {
    const statusCode = 500;
    const message = process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : error.message;
    err = new ApiError(message, statusCode, false);
  }

  // Log error for debugging
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
  } else {
    // In production, log only essential information
    console.error('Error:', {
      message: err.message,
      statusCode: (err as ApiError).statusCode,
      url: req.url,
      method: req.method,
    });
  }

  // Send error response
  res.status((err as ApiError).statusCode || 500).json({
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

// 404 handler for unmatched routes
export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  const error = new ApiError(`Route ${req.originalUrl} not found`, 404);
  next(error);
};

// Async error wrapper for route handlers
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};