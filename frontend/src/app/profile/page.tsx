'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Shield, DollarSign, Key, Calendar, Lock, Save } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Badge, Button, Input, Spinner } from '../../components/ui';
import { authApi, usersApi, licensesApi } from '../../lib/api';
import { formatCurrency, formatDate, timeAgo, getTimeRemaining } from '../../lib/utils';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

interface ProfileData {
  id: string; username: string; email: string; role: string; balance: number;
  isActive: boolean; lastLoginAt: string | null; createdAt: string;
  _count?: { licenses: number; transactions: number };
}
interface MyLicense {
  id: string; key: string; status: string; type: string; expiresAt: string | null;
  product: { name: string; version: string | null };
}

function ProfileContent() {
  const { refreshProfile } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [licenses, setLicenses] = useState<MyLicense[]>([]);
  const [loading, setLoading] = useState(true);
  const [passwordForm, setPasswordForm] = useState({ password: '', confirm: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, licensesRes] = await Promise.all([
          authApi.profile(),
          licensesApi.getMy(),
        ]);
        setProfile(profileRes.data.data);
        setLicenses(licensesRes.data.data);
      } catch { toast.error('Failed to load profile'); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const handlePasswordChange = async () => {
    if (!passwordForm.password || passwordForm.password.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    if (passwordForm.password !== passwordForm.confirm) { toast.error('Passwords do not match'); return; }
    if (!profile) return;
    setSaving(true);
    try {
      await usersApi.update(profile.id, { password: passwordForm.password });
      toast.success('Password updated successfully');
      setPasswordForm({ password: '', confirm: '' });
    } catch (e: unknown) { toast.error((e as { response?: { data?: { error?: string } } }).response?.data?.error || 'Failed to update password'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="flex justify-center py-24"><Spinner size="lg" /></div>;
  if (!profile) return null;

  return (
    <div className="space-y-6">
      <div><h1 className="page-title">Profile</h1><p className="page-subtitle">Manage your account settings</p></div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <motion.div className="glass-card p-6 lg:col-span-1" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-center">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-3xl mx-auto mb-4 shadow-glow-brand">
              {profile.username[0].toUpperCase()}
            </div>
            <h2 className="text-lg font-bold text-white">{profile.username}</h2>
            <p className="text-sm text-white/40 mt-0.5">{profile.email}</p>
            <div className="flex justify-center mt-3"><Badge status={profile.role} /></div>
          </div>

          <div className="mt-6 pt-6 border-t border-white/[0.08] space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/40 flex items-center gap-2"><Calendar className="w-3.5 h-3.5" />Joined</span>
              <span className="text-white">{formatDate(profile.createdAt)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/40 flex items-center gap-2"><Shield className="w-3.5 h-3.5" />Last Login</span>
              <span className="text-white">{profile.lastLoginAt ? timeAgo(profile.lastLoginAt) : 'Never'}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/40 flex items-center gap-2"><Key className="w-3.5 h-3.5" />Licenses</span>
              <span className="text-white">{profile._count?.licenses ?? 0}</span>
            </div>
          </div>

          <div className="mt-6 glass p-4 rounded-xl text-center">
            <p className="text-xs text-white/50 mb-1">Current Balance</p>
            <p className="text-2xl font-bold text-green-400">{formatCurrency(profile.balance)}</p>
          </div>
        </motion.div>

        {/* Right Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Change Password */}
          <motion.div className="glass-card p-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <h3 className="text-base font-semibold text-white mb-1 flex items-center gap-2"><Lock className="w-4 h-4 text-indigo-400" />Change Password</h3>
            <p className="text-xs text-white/40 mb-5">Update your account password</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="New Password" type="password" value={passwordForm.password} onChange={e => setPasswordForm(p => ({ ...p, password: e.target.value }))} placeholder="Min 8 characters" />
              <Input label="Confirm Password" type="password" value={passwordForm.confirm} onChange={e => setPasswordForm(p => ({ ...p, confirm: e.target.value }))} placeholder="Repeat password" />
            </div>
            <Button variant="primary" onClick={handlePasswordChange} loading={saving} className="mt-4"><Save className="w-4 h-4" />Update Password</Button>
          </motion.div>

          {/* My Licenses */}
          <motion.div className="glass-card p-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <h3 className="text-base font-semibold text-white mb-1 flex items-center gap-2"><Key className="w-4 h-4 text-indigo-400" />My Licenses</h3>
            <p className="text-xs text-white/40 mb-5">Licenses assigned to your account</p>
            <div className="space-y-3">
              {licenses.length === 0 ? (
                <p className="text-sm text-white/30 text-center py-8">No licenses assigned</p>
              ) : licenses.map((l, i) => (
                <motion.div key={l.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                  <div>
                    <p className="text-sm font-medium text-white">{l.product.name}</p>
                    <p className="text-xs font-mono text-indigo-300 mt-0.5">{l.key}</p>
                  </div>
                  <div className="text-right">
                    <Badge status={l.status} />
                    <p className="text-[10px] text-white/40 mt-1">{getTimeRemaining(l.expiresAt)}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return <DashboardLayout><ProfileContent /></DashboardLayout>;
}
