import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { AnalyticsService } from '../services/analyticsService';

export class AnalyticsController {
  static async getDashboard(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const data = await AnalyticsService.getDashboardAnalytics();
      res.json({ success: true, data });
    } catch (err) {
      res.status(500).json({ success: false, error: (err as Error).message });
    }
  }

  static async getTransactionAnalytics(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const period = (req.query.period as 'week' | 'month' | 'year') || 'month';
      const data = await AnalyticsService.getTransactionAnalytics(period);
      res.json({ success: true, data });
    } catch (err) {
      res.status(500).json({ success: false, error: (err as Error).message });
    }
  }
}
