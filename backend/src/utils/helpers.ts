import { v4 as uuidv4 } from 'uuid';
import { PaginationQuery, PaginatedResult } from '../types';

export function generateLicenseKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const segments = 4;
  const segmentLength = 5;
  return Array.from({ length: segments }, () =>
    Array.from({ length: segmentLength }, () =>
      chars[Math.floor(Math.random() * chars.length)]
    ).join('')
  ).join('-');
}

export function generateBulkLicenseKeys(count: number): string[] {
  const keys: string[] = [];
  const generated = new Set<string>();
  while (keys.length < count) {
    const key = generateLicenseKey();
    if (!generated.has(key)) {
      generated.add(key);
      keys.push(key);
    }
  }
  return keys;
}

export function generateReference(): string {
  return `TXN-${Date.now()}-${uuidv4().split('-')[0].toUpperCase()}`;
}

export function parsePagination(query: PaginationQuery): {
  page: number;
  limit: number;
  skip: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  search: string;
} {
  const page = Math.max(1, parseInt(query.page || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(query.limit || '10', 10)));
  const skip = (page - 1) * limit;
  const sortBy = query.sortBy || 'createdAt';
  const sortOrder = (query.sortOrder === 'asc' ? 'asc' : 'desc') as 'asc' | 'desc';
  const search = query.search || '';
  return { page, limit, skip, sortBy, sortOrder, search };
}

export function buildPaginatedResult<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): PaginatedResult<T> {
  const totalPages = Math.ceil(total / limit);
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

export function getClientIp(req: { headers: Record<string, string | string[] | undefined>; socket: { remoteAddress?: string } }): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const ips = Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0];
    return ips.trim();
  }
  return req.socket.remoteAddress || 'unknown';
}

export function isExpired(expiresAt: Date | null): boolean {
  if (!expiresAt) return false;
  return new Date() > new Date(expiresAt);
}

export function formatTimeRemaining(expiresAt: Date | null): string {
  if (!expiresAt) return 'Never';
  const now = new Date();
  const diff = new Date(expiresAt).getTime() - now.getTime();
  if (diff <= 0) return 'Expired';
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (days > 0) return `${days}d ${hours}h`;
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m`;
}

export function sanitizeUser(user: Record<string, unknown>): Record<string, unknown> {
  const { password, ...sanitized } = user;
  return sanitized;
}
