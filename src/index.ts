import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { sendSuccess, sendError } from './utils/response';
import { env } from './config/env';
import routes from './routes';

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
app.listen(PORT, () => {
  console.log(`🚀 Harkley AI Server running on port ${PORT}`);
  console.log(`📊 Environment: ${env.NODE_ENV}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});

export default app;
