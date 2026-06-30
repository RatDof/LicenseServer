'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users, Key, DollarSign, Package, Activity,
  TrendingUp, Wifi, WifiOff, CheckCircle, XCircle, Clock
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { StatCard, Badge, Spinner } from '../../components/ui';
import { analyticsApi } from '../../lib/api';
import { formatCurrency, formatNumber, timeAgo, cn } from '../../lib/utils';
import { useAuth } from '../../hooks/useAuth';
import { io } from 'socket.io-client';
import { getAccessToken } from '../../lib/auth';
import toast from 'react-hot-toast';

const PIE_COLORS = ['#10b981', '#f59e0b', '#ef4444', '#6366f1', '#06b6d4'];

const customTooltipStyle = {
  backgroundColor: 'rgba(13,13,26,0.95)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '12px',
  color: '#f1f5f9',
  fontSize: '12px',
};

function RealtimeDot({ online }: { online: boolean }) {
  return (
    <span className={cn('flex items-center gap-1.5 text-xs', online ? 'text-green-400' : 'text-red-400')}>
      <span className={cn('w-2 h-2 rounded-full', online ? 'bg-green-400 animate-pulse' : 'bg-red-400')} />
      {online ? 'Live' : 'Offline'}
    </span>
  );
}

function DashboardContent() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [wsConnected, setWsConnected] = useState(false);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await analyticsApi.getDashboard();
        setAnalytics(res.data.data);
      } catch {
        toast.error('Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;
    const socket = io(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:4000', {
      auth: { token },
      transports: ['websocket', 'polling'],
    });
    socket.on('connect', () => { setWsConnected(true); socket.emit('subscribe_analytics'); });
    socket.on('disconnect', () => setWsConnected(false));
    socket.on('online_users', (data: { count: number }) => setOnlineUsers(data.count));
    socket.on('analytics_update', (data: Record<string, unknown>) => {
      setAnalytics(prev => prev ? { ...prev, ...data } : data);
    });
    return () => { socket.disconnect(); };
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;
  }

  const data = analytics as Record<string, unknown> ?? {};
  const revenueChart = (data.revenueChart as unknown[]) ?? [];
  const licenseChart = (data.licenseChart as Array<{status: string; count: number}>) ?? [];
  const userGrowth = (data.userGrowth as unknown[]) ?? [];
  const recentActivity = (data.recentActivity as Array<{action: string; user: string; time: string; success: boolean}>) ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Good {new Date().getHours() < 12 ? 'morning' : 'afternoon'},{' '}
            <span className="gradient-text">{user?.username}</span> 👋
          </h1>
          <p className="text-white/50 text-sm mt-1">Here is what is happening with your platform today.</p>
        </div>
        <div className="flex items-center gap-3">
          <RealtimeDot online={wsConnected} />
          <div className="glass px-3 py-1.5 rounded-xl text-xs text-white/50">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Users" value={formatNumber(data.totalUsers as number ?? 0)} icon={Users} iconColor="text-blue-400" gradient="from-blue-500/20 to-cyan-500/10" change="+12%" changeType="up" delay={0} />
        <StatCard title="Active Licenses" value={formatNumber(data.activeLicenses as number ?? 0)} icon={Key} iconColor="text-indigo-400" gradient="from-indigo-500/20 to-purple-500/10" change="+5%" changeType="up" delay={0.1} />
        <StatCard title="Monthly Revenue" value={formatCurrency(data.monthlyRevenue as number ?? 0)} icon={DollarSign} iconColor="text-green-400" gradient="from-green-500/20 to-emerald-500/10" change="+18%" changeType="up" delay={0.2} />
        <StatCard title="Online Now" value={onlineUsers || (data.onlineUsers as number ?? 0)} icon={Activity} iconColor="text-cyan-400" gradient="from-cyan-500/20 to-blue-500/10" change="Live" changeType="neutral" delay={0.3} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <motion.div
          className="glass-card p-6 lg:col-span-2"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-semibold text-white">Revenue Overview</h3>
              <p className="text-xs text-white/40 mt-0.5">Last 6 months performance</p>
            </div>
            <span className="badge bg-green-500/20 text-green-400 border-green-500/30">
              <TrendingUp className="w-3 h-3 mr-1" /> +18%
            </span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={revenueChart}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
              <Tooltip contentStyle={customTooltipStyle} formatter={(v: number) => [`$${v.toFixed(2)}`, 'Revenue']} />
              <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} fill="url(#revenueGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* License Status Pie */}
        <motion.div
          className="glass-card p-6"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
        >
          <h3 className="text-base font-semibold text-white mb-1">License Status</h3>
          <p className="text-xs text-white/40 mb-6">Distribution by status</p>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={licenseChart} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="count" nameKey="status" paddingAngle={3}>
                {licenseChart.map((_: unknown, i: number) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={customTooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {licenseChart.map((item: {status: string; count: number}, i: number) => (
              <div key={item.status} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                  <span className="text-white/60">{item.status}</span>
                </div>
                <span className="text-white font-medium">{item.count}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* User Growth + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Growth */}
        <motion.div
          className="glass-card p-6 lg:col-span-2"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
        >
          <h3 className="text-base font-semibold text-white mb-1">User Growth</h3>
          <p className="text-xs text-white/40 mb-6">Cumulative user registrations</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={userGrowth}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={customTooltipStyle} />
              <Bar dataKey="users" fill="#06b6d4" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          className="glass-card p-6"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
        >
          <h3 className="text-base font-semibold text-white mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {recentActivity.slice(0, 6).map((activity, i) => (
              <motion.div
                key={i}
                className="flex items-start gap-3"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + i * 0.05 }}
              >
                <div className={cn(
                  'w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5',
                  activity.success ? 'bg-green-500/20' : 'bg-red-500/20'
                )}>
                  {activity.success
                    ? <CheckCircle className="w-3 h-3 text-green-400" />
                    : <XCircle className="w-3 h-3 text-red-400" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white/80 truncate">{activity.action.replace('_', ' ')}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-[10px] text-indigo-400">{activity.user}</span>
                    <span className="text-[10px] text-white/30">·</span>
                    <span className="text-[10px] text-white/30 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      {timeAgo(activity.time)}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
            {recentActivity.length === 0 && (
              <p className="text-xs text-white/30 text-center py-4">No recent activity</p>
            )}
          </div>
        </motion.div>
      </div>

      {/* System Status */}
      <motion.div
        className="glass-card p-6"
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
      >
        <h3 className="text-base font-semibold text-white mb-4">System Status</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'API Server', status: 'Operational', color: 'green', icon: CheckCircle },
            { label: 'Database', status: 'Operational', color: 'green', icon: CheckCircle },
            { label: 'WebSocket', status: wsConnected ? 'Connected' : 'Disconnected', color: wsConnected ? 'green' : 'red', icon: wsConnected ? Wifi : WifiOff },
            { label: 'License Engine', status: 'Operational', color: 'green', icon: CheckCircle },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
              <item.icon className={cn('w-4 h-4', item.color === 'green' ? 'text-green-400' : 'text-red-400')} />
              <div>
                <p className="text-xs font-medium text-white">{item.label}</p>
                <p className={cn('text-[10px]', item.color === 'green' ? 'text-green-400' : 'text-red-400')}>{item.status}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <DashboardContent />
    </DashboardLayout>
  );
}
