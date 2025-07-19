import { Request } from "express";

export interface AuthenticatedUser {
  id: string;
  email: string;
  name?: string;
  role?: string;
}

export interface RequestWithUser extends Request {
  user: AuthenticatedUser;
}

export const isAuthenticatedRequest = (req: Request): req is RequestWithUser => {
  return req.user !== undefined && typeof req.user === "object" && req.user !== null && "id" in req.user;
};
