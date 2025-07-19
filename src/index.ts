import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { testConnection } from './config/database';
import { authenticateUser } from './middleware/auth';
import { sendSuccess, sendError } from './utils/response';
import { env, isDevelopment } from './config/env';
import { getErrorMessage } from './utils/error';
import authRoutes from './routes/auth';

const app = express();
const PORT = env.PORT;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  sendSuccess(
    res,
    {
      status: 'OK',
      environment: env.NODE_ENV,
    },
    'Server is healthy'
  );
});

// Basic API endpoint
app.get('/api', (req, res) => {
  sendSuccess(res, {
    message: 'Harkley AI Server is running! 🎯',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      api: '/api',
      db: '/api/db-test',
      auth: {
        signup: 'POST /api/auth/signup',
        login: 'POST /api/auth/login',
        profile: 'GET /api/auth/profile (requires auth)',
        logout: 'POST /api/auth/logout (requires auth)',
      },
      protected: '/api/protected (requires auth)',
    },
  });
});

// Database test endpoint
app.get('/api/db-test', async (req, res) => {
  try {
    const isConnected = await testConnection();
    sendSuccess(
      res,
      {
        status: isConnected ? 'connected' : 'failed',
      },
      isConnected ? 'Database connection successful' : 'Database connection failed'
    );
  } catch {
    sendError(res, 'DATABASE_ERROR', 'Database test failed', 500);
  }
});

// Auth routes
app.use('/api/auth', authRoutes);

// Protected test endpoint (requires authentication)
app.get('/api/protected', authenticateUser, (req, res) => {
  sendSuccess(res, {
    message: '🔐 Protected endpoint accessed successfully!',
    user: req.user,
  });
});

// Global error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  sendError(res, 'INTERNAL_ERROR', 'Something went wrong', 500);
});

// 404 handler
app.use((req, res) => {
  sendError(res, 'NOT_FOUND', `Route ${req.originalUrl} not found`, 404);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Harkley AI Server running on port ${PORT}`);
  console.log(`📊 Environment: ${env.NODE_ENV}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});

export default app;
