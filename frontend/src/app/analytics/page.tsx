'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Users, Key, Package, BarChart3 } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { StatCard, Spinner } from '../../components/ui';
import { analyticsApi } from '../../lib/api';
import { formatCurrency, formatNumber } from '../../lib/utils';
import toast from 'react-hot-toast';

const TOOLTIP_STYLE = { backgroundColor: 'rgba(13,13,26,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#f1f5f9', fontSize: '12px' };
const COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#a855f7'];

function AnalyticsContent() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [txData, setTxData] = useState<{ summary: Array<{ type: string; _sum: { amount: number }; _count: number }> } | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [analytics, tx] = await Promise.all([
          analyticsApi.getDashboard(),
          analyticsApi.getTransactions(period),
        ]);
        setData(analytics.data.data);
        setTxData(tx.data.data);
      } catch { toast.error('Failed to load analytics'); }
      finally { setLoading(false); }
    };
    fetchAll();
  }, [period]);

  if (loading) return <div className="flex justify-center py-24"><Spinner size="lg" /></div>;
  if (!data) return null;

  const d = data as Record<string, unknown>;
  const revenueChart = (d.revenueChart as unknown[]) ?? [];
  const licenseChart = (d.licenseChart as Array<{ status: string; count: number }>) ?? [];
  const userGrowth = (d.userGrowth as unknown[]) ?? [];
  const txSummary = txData?.summary ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="page-title">Analytics</h1><p className="page-subtitle">Platform performance insights</p></div>
        <div className="flex gap-1 glass p-1 rounded-xl">
          {(['week', 'month', 'year'] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-4 py-1.5 text-xs rounded-lg font-medium transition-all ${period === p ? 'bg-indigo-500 text-white' : 'text-white/50 hover:text-white'}`}>
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Users" value={formatNumber(d.totalUsers as number ?? 0)} icon={Users} iconColor="text-blue-400" gradient="from-blue-500/20 to-cyan-500/10" delay={0} />
        <StatCard title="Total Licenses" value={formatNumber(d.totalLicenses as number ?? 0)} icon={Key} iconColor="text-indigo-400" gradient="from-indigo-500/20 to-purple-500/10" delay={0.1} />
        <StatCard title="Total Revenue" value={formatCurrency(d.totalRevenue as number ?? 0)} icon={DollarSign} iconColor="text-green-400" gradient="from-green-500/20 to-emerald-500/10" delay={0.2} />
        <StatCard title="Active Products" value={d.totalProducts as number ?? 0} icon={Package} iconColor="text-purple-400" gradient="from-purple-500/20 to-pink-500/10" delay={0.3} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div className="glass-card p-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <h3 className="text-base font-semibold text-white mb-1">Revenue Trend</h3>
          <p className="text-xs text-white/40 mb-5">Monthly revenue performance</p>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={revenueChart}>
              <defs>
                <linearGradient id="ag1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [formatCurrency(v), 'Revenue']} />
              <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} fill="url(#ag1)" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div className="glass-card p-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <h3 className="text-base font-semibold text-white mb-1">User Growth</h3>
          <p className="text-xs text-white/40 mb-5">Cumulative registered users</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={userGrowth}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Line type="monotone" dataKey="users" stroke="#06b6d4" strokeWidth={2} dot={{ fill: '#06b6d4', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div className="glass-card p-6 lg:col-span-2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <h3 className="text-base font-semibold text-white mb-1">Transaction Summary</h3>
          <p className="text-xs text-white/40 mb-5">Volume by type ({period})</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={txSummary.map(s => ({ type: s.type.replace('_', ' '), amount: s._sum?.amount || 0, count: s._count }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="type" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number, n: string) => [n === 'amount' ? formatCurrency(v) : v, n === 'amount' ? 'Volume' : 'Count']} />
              <Bar dataKey="amount" fill="#6366f1" radius={[4, 4, 0, 0]} name="amount" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div className="glass-card p-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
          <h3 className="text-base font-semibold text-white mb-1">License Distribution</h3>
          <p className="text-xs text-white/40 mb-4">By current status</p>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={licenseChart} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="count" nameKey="status" paddingAngle={3}>
                {licenseChart.map((_: unknown, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      <motion.div className="glass-card p-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
        <h3 className="text-base font-semibold text-white mb-4">Key Metrics</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'License Activation Rate', value: `${d.activeLicenses as number ?? 0}/${d.totalLicenses as number ?? 0}`, icon: TrendingUp, color: 'text-green-400' },
            { label: 'Avg Revenue/User', value: formatCurrency((d.totalRevenue as number ?? 0) / Math.max(d.totalUsers as number ?? 1, 1)), icon: DollarSign, color: 'text-indigo-400' },
            { label: 'Active Users', value: `${d.activeUsers as number ?? 0}/${d.totalUsers as number ?? 0}`, icon: Users, color: 'text-cyan-400' },
            { label: 'Monthly Revenue', value: formatCurrency(d.monthlyRevenue as number ?? 0), icon: TrendingDown, color: 'text-purple-400' },
          ].map((m, i) => (
            <div key={i} className="p-4 rounded-xl bg-white/5">
              <m.icon className={`w-5 h-5 mb-3 ${m.color}`} />
              <p className="text-sm font-bold text-white">{m.value}</p>
              <p className="text-[11px] text-white/40 mt-1">{m.label}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

export default function AnalyticsPage() {
  return <DashboardLayout><AnalyticsContent /></DashboardLayout>;
}
