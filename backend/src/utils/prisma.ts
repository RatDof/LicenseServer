import { PrismaClient } from '@prisma/client';
import logger from './logger';

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

const prisma =
  global.__prisma ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'info', 'warn', 'error']
        : ['warn', 'error'],
  });

if (process.env.NODE_ENV !== 'production') {
  global.__prisma = prisma;
}

prisma.$connect().then(() => {
  logger.info('✅ Database connected');
}).catch((err: Error) => {
  logger.error('❌ Database connection failed:', err.message);
  process.exit(1);
});

export default prisma;
