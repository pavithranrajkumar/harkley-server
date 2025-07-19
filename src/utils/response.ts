import { Response } from 'express';

// Standard response interfaces
interface SuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
  timestamp: string;
}

interface ErrorResponse {
  success: false;
  error: string;
  message: string;
  timestamp: string;
  details?: unknown;
}

// Success response wrapper
export const sendSuccess = <T>(res: Response, data: T, message?: string, statusCode: number = 200): void => {
  const response: SuccessResponse<T> = {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString(),
  };

  res.status(statusCode).json(response);
};

// Error response wrapper
export const sendError = (res: Response, error: string, message: string, statusCode: number = 500, details?: unknown): void => {
  const response: ErrorResponse = {
    success: false,
    error,
    message,
    timestamp: new Date().toISOString(),
    details,
  };

  res.status(statusCode).json(response);
};

// Common error responses
export const sendUnauthorized = (res: Response, message: string = 'Unauthorized'): void => {
  sendError(res, 'UNAUTHORIZED', message, 401);
};

export const sendNotFound = (res: Response, message: string = 'Resource not found'): void => {
  sendError(res, 'NOT_FOUND', message, 404);
};

export const sendBadRequest = (res: Response, message: string = 'Bad request'): void => {
  sendError(res, 'BAD_REQUEST', message, 400);
};

export const sendInternalError = (res: Response, message: string = 'Internal server error'): void => {
  sendError(res, 'INTERNAL_ERROR', message, 500);
};

export const sendValidationError = (res: Response, message: string, details?: unknown): void => {
  sendError(res, 'VALIDATION_ERROR', message, 400, details);
};
