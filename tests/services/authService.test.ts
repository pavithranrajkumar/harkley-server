import { AuthService } from '../../src/services/authService';

// Mock Supabase client
jest.mock('@supabase/supabase-js', () => {
  const mockSignUp = jest.fn();
  const mockSignInWithPassword = jest.fn();
  const mockGetSession = jest.fn();
  const mockGetUser = jest.fn();
  const mockSignOut = jest.fn();

  return {
    createClient: jest.fn(() => ({
      auth: {
        signUp: mockSignUp,
        signInWithPassword: mockSignInWithPassword,
        getSession: mockGetSession,
        getUser: mockGetUser,
        signOut: mockSignOut,
      },
    })),
  };
});

describe('AuthService', () => {
  let mockSignUp: jest.Mock;
  let mockSignInWithPassword: jest.Mock;
  let mockGetSession: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Get the mocked functions
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const supabase = require('@supabase/supabase-js').createClient();
    mockSignUp = supabase.auth.signUp;
    mockSignInWithPassword = supabase.auth.signInWithPassword;
    mockGetSession = supabase.auth.getSession;
  });

  describe('signup', () => {
    it('should handle successful signup', async () => {
      // Mock successful signup response
      mockSignUp.mockResolvedValue({
        data: {
          user: {
            id: 'user-123',
            email: 'test@example.com',
            user_metadata: { name: 'Test User' },
          },
        },
        error: null,
      });

      // Mock successful session response
      mockGetSession.mockResolvedValue({
        data: {
          session: { access_token: 'mock-token-123' },
        },
        error: null,
      });

      const result = await AuthService.signup({
        email: 'test@example.com',
        password: 'TestPass123',
        name: 'Test User',
      });

      expect(result.user.email).toBe('test@example.com');
      expect(result.token).toBe('mock-token-123');
    });

    it('should handle signup error', async () => {
      mockSignUp.mockResolvedValue({
        data: { user: null },
        error: { message: 'Email already exists' },
      });

      await expect(
        AuthService.signup({
          email: 'test@example.com',
          password: 'TestPass123',
          name: 'Test User',
        })
      ).rejects.toThrow('Email already exists');
    });
  });

  describe('login', () => {
    it('should handle successful login', async () => {
      mockSignInWithPassword.mockResolvedValue({
        data: {
          user: {
            id: 'user-123',
            email: 'test@example.com',
            user_metadata: { name: 'Test User' },
          },
        },
        error: null,
      });

      mockGetSession.mockResolvedValue({
        data: {
          session: { access_token: 'mock-token-123' },
        },
        error: null,
      });

      const result = await AuthService.login({
        email: 'test@example.com',
        password: 'TestPass123',
      });

      expect(result.user.email).toBe('test@example.com');
      expect(result.token).toBe('mock-token-123');
    });

    it('should handle login error', async () => {
      mockSignInWithPassword.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid credentials' },
      });

      await expect(
        AuthService.login({
          email: 'test@example.com',
          password: 'wrongpassword',
        })
      ).rejects.toThrow('Invalid credentials');
    });
  });
});
