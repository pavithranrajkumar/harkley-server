import { User } from '@supabase/supabase-js';
import { Request } from 'express';

export interface RequestWithUser extends Request {
  query: Record<string, string>;
  user: Partial<User> & { name?: string };
}

export const isAuthenticatedRequest = (req: Request): req is RequestWithUser => {
  return req.user !== undefined && typeof req.user === 'object' && req.user !== null && 'id' in req.user;
};

export const getUserId = (req: RequestWithUser): string => {
  return req.user.id!;
};
