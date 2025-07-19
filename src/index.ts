import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { sendSuccess, sendError } from './utils/response';
import { env } from './config/env';
import { AppDataSource } from './config/ormconfig';
import routes from './routes';
import { generalApiLimiter } from './middleware/rateLimit';

const app = express();
const PORT = env.PORT;

// Initialize TypeORM database connection
const initializeDatabase = async () => {
  try {
    await AppDataSource.initialize();
    console.log('✅ TypeORM database connection established');
  } catch (error) {
    console.error('❌ TypeORM database connection failed:', error);
    process.exit(1);
  }
};

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Apply general rate limiting to all API routes
app.use('/api', generalApiLimiter);

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

// API routes
app.use('/api', routes);

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
const startServer = async () => {
  // Initialize database first
  await initializeDatabase();

  // Start the server
  app.listen(PORT, () => {
    console.log(`🚀 Harkley AI Server running on port ${PORT}`);
    console.log(`📊 Environment: ${env.NODE_ENV}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  });
};

startServer().catch((error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
});

export default app;
