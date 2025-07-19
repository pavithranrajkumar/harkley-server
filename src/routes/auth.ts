import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { authenticateUser } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { signupSchema, loginSchema } from '../validation/auth';

const router = Router();

// Public routes (no authentication required)
router.post('/signup', validate(signupSchema), AuthController.signup);
router.post('/login', validate(loginSchema), AuthController.login);

// Protected routes (authentication required)
router.get('/profile', authenticateUser, AuthController.getProfile);
router.post('/logout', authenticateUser, AuthController.logout);

export default router;
