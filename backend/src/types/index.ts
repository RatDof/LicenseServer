import { Request } from 'express';
import { Role } from '@prisma/client';

export interface JwtPayload {
  userId: string;
  email: string;
  username: string;
  role: Role;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

export interface PaginationQuery {
  page?: string;
  limit?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  errors?: Record<string, string>;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AnalyticsData {
  totalUsers: number;
  activeUsers: number;
  totalLicenses: number;
  activeLicenses: number;
  totalRevenue: number;
  monthlyRevenue: number;
  totalProducts: number;
  onlineUsers: number;
  recentActivity: Array<{
    action: string;
    user: string;
    time: string;
    success: boolean;
  }>;
  revenueChart: Array<{ month: string; revenue: number }>;
  licenseChart: Array<{ status: string; count: number }>;
  userGrowth: Array<{ month: string; users: number }>;
}
