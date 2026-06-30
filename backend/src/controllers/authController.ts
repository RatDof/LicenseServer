import { Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { AuthenticatedRequest } from '../types';
import { getClientIp } from '../utils/helpers';

export class AuthController {
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, username, password } = req.body;
      const identifier = email || username;

      if (!identifier || !password) {
        res.status(400).json({ success: false, error: 'Email/username and password are required' });
        return;
      }

      const ip = getClientIp(req as unknown as { headers: Record<string, string | string[] | undefined>; socket: { remoteAddress?: string } });
      const userAgent = req.headers['user-agent'] || 'unknown';

      const result = await AuthService.login(identifier, password, ip, userAgent);

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: result.user,
          tokens: result.tokens,
        },
      });
    } catch (err) {
      const error = err as Error;
      res.status(401).json({ success: false, error: error.message });
    }
  }

  static async logout(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;
      const userId = req.user!.userId;
      const ip = getClientIp(req as unknown as { headers: Record<string, string | string[] | undefined>; socket: { remoteAddress?: string } });
      const userAgent = req.headers['user-agent'] || 'unknown';

      await AuthService.logout(userId, refreshToken, ip, userAgent);
      res.json({ success: true, message: 'Logged out successfully' });
    } catch (err) {
      const error = err as Error;
      res.status(400).json({ success: false, error: error.message });
    }
  }

  static async refresh(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        res.status(400).json({ success: false, error: 'Refresh token required' });
        return;
      }
      const tokens = await AuthService.refreshTokens(refreshToken);
      res.json({ success: true, data: tokens });
    } catch (err) {
      const error = err as Error;
      res.status(401).json({ success: false, error: error.message });
    }
  }

  static async profile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = await AuthService.getProfile(req.user!.userId);
      res.json({ success: true, data: user });
    } catch (err) {
      const error = err as Error;
      res.status(404).json({ success: false, error: error.message });
    }
  }
}
