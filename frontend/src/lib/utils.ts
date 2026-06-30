import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date, pattern = 'MMM dd, yyyy') {
  return format(new Date(date), pattern);
}

export function formatDateTime(date: string | Date) {
  return format(new Date(date), 'MMM dd, yyyy HH:mm');
}

export function timeAgo(date: string | Date) {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function formatCurrency(amount: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

export function formatNumber(num: number) {
  return new Intl.NumberFormat('en-US').format(num);
}

export function truncate(str: string, n: number) {
  return str.length > n ? str.substring(0, n) + '...' : str;
}

export function getTimeRemaining(expiresAt: string | null): string {
  if (!expiresAt) return 'Never';
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return 'Expired';
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (days > 0) return `${days}d ${hours}h`;
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m`;
}

export function statusColor(status: string): string {
  const map: Record<string, string> = {
    ACTIVE: 'text-green-400',
    SUSPENDED: 'text-yellow-400',
    EXPIRED: 'text-red-400',
    REVOKED: 'text-red-600',
    PENDING: 'text-blue-400',
    ADMIN: 'text-purple-400',
    USER: 'text-blue-400',
    RESELLER: 'text-cyan-400',
  };
  return map[status] || 'text-gray-400';
}

export function statusBg(status: string): string {
  const map: Record<string, string> = {
    ACTIVE: 'bg-green-500/20 text-green-400 border-green-500/30',
    SUSPENDED: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    EXPIRED: 'bg-red-500/20 text-red-400 border-red-500/30',
    REVOKED: 'bg-red-900/20 text-red-500 border-red-900/30',
    PENDING: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    ADMIN: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    USER: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    RESELLER: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    PERMANENT: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
    TIME_LIMITED: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    TRIAL: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  };
  return map[status] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
}
