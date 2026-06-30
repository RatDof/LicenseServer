import prisma from '../utils/prisma';
import { AnalyticsData } from '../types';

export class AnalyticsService {
  static async getDashboardAnalytics(): Promise<AnalyticsData> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const [
      totalUsers,
      activeUsers,
      totalLicenses,
      activeLicenses,
      totalRevenueResult,
      monthlyRevenueResult,
      totalProducts,
      recentLogs,
      licenseStatuses,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.license.count(),
      prisma.license.count({ where: { status: 'ACTIVE' } }),
      prisma.transaction.aggregate({
        where: { type: { in: ['TOPUP', 'LICENSE_PURCHASE'] } },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: {
          type: { in: ['TOPUP', 'LICENSE_PURCHASE'] },
          createdAt: { gte: startOfMonth },
        },
        _sum: { amount: true },
      }),
      prisma.product.count({ where: { isActive: true } }),
      prisma.log.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { username: true } } },
      }),
      prisma.license.groupBy({
        by: ['status'],
        _count: true,
      }),
    ]);

    // Active sessions in last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const onlineUsers = await prisma.session.count({
      where: { isActive: true, updatedAt: { gte: fiveMinutesAgo } },
    });

    // Revenue chart - last 6 months
    const revenueChart = [];
    for (let i = 5; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const result = await prisma.transaction.aggregate({
        where: {
          type: { in: ['TOPUP', 'LICENSE_PURCHASE'] },
          createdAt: { gte: start, lte: end },
        },
        _sum: { amount: true },
      });
      revenueChart.push({
        month: start.toLocaleString('default', { month: 'short' }),
        revenue: result._sum.amount || 0,
      });
    }

    // User growth chart
    const userGrowth = [];
    for (let i = 5; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const count = await prisma.user.count({
        where: { createdAt: { lte: end } },
      });
      userGrowth.push({
        month: start.toLocaleString('default', { month: 'short' }),
        users: count,
      });
    }

    const recentActivity = recentLogs.map((log) => ({
      action: log.action,
      user: log.user?.username || 'System',
      time: log.createdAt.toISOString(),
      success: log.success,
    }));

    const licenseChart = licenseStatuses.map((s) => ({
      status: s.status,
      count: s._count,
    }));

    return {
      totalUsers,
      activeUsers,
      totalLicenses,
      activeLicenses,
      totalRevenue: totalRevenueResult._sum.amount || 0,
      monthlyRevenue: monthlyRevenueResult._sum.amount || 0,
      totalProducts,
      onlineUsers,
      recentActivity,
      revenueChart,
      licenseChart,
      userGrowth,
    };
  }

  static async getTransactionAnalytics(period: 'week' | 'month' | 'year' = 'month') {
    const now = new Date();
    let start: Date;
    if (period === 'week') start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    else if (period === 'month') start = new Date(now.getFullYear(), now.getMonth(), 1);
    else start = new Date(now.getFullYear(), 0, 1);

    const transactions = await prisma.transaction.findMany({
      where: { createdAt: { gte: start } },
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { username: true } } },
    });

    const summary = await prisma.transaction.groupBy({
      by: ['type'],
      where: { createdAt: { gte: start } },
      _sum: { amount: true },
      _count: true,
    });

    return { transactions, summary, period, start };
  }
}
