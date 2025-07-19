import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';
import { sendValidationError } from '../utils/response';

// Generic validation middleware
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
