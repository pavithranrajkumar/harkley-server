import { Request, Response, NextFunction } from 'express';
import { createClient, User } from '@supabase/supabase-js';
import { sendUnauthorized, sendInternalError } from '../utils/response';
import { env } from '../config/env';

// Extend Request interface to include user
declare module 'express-serve-static-core' {
  interface Request {
    user: Partial<User> & { name?: string };
  }
}

export const authenticateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    console.log('🔐 Starting authentication...');

    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      sendUnauthorized(res, 'No valid authorization header found');
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    console.log('🔑 Token extracted, length:', token.length);

    const supabaseUrl = env.SUPABASE_URL;
    const supabaseAnonKey = env.SUPABASE_ANON_KEY;

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Authentication timeout')), 10000); // 10 second timeout
    });

    const authPromise = supabase.auth.getUser(token);

    const {
      data: { user },
      error,
    } = (await Promise.race([authPromise, timeoutPromise])) as any;

    if (error || !user) {
      sendUnauthorized(res, 'Invalid or expired token');
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.user_metadata.name,
      role: user.role,
    };

    next();
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication timeout') {
      sendInternalError(res, 'Authentication timeout - please try again');
    } else {
      sendInternalError(res, 'Authentication failed');
    }
  }
};

export const optionalAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next();
      return;
    }

    await authenticateUser(req, res, next);
  } catch {
    next();
  }
};
