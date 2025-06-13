import { Response } from 'express';
import { ApiResponse } from '../types';

/**
 * Standardized API response utilities
 * Ensures consistent response format across all endpoints
 */

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message?: string,
  statusCode: number = 200
): Response => {
  const response: ApiResponse<T> = {
    success: true,
    data,
    message
  };
  return res.status(statusCode).json(response);
};

export const sendError = (
  res: Response,
  error: string,
  statusCode: number = 400,
  details?: any
): Response => {
  const response: ApiResponse<never> = {
    success: false,
    error,
    ...(details && { errors: details })
  };
  return res.status(statusCode).json(response);
};

export const sendValidationError = (
  res: Response,
  errors: Record<string, string[]>,
  message: string = 'Validation failed'
): Response => {
  const response: ApiResponse<never> = {
    success: false,
    error: message,
    errors
  };
  return res.status(422).json(response);
};

export const sendNotFound = (
  res: Response,
  resource: string = 'Resource'
): Response => {
  const response: ApiResponse<never> = {
    success: false,
    error: `${resource} not found`
  };
  return res.status(404).json(response);
};

export const sendUnauthorized = (
  res: Response,
  message: string = 'Unauthorized access'
): Response => {
  const response: ApiResponse<never> = {
    success: false,
    error: message
  };
  return res.status(401).json(response);
};

export const sendForbidden = (
  res: Response,
  message: string = 'Access forbidden'
): Response => {
  const response: ApiResponse<never> = {
    success: false,
    error: message
  };
  return res.status(403).json(response);
};

export const sendServerError = (
  res: Response,
  message: string = 'Internal server error',
  details?: any
): Response => {
  const response: ApiResponse<never> = {
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && details && { errors: details })
  };
  return res.status(500).json(response);
};

// Helper for paginated responses
export const sendPaginatedSuccess = <T>(
  res: Response,
  data: T[],
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  },
  message?: string
): Response => {
  const response: ApiResponse<{
    items: T[];
    pagination: typeof pagination;
  }> = {
    success: true,
    data: {
      items: data,
      pagination
    },
    message
  };
  return res.status(200).json(response);
};