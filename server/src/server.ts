import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import http from 'http';
// import { ClerkExpressRequireAuth } from '@clerk/clerk-sdk-node'; // Temporarily disabled due to type conflicts

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = [
  'MONGODB_URI',
  'CLERK_SECRET_KEY',
  'CLERK_WEBHOOK_SECRET',
  'STRIPE_SECRET_KEY',
  'UPLOADTHING_TOKEN',
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

// Type-safe environment variables
const env = {
  PORT: process.env['PORT'] || '5000',
  MONGODB_URI: process.env['MONGODB_URI'] as string,
  FRONTEND_URL: process.env['FRONTEND_URL'] || 'http://localhost:3000',
};

// Initialize Express app
const app = express();
const PORT = env.PORT;

// Trust proxy for rate limiting (important for production and development)
app.set('trust proxy', 1);

// Module-scoped server variable
let server: http.Server | undefined;

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
  })
);

// CORS configuration
app.use(
  cors({
    origin:
      process.env['NODE_ENV'] === 'production'
        ? env.FRONTEND_URL
        : 'http://localhost:3000',
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: req => req.path === '/health' && req.method === 'GET',
});

app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Raw body middleware for webhook signature verification
app.use('/api/webhooks', express.raw({ type: 'application/json' }));

// Security logging middleware
import { logApiAccess } from './middleware/securityLogger.js';
app.use(logApiAccess);

// Health check endpoint
app.get('/health', (_req: express.Request, res: express.Response) => {
  const dbStatus =
    mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  const isHealthy = mongoose.connection.readyState === 1;

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'OK' : 'Unhealthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: dbStatus,
  });
});
// Import routes
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import dashboardRoutes from './routes/dashboard.js';
import tripsRoutes from './routes/trips.js';
import { registerUser } from './controllers/authController.js';

// API routes
app.get('/api', (_req: express.Request, res: express.Response) => {
  res.json({
    message: 'BagXtra API Server',
    version: '1.0.0',
    status: 'running',
    auth: 'Clerk authentication enabled',
  });
});

// Auth routes
app.use('/api/auth', authRoutes);

// Admin routes
app.use('/api/admin', adminRoutes);

// Dashboard routes
app.use('/api/dashboard', dashboardRoutes);

// Trips routes
app.use('/api/trips', tripsRoutes);

// Webhook routes (separate route to match Clerk docs)
app.post(
  '/api/webhooks',
  express.raw({ type: 'application/json' }),
  registerUser
);

// MongoDB connection with retry logic
const connectDB = async (retries = 3): Promise<void> => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const mongoUri = env.MONGODB_URI;
      console.log(
        `🔄 Attempting MongoDB connection (attempt ${attempt}/${retries})...`
      );

      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
        socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
        bufferCommands: false, // Disable mongoose buffering
      });

      console.log('✅ Connected to MongoDB successfully');

      // Handle connection events
      mongoose.connection.on('error', err => {
        console.error('❌ MongoDB connection error:', err);
      });

      mongoose.connection.on('disconnected', () => {
        console.log('⚠️  MongoDB disconnected');
      });

      mongoose.connection.on('reconnected', () => {
        console.log('✅ MongoDB reconnected');
      });

      return;
    } catch (error) {
      console.error(`❌ MongoDB connection attempt ${attempt} failed:`, error);

      if (attempt === retries) {
        console.error('❌ All MongoDB connection attempts failed');
        console.log(
          '⚠️  Server will continue but database operations will fail'
        );
        console.log(
          '💡 Make sure MongoDB is running and connection string is correct'
        );
        return;
      }

      // Wait before retrying
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
      console.log(`⏳ Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

// Error handling middleware
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error('Error:', err.stack);

    // Handle custom error types
    if (err.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Bad Request',
        message: err.message,
        code: 'VALIDATION_ERROR',
        field: (err as any).field,
      });
    }

    if (err.name === 'BadRequestError') {
      return res.status(400).json({
        error: 'Bad Request',
        message: err.message,
        code: 'BAD_REQUEST',
      });
    }

    if (err.name === 'NotFoundError') {
      return res.status(404).json({
        error: 'Not Found',
        message: err.message,
        code: 'NOT_FOUND',
      });
    }

    if (err.name === 'UnauthorizedError' || err.name === 'AuthRequiredError') {
      return res.status(401).json({
        error: 'Unauthorized',
        message: err.message,
        code: (err as any).code || 'UNAUTHORIZED',
      });
    }

    if (
      err.name === 'ForbiddenError' ||
      err.name === 'InsufficientPermissionsError' ||
      err.name === 'InvalidRoleError'
    ) {
      return res.status(403).json({
        error: 'Forbidden',
        message: err.message,
        code: (err as any).code || 'FORBIDDEN',
        details: (err as any).details,
      });
    }

    // Default error response
    res.status(500).json({
      error: 'Internal Server Error',
      message:
        process.env['NODE_ENV'] === 'development'
          ? err.message
          : 'Something went wrong',
      code: 'INTERNAL_ERROR',
    });
  }
);

// 404 handler
app.use((req: express.Request, res: express.Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource was not found',
  });
});

// Start server
const startServer = async (): Promise<void> => {
  try {
    await connectDB();

    server = app.listen(PORT, () => {
      console.log(`🚀 BagXtra server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(
        `🌐 Environment: ${process.env['NODE_ENV'] || 'development'}`
      );
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  if (server) {
    try {
      await new Promise<void>((resolve, reject) => {
        server!.close(err => {
          if (err) reject(err);
          else resolve();
        });
      });
      console.log('✅ Server closed successfully');
    } catch (error) {
      console.error('❌ Error closing server:', error);
    }
  }
  await mongoose.connection.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  if (server) {
    try {
      await new Promise<void>((resolve, reject) => {
        server!.close(err => {
          if (err) reject(err);
          else resolve();
        });
      });
      console.log('✅ Server closed successfully');
    } catch (error) {
      console.error('❌ Error closing server:', error);
    }
  }
  await mongoose.connection.close();
  process.exit(0);
});

startServer();
