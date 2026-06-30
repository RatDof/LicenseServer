import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import prisma from '../utils/prisma';
import { LogAction } from '@prisma/client';

export class SettingsController {
  static async getSettings(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const settings = await prisma.setting.findMany({ orderBy: [{ group: 'asc' }, { key: 'asc' }] });
      const grouped: Record<string, Record<string, string>> = {};
      for (const setting of settings) {
        if (!grouped[setting.group]) grouped[setting.group] = {};
        grouped[setting.group][setting.key] = setting.value;
      }
      res.json({ success: true, data: grouped });
    } catch (err) {
      res.status(500).json({ success: false, error: (err as Error).message });
    }
  }

  static async updateSettings(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const updates = req.body as Record<string, string>;
      const results = await Promise.all(
        Object.entries(updates).map(([key, value]) =>
          prisma.setting.upsert({
            where: { key },
            update: { value: String(value) },
            create: { key, value: String(value), group: 'general' },
          })
        )
      );
      await prisma.log.create({
        data: {
          userId: req.user!.userId,
          action: LogAction.SETTINGS_UPDATE,
          success: true,
          details: { keys: Object.keys(updates) },
        },
      });
      res.json({ success: true, message: 'Settings updated', data: results });
    } catch (err) {
      res.status(400).json({ success: false, error: (err as Error).message });
    }
  }

  static async getLogs(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const page = Math.max(1, parseInt(req.query.page as string || '1', 10));
      const limit = Math.min(100, parseInt(req.query.limit as string || '20', 10));
      const skip = (page - 1) * limit;

      const where: Record<string, unknown> = {};
      if (req.query.action) where.action = req.query.action;
      if (req.query.userId) where.userId = req.query.userId;
      if (req.query.success !== undefined) where.success = req.query.success === 'true';

      const [logs, total] = await Promise.all([
        prisma.log.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { id: true, username: true } } },
        }),
        prisma.log.count({ where }),
      ]);

      res.json({
        success: true,
        data: {
          data: logs,
          pagination: {
            page, limit, total,
            totalPages: Math.ceil(total / limit),
            hasNext: page < Math.ceil(total / limit),
            hasPrev: page > 1,
          },
        },
      });
    } catch (err) {
      res.status(500).json({ success: false, error: (err as Error).message });
    }
  }
}
