import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { globalRateLimiter } from './middleware/rateLimiter';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import routes from './routes';
import logger from './utils/logger';

const app = express();

app.set('trust proxy', 1);
// Security
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000').split(',');
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Middleware
app.use(compression());
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', {
    stream: { write: (message: string) => logger.info(message.trim()) },
  }));
}

// Rate Limiting
app.use(globalRateLimiter);

// Routes
app.use('/api/v1', routes);

// Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
