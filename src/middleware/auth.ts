import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import { sendUnauthorized, sendInternalError } from '../utils/response';
import { env } from '../config/env';

// Extend Request interface to include user
declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      id: string;
      email: string;
      role?: string;
    };
  }
}

export const authenticateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      sendUnauthorized(res, 'No valid authorization header found');
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Create Supabase client
    const supabaseUrl = env.SUPABASE_URL;
    const supabaseAnonKey = env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Supabase configuration missing');
      sendInternalError(res, 'Authentication configuration error');
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Use Supabase Auth to verify the token
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      console.error('Supabase auth error:', error);
      sendUnauthorized(res, 'Invalid or expired token');
      return;
    }

    // Attach user info to request
    req.user = {
      id: user.id,
      email: user.email || '',
      role: user.role,
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    sendInternalError(res, 'Authentication failed');
  }
};

// Optional: Middleware to check if user is authenticated (for optional routes)
export const optionalAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, continue without user
      next();
      return;
    }

    // Try to authenticate, but don't fail if it doesn't work
    await authenticateUser(req, res, next);
  } catch {
    // If authentication fails, continue without user
    next();
  }
};
