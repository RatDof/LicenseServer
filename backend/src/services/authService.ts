import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../utils/prisma';
import { JwtPayload, TokenPair } from '../types';
import { LogAction, Role } from '@prisma/client';
import logger from '../utils/logger';

export class AuthService {
  private static generateTokens(payload: Omit<JwtPayload, 'iat' | 'exp'>): TokenPair {
    const jwtSecret = process.env.JWT_SECRET!;
    const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET!;
    const expiresIn = process.env.JWT_EXPIRES_IN || '15m';
    const refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

    const accessToken = jwt.sign(payload, jwtSecret, { expiresIn } as jwt.SignOptions);
    const refreshToken = jwt.sign({ userId: payload.userId }, jwtRefreshSecret, {
      expiresIn: refreshExpiresIn,
    } as jwt.SignOptions);

    const expiresInMs = expiresIn.endsWith('m')
      ? parseInt(expiresIn) * 60
      : expiresIn.endsWith('h')
      ? parseInt(expiresIn) * 3600
      : 900;

    return { accessToken, refreshToken, expiresIn: expiresInMs };
  }

  static async login(
    emailOrUsername: string,
    password: string,
    ip: string,
    userAgent: string
  ): Promise<{ tokens: TokenPair; user: Record<string, unknown> }> {
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: emailOrUsername }, { username: emailOrUsername }],
      },
    });

    if (!user) {
      await prisma.log.create({
        data: {
          action: LogAction.FAILED_LOGIN,
          ip,
          userAgent,
          success: false,
          details: { identifier: emailOrUsername, reason: 'User not found' },
        },
      });
      throw new Error('Invalid credentials');
    }

    if (!user.isActive) {
      throw new Error('Account is disabled');
    }

    const passwordValid = await bcrypt.compare(password, user.password);
    if (!passwordValid) {
      await prisma.log.create({
        data: {
          userId: user.id,
          action: LogAction.FAILED_LOGIN,
          ip,
          userAgent,
          success: false,
          details: { reason: 'Wrong password' },
        },
      });
      throw new Error('Invalid credentials');
    }

    const payload: Omit<JwtPayload, 'iat' | 'exp'> = {
      userId: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    };

    const tokens = this.generateTokens(payload);

    const refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
    const refreshExpiry = new Date();
    refreshExpiry.setDate(refreshExpiry.getDate() + parseInt(refreshExpiresIn));

    await prisma.refreshToken.create({
      data: {
        token: tokens.refreshToken,
        userId: user.id,
        expiresAt: refreshExpiry,
      },
    });

    await prisma.session.create({
      data: { userId: user.id, ip, userAgent, isActive: true },
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    await prisma.log.create({
      data: {
        userId: user.id,
        action: LogAction.LOGIN,
        ip,
        userAgent,
        success: true,
      },
    });

    logger.info(`User logged in: ${user.email}`);

    const { password: _, ...userWithoutPassword } = user;
    return { tokens, user: userWithoutPassword };
  }

  static async logout(userId: string, refreshToken: string, ip: string, userAgent: string): Promise<void> {
    await prisma.refreshToken.deleteMany({ where: { userId, token: refreshToken } });
    await prisma.session.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false },
    });
    await prisma.log.create({
      data: { userId, action: LogAction.LOGOUT, ip, userAgent, success: true },
    });
  }

  static async refreshTokens(token: string): Promise<TokenPair> {
    const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET!;

    let decoded: { userId: string };
    try {
      decoded = jwt.verify(token, jwtRefreshSecret) as { userId: string };
    } catch {
      throw new Error('Invalid refresh token');
    }

    const storedToken = await prisma.refreshToken.findFirst({
      where: { token, userId: decoded.userId, expiresAt: { gt: new Date() } },
      include: { user: true },
    });

    if (!storedToken) throw new Error('Refresh token not found or expired');
    if (!storedToken.user.isActive) throw new Error('Account disabled');

    await prisma.refreshToken.delete({ where: { id: storedToken.id } });

    const payload: Omit<JwtPayload, 'iat' | 'exp'> = {
      userId: storedToken.user.id,
      email: storedToken.user.email,
      username: storedToken.user.username,
      role: storedToken.user.role,
    };

    const tokens = this.generateTokens(payload);

    const refreshExpiry = new Date();
    refreshExpiry.setDate(refreshExpiry.getDate() + 7);
    await prisma.refreshToken.create({
      data: {
        token: tokens.refreshToken,
        userId: storedToken.user.id,
        expiresAt: refreshExpiry,
      },
    });

    await prisma.log.create({
      data: {
        userId: storedToken.user.id,
        action: LogAction.TOKEN_REFRESH,
        success: true,
      },
    });

    return tokens;
  }

  static async getProfile(userId: string): Promise<Record<string, unknown>> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        _count: { select: { licenses: true, transactions: true } },
      },
    });

    if (!user) throw new Error('User not found');
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}
