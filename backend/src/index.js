import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { requireAuth } from './middleware/authMiddleware.js';
import { errorHandler } from './middleware/errorHandler.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import scanRoutes from './routes/scanRoutes.js';
import conversationRoutes from './routes/conversationRoutes.js';
import authRoutes from './routes/authRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security Headers
app.use(helmet());

// CORS Configuration (Normalizes trailing slashes to prevent mismatches)
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
];

if (process.env.FRONTEND_URL) {
  const cleanFrontendUrl = process.env.FRONTEND_URL.replace(/\/+$/, '');
  if (!allowedOrigins.includes(cleanFrontendUrl)) {
    allowedOrigins.push(cleanFrontendUrl);
  }
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow all valid incoming web origins (Vercel production, preview deployments, localhost)
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Rate Limiting for AI & Scan Endpoints
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes
  message: {
    error: 'Too many requests from this client. Please slow down and retry in 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 1. Health Check Endpoint (Public for Render & uptime checks)
app.get('/api/health', (req, res) => {
  return res.status(200).json({
    ok: true,
    service: 'sentineltrust-backend',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Public Auth helper
app.use('/api/auth', authRoutes);

// 2. Protected Routes (require Bearer JWT + Supabase profile check)
app.use('/api/dashboard', requireAuth, dashboardRoutes);
app.use('/api/scans', requireAuth, aiLimiter, scanRoutes);
app.use('/api/conversations', requireAuth, conversationRoutes);

// 3. Centralized Error Handler
app.use(errorHandler);

// Start Server
app.listen(PORT, () => {
  console.log(`[SENTINEL_TRUST_API] Running on port ${PORT}`);
  console.log(`[SENTINEL_TRUST_API] Health check available at http://localhost:${PORT}/api/health`);
});

