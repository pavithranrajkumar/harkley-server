import { Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { sendSuccess, sendError, sendBadRequest } from '../utils/response';
import { SignupInput, LoginInput } from '../validation/auth';
import { getErrorMessage } from '../utils/error';

export class AuthController {
  /**
   * Handle user signup
   */
  static async signup(req: Request, res: Response): Promise<void> {
    try {
      const input: SignupInput = req.body;

      const result = await AuthService.signup(input);

      sendSuccess(res, result, 'User created successfully', 201);
    } catch (error) {
      const message = getErrorMessage(error, 'Signup failed');
      sendError(res, 'SIGNUP_ERROR', message, 400);
    }
  }

  /**
   * Handle user login
   */
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const input: LoginInput = req.body;

      const result = await AuthService.login(input);

      sendSuccess(res, result, 'Login successful');
    } catch (error) {
      const message = getErrorMessage(error, 'Login failed');
      sendError(res, 'LOGIN_ERROR', message, 400);
    }
  }

  /**
   * Get user profile
   */
  static async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        sendBadRequest(res, 'Token is required');
        return;
      }

      const profile = await AuthService.getUserProfile(token);

      sendSuccess(res, profile, 'Profile retrieved successfully');
    } catch (error) {
      const message = getErrorMessage(error, 'Failed to get profile');
      sendError(res, 'PROFILE_ERROR', message, 400);
    }
  }

  /**
   * Handle user logout
   */
  static async logout(req: Request, res: Response): Promise<void> {
    try {
      await AuthService.logout();

      sendSuccess(res, null, 'Logout successful');
    } catch (error) {
      const message = getErrorMessage(error, 'Logout failed');
      sendError(res, 'LOGOUT_ERROR', message, 400);
    }
  }
}
