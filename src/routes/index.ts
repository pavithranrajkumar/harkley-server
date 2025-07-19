import { Router } from 'express';
import authRoutes from './auth';
import meetingRoutes from './meetings';
import webhookRoutes from './webhooks';

const router = Router();

// Mount all routes
router.use('/auth', authRoutes);
router.use('/meetings', meetingRoutes);
router.use('/webhooks', webhookRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Harkley AI Server',
  });
});

export default router;
