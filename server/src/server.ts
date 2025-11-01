import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
// import { ClerkExpressRequireAuth } from '@clerk/clerk-sdk-node'; // Temporarily disabled due to type conflicts

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = [
  'MONGODB_URI',
  'CLERK_SECRET_KEY',
  'STRIPE_SECRET_KEY',
  'UPLOADTHING_SECRET',
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
});

app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (_req: express.Request, res: express.Response) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API routes
app.get('/api', (_req: express.Request, res: express.Response) => {
  res.json({
    message: 'BagXtra API Server',
    version: '1.0.0',
    status: 'running',
  });
});

// Protected routes example (Clerk middleware temporarily disabled due to type conflicts)
app.get('/api/protected', (_req: express.Request, res: express.Response) => {
  res.json({
    message:
      'This is a protected route (Clerk middleware temporarily disabled)',
    note: 'Clerk authentication will be implemented after resolving type conflicts',
  });
});

// MongoDB connection
const connectDB = async (): Promise<void> => {
  try {
    const mongoUri = env.MONGODB_URI;
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
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
    res.status(500).json({
      error: 'Internal Server Error',
      message:
        process.env['NODE_ENV'] === 'development'
          ? err.message
          : 'Something went wrong',
    });
  }
);

// 404 handler
app.use('*', (_req: express.Request, res: express.Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource was not found',
  });
});

// Start server
const startServer = async (): Promise<void> => {
  try {
    await connectDB();

    app.listen(PORT, () => {
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
  await mongoose.connection.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  await mongoose.connection.close();
  process.exit(0);
});

startServer();
