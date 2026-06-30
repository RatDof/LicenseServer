import 'dotenv/config';
import http from 'http';
import { Server as SocketServer } from 'socket.io';
import app from './app';
import logger from './utils/logger';
import prisma from './utils/prisma';
import jwt from 'jsonwebtoken';
import { JwtPayload } from './types';

const PORT = parseInt(process.env.PORT || '4000', 10);

const httpServer = http.createServer(app);

const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000').split(',');

const io = new SocketServer(httpServer, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

// Online users tracking
const onlineUsers = new Map<string, { socketId: string; userId: string; username: string; role: string }>();

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    next(new Error('Authentication required'));
    return;
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    socket.data.user = payload;
    next();
  } catch {
    next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  const user = socket.data.user as JwtPayload;
  logger.info(`Socket connected: ${user.username} (${socket.id})`);

  onlineUsers.set(socket.id, {
    socketId: socket.id,
    userId: user.userId,
    username: user.username,
    role: user.role,
  });

  // Broadcast online users count
  io.emit('online_users', { count: onlineUsers.size, users: Array.from(onlineUsers.values()) });

  socket.on('subscribe_analytics', () => {
    if (user.role === 'ADMIN') {
      socket.join('analytics');
    }
  });

  socket.on('disconnect', () => {
    logger.info(`Socket disconnected: ${user.username}`);
    onlineUsers.delete(socket.id);
    io.emit('online_users', { count: onlineUsers.size, users: Array.from(onlineUsers.values()) });
  });
});

// Broadcast analytics every 30 seconds to admin room
const broadcastAnalytics = async () => {
  if (io.sockets.adapter.rooms.has('analytics')) {
    try {
      const [totalUsers, totalLicenses, activeLicenses] = await Promise.all([
        prisma.user.count(),
        prisma.license.count(),
        prisma.license.count({ where: { status: 'ACTIVE' } }),
      ]);
      io.to('analytics').emit('analytics_update', {
        totalUsers,
        totalLicenses,
        activeLicenses,
        onlineUsers: onlineUsers.size,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      logger.error('Analytics broadcast error:', err);
    }
  }
};

setInterval(broadcastAnalytics, 30000);

// Make io available to routes via app
app.set('io', io);

httpServer.listen(PORT, () => {
  logger.info(`🚀 LicenseServer API running on http://localhost:${PORT}`);
  logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🔌 WebSocket server ready`);
});

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  await prisma.$disconnect();
  httpServer.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection:', reason);
});

export { io };
