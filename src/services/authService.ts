import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env';
import { AuthResponse, UserProfile } from '../types/auth';
import { SignupInput, LoginInput } from '../validation/auth';
import { getErrorMessage } from '../utils/error';

// Initialize Supabase client
const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);

export class AuthService {
  /**
   * Create a new user account
   */
  static async signup(input: SignupInput): Promise<AuthResponse> {
    try {
      const { name, email, password } = input;
      // Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
        },
      });

      if (authError) {
        throw new Error(authError.message);
      }

      if (!authData.user) {
        throw new Error('Failed to create user');
      }

      // Get session with token
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !sessionData.session) {
        throw new Error('Failed to get session');
      }

      return {
        user: {
          id: authData.user.id,
          email: authData.user.email!,
          name,
        },
        token: sessionData.session.access_token,
      };
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Signup failed'));
    }
  }

  /**
   * Authenticate existing user
   */
  static async login(input: LoginInput): Promise<AuthResponse> {
    try {
      const { email, password } = input;
      // Sign in with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        throw new Error(authError.message);
      }

      if (!authData.user) {
        throw new Error('Invalid credentials');
      }

      // Get session with token
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !sessionData.session) {
        throw new Error('Failed to get session');
      }

      const { id, user_metadata } = authData.user;
      return {
        user: {
          id,
          email,
          name: user_metadata?.name,
        },
        token: sessionData.session.access_token,
      };
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Login failed'));
    }
  }

  /**
   * Get user profile by token
   */
  static async getUserProfile(token: string): Promise<UserProfile> {
    try {
      // Set auth token
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(token);

      if (error || !user) {
        throw new Error('Invalid token');
      }

      return {
        id: user.id,
        email: user.email!,
        name: user.user_metadata?.name,
        createdAt: new Date(user.created_at),
        updatedAt: new Date(user.updated_at || user.created_at),
      };
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to get user profile'));
    }
  }
}
