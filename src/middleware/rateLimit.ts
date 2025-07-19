import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

// Rate limit configuration types
interface RateLimitConfig {
  windowMs: number;
  max: number;
  errorCode: string;
  errorMessage: string;
  keyType: 'ip' | 'userId';
  skipSuccessfulRequests?: boolean;
  skipUnauthenticated?: boolean;
}

// Rate limit configurations - centralized and easy to modify
const RATE_LIMIT_CONFIGS: Record<string, RateLimitConfig> = {
  signup: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5,
    errorCode: 'TOO_MANY_SIGNUP_ATTEMPTS',
    errorMessage: 'Too many signup attempts. Please try again in 1 hour.',
    keyType: 'ip',
  },
  loginFailure: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10,
    errorCode: 'TOO_MANY_LOGIN_ATTEMPTS',
    errorMessage: 'Too many failed login attempts. Please try again in 1 hour.',
    keyType: 'ip',
    skipSuccessfulRequests: true,
  },
  meetingCreation: {
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    max: 10,
    errorCode: 'MEETING_LIMIT_EXCEEDED',
    errorMessage: 'Daily meeting creation limit exceeded. Please try again tomorrow.',
    keyType: 'userId',
    skipUnauthenticated: true,
  },
  generalApi: {
    windowMs: 60 * 1000, // 1 minute
    max: 100,
    errorCode: 'TOO_MANY_REQUESTS',
    errorMessage: 'Too many requests. Please try again later.',
    keyType: 'ip',
  },
};

// Helper functions
const getClientIP = (req: Request): string => {
  return req.ip || req.connection.remoteAddress || 'unknown';
};

const getUserId = (req: Request): string => {
  return (req as any).user?.id || req.headers['user-id'] || getClientIP(req);
};

const createKeyGenerator = (keyType: 'ip' | 'userId') => {
  return (req: Request): string => {
    return keyType === 'userId' ? getUserId(req) : getClientIP(req);
  };
};

// Factory function to create rate limiters
const createRateLimiter = (config: RateLimitConfig) => {
  return rateLimit({
    windowMs: config.windowMs,
    max: config.max,
    message: {
      error: config.errorCode,
      message: config.errorMessage,
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: createKeyGenerator(config.keyType),
    skipSuccessfulRequests: config.skipSuccessfulRequests,
    skip: config.skipUnauthenticated ? (req: Request) => !(req as any).user?.id : undefined,
  });
};

// Export rate limiters - created from configurations
export const signupLimiter = createRateLimiter(RATE_LIMIT_CONFIGS.signup);
export const loginFailureLimiter = createRateLimiter(RATE_LIMIT_CONFIGS.loginFailure);
export const meetingCreationLimiter = createRateLimiter(RATE_LIMIT_CONFIGS.meetingCreation);
export const generalApiLimiter = createRateLimiter(RATE_LIMIT_CONFIGS.generalApi);

// Helper function to get rate limit info from response headers
export const getRateLimitInfo = (res: Response) => {
  return {
    limit: res.getHeader('X-RateLimit-Limit'),
    remaining: res.getHeader('X-RateLimit-Remaining'),
    reset: res.getHeader('X-RateLimit-Reset'),
  };
};
