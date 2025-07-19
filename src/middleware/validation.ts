import { Request, Response, NextFunction } from 'express';
import { sendBadRequest } from '../utils/response';
import { z, ZodError } from 'zod';
import { sendValidationError } from '../utils/response';

/**
 * Middleware to validate UUID route parameters
 */
export const validateParam = (paramName: string = 'id') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const id = req.params[paramName];

    if (!id) {
      sendBadRequest(res, `${paramName} parameter is required`);
      return;
    }

    // UUID v4 regex pattern
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (!uuidRegex.test(id)) {
      sendBadRequest(res, `Invalid ${paramName} format`);
      return;
    }

    next();
  };
};

export const validate = (schema: z.ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        try {
          const errorData = JSON.parse(error.message);
          const firstError = Array.isArray(errorData) && errorData.length > 0 ? errorData[0] : null;
          const errorMessage = firstError?.message || error.message;
          sendValidationError(res, errorMessage);
        } catch {
          sendValidationError(res, error.message);
        }
      } else {
        sendValidationError(res, 'Validation failed');
      }
    }
  };
};
