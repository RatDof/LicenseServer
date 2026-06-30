'use client';
import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeftRight, ArrowUpRight, ArrowDownLeft, TrendingUp } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Badge, Spinner, EmptyState, Pagination } from '../../components/ui';
import { transactionsApi } from '../../lib/api';
import { formatCurrency, formatDateTime } from '../../lib/utils';
import { cn } from '../../lib/utils';
import toast from 'react-hot-toast';

interface Transaction {
  id: string; type: string; amount: number; balanceBefore: number;
  balanceAfter: number; description: string | null; reference: string | null;
  createdAt: string;
  user: { id: string; username: string; email: string };
  sender: { id: string; username: string } | null;
}
interface PaginationData { page: number; totalPages: number; total: number; }

const TX_ICONS: Record<string, typeof ArrowUpRight> = {
  TOPUP: ArrowUpRight, DEDUCT: ArrowDownLeft, TRANSFER_IN: ArrowUpRight,
  TRANSFER_OUT: ArrowDownLeft, LICENSE_PURCHASE: TrendingUp, REFUND: ArrowUpRight,
};

const TX_COLORS: Record<string, string> = {
  TOPUP: 'text-green-400 bg-green-500/15', DEDUCT: 'text-red-400 bg-red-500/15',
  TRANSFER_IN: 'text-cyan-400 bg-cyan-500/15', TRANSFER_OUT: 'text-orange-400 bg-orange-500/15',
  LICENSE_PURCHASE: 'text-indigo-400 bg-indigo-500/15', REFUND: 'text-green-400 bg-green-500/15',
};

function TransactionsContent() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationData>({ page: 1, totalPages: 1, total: 0 });
  const [typeFilter, setTypeFilter] = useState('');

  const fetchTx = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await transactionsApi.getAll({ page, limit: 15, type: typeFilter || undefined });
      setTransactions(res.data.data.data);
      setPagination(res.data.data.pagination);
    } catch { toast.error('Failed to load transactions'); }
    finally { setLoading(false); }
  }, [typeFilter]);

  useEffect(() => { fetchTx(); }, [fetchTx]);

  const totalIn = transactions.reduce((s, t) => ['TOPUP', 'TRANSFER_IN', 'REFUND'].includes(t.type) ? s + t.amount : s, 0);
  const totalOut = transactions.reduce((s, t) => ['DEDUCT', 'TRANSFER_OUT', 'LICENSE_PURCHASE'].includes(t.type) ? s + t.amount : s, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Transactions</h1>
        <p className="page-subtitle">{pagination.total} total transactions</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total In', value: totalIn, icon: ArrowUpRight, color: 'text-green-400', bg: 'from-green-500/20 to-emerald-500/10' },
          { label: 'Total Out', value: totalOut, icon: ArrowDownLeft, color: 'text-red-400', bg: 'from-red-500/20 to-rose-500/10' },
          { label: 'Net', value: totalIn - totalOut, icon: TrendingUp, color: 'text-indigo-400', bg: 'from-indigo-500/20 to-purple-500/10' },
        ].map((card, i) => (
          <motion.div key={card.label} className="glass-card p-5 relative overflow-hidden" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <div className={cn('absolute inset-0 bg-gradient-to-br opacity-20 pointer-events-none', card.bg)} />
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-xs text-white/50">{card.label}</p>
                <p className={cn('text-xl font-bold mt-1', card.color)}>{formatCurrency(card.value)}</p>
              </div>
              <card.icon className={cn('w-8 h-8 opacity-30', card.color)} />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="glass-card p-4">
        <select className="glass-input px-4 py-2 text-sm bg-[#111118] w-48" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          <option value="">All Types</option>
          {['TOPUP', 'DEDUCT', 'TRANSFER_IN', 'TRANSFER_OUT', 'LICENSE_PURCHASE', 'REFUND'].map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
        </select>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b border-white/[0.08]">
              {['Type', 'User', 'Amount', 'Balance Before', 'Balance After', 'Description', 'Reference', 'Date'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-white/40 uppercase tracking-wider">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={8} className="py-16 text-center"><div className="flex justify-center"><Spinner /></div></td></tr>
                : transactions.length === 0 ? <tr><td colSpan={8}><EmptyState icon={ArrowLeftRight} title="No transactions" description="Transactions will appear here" /></td></tr>
                : transactions.map((t, i) => {
                  const Icon = TX_ICONS[t.type] || ArrowLeftRight;
                  const colorClass = TX_COLORS[t.type] || 'text-white/60 bg-white/10';
                  return (
                    <motion.tr key={t.id} className="table-row" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
                      <td className="px-4 py-3">
                        <div className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium', colorClass)}>
                          <Icon className="w-3 h-3" />
                          {t.type.replace('_', ' ')}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-white/70">{t.user.username}</td>
                      <td className="px-4 py-3">
                        <span className={cn('text-sm font-mono font-semibold', ['TOPUP','TRANSFER_IN','REFUND'].includes(t.type) ? 'text-green-400' : 'text-red-400')}>
                          {['TOPUP','TRANSFER_IN','REFUND'].includes(t.type) ? '+' : '-'}{formatCurrency(t.amount)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-white/50 font-mono">{formatCurrency(t.balanceBefore)}</td>
                      <td className="px-4 py-3 text-xs text-white/70 font-mono">{formatCurrency(t.balanceAfter)}</td>
                      <td className="px-4 py-3 text-xs text-white/50 max-w-[150px] truncate">{t.description || '—'}</td>
                      <td className="px-4 py-3 text-[10px] text-white/30 font-mono">{t.reference?.slice(0, 16) || '—'}</td>
                      <td className="px-4 py-3 text-xs text-white/40">{formatDateTime(t.createdAt)}</td>
                    </motion.tr>
                  );
                })}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-white/[0.08]">
          <Pagination page={pagination.page} totalPages={pagination.totalPages} onPageChange={p => fetchTx(p)} />
        </div>
      </div>
    </div>
  );
}

export default function TransactionsPage() {
  return <DashboardLayout><TransactionsContent /></DashboardLayout>;
}
