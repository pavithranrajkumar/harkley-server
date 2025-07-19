import { Router } from 'express';
import authRoutes from './auth';
import meetingRoutes from './meetings';

const router = Router();

// Mount all routes
router.use('/auth', authRoutes);
router.use('/meetings', meetingRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Harkley AI Server',
  });
});

export default router;
