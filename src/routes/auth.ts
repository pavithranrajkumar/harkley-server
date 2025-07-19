import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { authenticateUser } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { signupSchema, loginSchema } from '../validation/auth';
import { signupLimiter, loginFailureLimiter } from '../middleware/rateLimit';

const router = Router();

// Public routes (no authentication required)
router.post('/signup', signupLimiter, validate(signupSchema), AuthController.signup);
router.post('/login', loginFailureLimiter, validate(loginSchema), AuthController.login);

// Protected routes (authentication required)
router.get('/profile', authenticateUser, AuthController.getProfile);

export default router;
