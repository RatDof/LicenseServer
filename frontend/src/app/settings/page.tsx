'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Save, CheckCircle, XCircle, Clock, Shield } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Button, Input, Spinner } from '../../components/ui';
import { settingsApi } from '../../lib/api';
import { formatDateTime, timeAgo } from '../../lib/utils';
import { cn } from '../../lib/utils';
import toast from 'react-hot-toast';

interface Setting { key: string; value: string; group: string; }
interface Log {
  id: string; action: string; ip: string | null; success: boolean;
  createdAt: string; user: { username: string } | null;
  details: Record<string, unknown> | null;
}

function SettingsContent() {
  const [settings, setSettings] = useState<Record<string, Record<string, string>>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logs, setLogs] = useState<Log[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [tab, setTab] = useState<'general' | 'auth' | 'license' | 'billing' | 'system' | 'logs'>('general');
  const [form, setForm] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await settingsApi.get();
        setSettings(res.data.data);
        const flat: Record<string, string> = {};
        Object.values(res.data.data).forEach(group => Object.assign(flat, group));
        setForm(flat);
      } catch { toast.error('Failed to load settings'); }
      finally { setLoading(false); }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    if (tab === 'logs') {
      setLogsLoading(true);
      settingsApi.getLogs({ limit: 30 }).then(res => setLogs(res.data.data.data)).catch(() => toast.error('Failed to load logs')).finally(() => setLogsLoading(false));
    }
  }, [tab]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await settingsApi.update(form);
      toast.success('Settings saved');
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm(p => ({ ...p, [k]: e.target.value }));

  const tabs = [
    { id: 'general', label: 'General' }, { id: 'auth', label: 'Auth' },
    { id: 'license', label: 'License' }, { id: 'billing', label: 'Billing' },
    { id: 'system', label: 'System' }, { id: 'logs', label: 'Activity Logs' },
  ] as const;

  const settingGroups: Record<string, Array<{ key: string; label: string; type?: string; options?: string[] }>> = {
    general: [
      { key: 'site_name', label: 'Site Name' },
      { key: 'site_description', label: 'Site Description' },
    ],
    auth: [
      { key: 'allow_registration', label: 'Allow Registration', type: 'select', options: ['true', 'false'] },
      { key: 'require_email_verification', label: 'Email Verification', type: 'select', options: ['true', 'false'] },
      { key: 'max_login_attempts', label: 'Max Login Attempts', type: 'number' },
      { key: 'session_timeout', label: 'Session Timeout (seconds)', type: 'number' },
    ],
    license: [
      { key: 'default_license_duration', label: 'Default Duration (days)', type: 'number' },
      { key: 'max_licenses_per_user', label: 'Max Licenses Per User', type: 'number' },
      { key: 'allow_license_transfer', label: 'Allow Transfer', type: 'select', options: ['true', 'false'] },
    ],
    billing: [
      { key: 'currency', label: 'Currency' },
      { key: 'min_topup', label: 'Minimum Top-up ($)', type: 'number' },
    ],
    system: [
      { key: 'maintenance_mode', label: 'Maintenance Mode', type: 'select', options: ['true', 'false'] },
    ],
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="page-title">Settings</h1><p className="page-subtitle">Configure platform behavior</p></div>
        {tab !== 'logs' && <Button variant="primary" onClick={handleSave} loading={saving}><Save className="w-4 h-4" />Save Changes</Button>}
      </div>

      <div className="flex gap-1 glass p-1 rounded-xl w-fit flex-wrap">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={cn('px-4 py-1.5 text-xs rounded-lg font-medium transition-all', tab === t.id ? 'bg-indigo-500 text-white' : 'text-white/50 hover:text-white')}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? <div className="flex justify-center py-16"><Spinner size="lg" /></div> : tab === 'logs' ? (
        <div className="glass-card overflow-hidden">
          {logsLoading ? <div className="flex justify-center py-16"><Spinner /></div> : (
            <div className="divide-y divide-white/[0.05]">
              {logs.map((log, i) => (
                <motion.div key={log.id} className="flex items-start gap-4 p-4 hover:bg-white/3 transition-colors" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
                  <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5', log.success ? 'bg-green-500/15' : 'bg-red-500/15')}>
                    {log.success ? <CheckCircle className="w-3.5 h-3.5 text-green-400" /> : <XCircle className="w-3.5 h-3.5 text-red-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-white">{log.action.replace(/_/g, ' ')}</span>
                      {log.user && <span className="text-xs text-indigo-400">by {log.user.username}</span>}
                      {log.ip && <span className="text-xs text-white/30 flex items-center gap-1"><Shield className="w-2.5 h-2.5" />{log.ip}</span>}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Clock className="w-2.5 h-2.5 text-white/20" />
                      <span className="text-[11px] text-white/30">{timeAgo(log.createdAt)} · {formatDateTime(log.createdAt)}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
              {logs.length === 0 && <div className="text-center py-12 text-white/30 text-sm">No logs found</div>}
            </div>
          )}
        </div>
      ) : (
        <motion.div className="glass-card p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="space-y-5 max-w-xl">
            {(settingGroups[tab] || []).map(setting => (
              <div key={setting.key}>
                {setting.type === 'select' ? (
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-white/60 uppercase tracking-wide">{setting.label}</label>
                    <select className="glass-input w-full px-4 py-2.5 text-sm bg-[#111118]" value={form[setting.key] ?? ''} onChange={set(setting.key)}>
                      {(setting.options || []).map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                ) : (
                  <Input label={setting.label} type={setting.type || 'text'} value={form[setting.key] ?? ''} onChange={set(setting.key)} />
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default function SettingsPage() {
  return <DashboardLayout><SettingsContent /></DashboardLayout>;
}
