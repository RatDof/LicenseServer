import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import prisma from '../utils/prisma';
import { parsePagination, buildPaginatedResult } from '../utils/helpers';
import { Role } from '@prisma/client';

export class TransactionController {
  static async getTransactions(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { page, limit, skip, sortBy, sortOrder } = parsePagination(req.query);

      const where: Record<string, unknown> = {};
      // Non-admins can only see their own transactions
      if (req.user!.role !== Role.ADMIN) {
        where.userId = req.user!.userId;
      } else if (req.query.userId) {
        where.userId = req.query.userId;
      }
      if (req.query.type) where.type = req.query.type;

      const [transactions, total] = await Promise.all([
        prisma.transaction.findMany({
          where,
          skip,
          take: limit,
          orderBy: { [sortBy]: sortOrder },
          include: {
            user: { select: { id: true, username: true, email: true } },
            sender: { select: { id: true, username: true } },
          },
        }),
        prisma.transaction.count({ where }),
      ]);

      res.json({ success: true, data: buildPaginatedResult(transactions as unknown as Record<string, unknown>[], total, page, limit) });
    } catch (err) {
      res.status(500).json({ success: false, error: (err as Error).message });
    }
  }

  static async getTransactionById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const transaction = await prisma.transaction.findUnique({
        where: { id: req.params.id },
        include: {
          user: { select: { id: true, username: true, email: true } },
          sender: { select: { id: true, username: true } },
        },
      });
      if (!transaction) { res.status(404).json({ success: false, error: 'Transaction not found' }); return; }
      if (req.user!.role !== Role.ADMIN && transaction.userId !== req.user!.userId) {
        res.status(403).json({ success: false, error: 'Access denied' }); return;
      }
      res.json({ success: true, data: transaction });
    } catch (err) {
      res.status(500).json({ success: false, error: (err as Error).message });
    }
  }
}
