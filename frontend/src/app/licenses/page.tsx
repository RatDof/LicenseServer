'use client';
import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Key, Plus, Search, Trash2, Pause, Play, MoreVertical, Copy, Layers } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Badge, Button, Input, Select, Modal, Spinner, EmptyState, Pagination } from '../../components/ui';
import { licensesApi, productsApi } from '../../lib/api';
import { formatDate, getTimeRemaining } from '../../lib/utils';
import toast from 'react-hot-toast';

interface License {
  id: string; key: string; status: string; type: string;
  expiresAt: string | null; maxDevices: number; createdAt: string;
  user: { id: string; username: string; email: string } | null;
  product: { id: string; name: string; price: number };
  note: string | null;
}
interface Product { id: string; name: string; price: number; }
interface PaginationData { page: number; totalPages: number; total: number; }

function CreateLicenseModal({ open, onClose, onSuccess }: { open: boolean; onClose: () => void; onSuccess: () => void }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState({ productId: '', type: 'TIME_LIMITED', expiresAt: '', maxDevices: '1', note: '' });
  const [loading, setLoading] = useState(false);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm(p => ({ ...p, [k]: e.target.value }));

  useEffect(() => {
    if (open) productsApi.getAll({ limit: 100 }).then(r => setProducts(r.data.data.data)).catch(() => {});
  }, [open]);

  const handleSubmit = async () => {
    if (!form.productId || !form.type) { toast.error('Product and type required'); return; }
    setLoading(true);
    try {
      await licensesApi.create({ ...form, maxDevices: parseInt(form.maxDevices), expiresAt: form.expiresAt || undefined });
      toast.success('License created'); onSuccess(); onClose();
    } catch (e: unknown) { toast.error((e as { response?: { data?: { error?: string } } }).response?.data?.error || 'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title="Create License">
      <div className="space-y-4">
        <Select label="Product *" value={form.productId} onChange={set('productId')} options={[{ value: '', label: 'Select product...' }, ...products.map(p => ({ value: p.id, label: p.name }))]} />
        <Select label="Type *" value={form.type} onChange={set('type')} options={[{ value: 'TIME_LIMITED', label: 'Time Limited' }, { value: 'PERMANENT', label: 'Permanent' }, { value: 'TRIAL', label: 'Trial' }]} />
        {form.type !== 'PERMANENT' && <Input label="Expires At" type="datetime-local" value={form.expiresAt} onChange={set('expiresAt')} />}
        <Input label="Max Devices" type="number" min="1" value={form.maxDevices} onChange={set('maxDevices')} />
        <Input label="Note (optional)" value={form.note} onChange={set('note')} placeholder="Internal note..." />
        <div className="flex gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
          <Button variant="primary" onClick={handleSubmit} loading={loading} className="flex-1">Create</Button>
        </div>
      </div>
    </Modal>
  );
}

function BulkCreateModal({ open, onClose, onSuccess }: { open: boolean; onClose: () => void; onSuccess: () => void }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState({ productId: '', type: 'TIME_LIMITED', count: '10', expiresAt: '', maxDevices: '1' });
  const [loading, setLoading] = useState(false);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm(p => ({ ...p, [k]: e.target.value }));

  useEffect(() => {
    if (open) productsApi.getAll({ limit: 100 }).then(r => setProducts(r.data.data.data)).catch(() => {});
  }, [open]);

  const handleSubmit = async () => {
    if (!form.productId || !form.count) { toast.error('Required fields missing'); return; }
    setLoading(true);
    try {
      const res = await licensesApi.bulkCreate({ ...form, count: parseInt(form.count), maxDevices: parseInt(form.maxDevices), expiresAt: form.expiresAt || undefined });
      toast.success(`${res.data.data.length} licenses created`); onSuccess(); onClose();
    } catch (e: unknown) { toast.error((e as { response?: { data?: { error?: string } } }).response?.data?.error || 'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title="Bulk Generate Licenses">
      <div className="space-y-4">
        <Select label="Product *" value={form.productId} onChange={set('productId')} options={[{ value: '', label: 'Select product...' }, ...products.map(p => ({ value: p.id, label: p.name }))]} />
        <Select label="Type *" value={form.type} onChange={set('type')} options={[{ value: 'TIME_LIMITED', label: 'Time Limited' }, { value: 'PERMANENT', label: 'Permanent' }, { value: 'TRIAL', label: 'Trial' }]} />
        <Input label="Count (max 500)" type="number" min="1" max="500" value={form.count} onChange={set('count')} />
        {form.type !== 'PERMANENT' && <Input label="Expires At" type="datetime-local" value={form.expiresAt} onChange={set('expiresAt')} />}
        <Input label="Max Devices" type="number" min="1" value={form.maxDevices} onChange={set('maxDevices')} />
        <div className="flex gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
          <Button variant="primary" onClick={handleSubmit} loading={loading} className="flex-1">
            <Layers className="w-4 h-4" /> Generate {form.count} Keys
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function LicensesContent() {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationData>({ page: 1, totalPages: 1, total: 0 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [menuId, setMenuId] = useState<string | null>(null);

  const fetchLicenses = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await licensesApi.getAll({ page, limit: 10, search: search || undefined, status: statusFilter || undefined, type: typeFilter || undefined });
      setLicenses(res.data.data.data);
      setPagination(res.data.data.pagination);
    } catch { toast.error('Failed to load licenses'); }
    finally { setLoading(false); }
  }, [search, statusFilter, typeFilter]);

  useEffect(() => { fetchLicenses(); }, [fetchLicenses]);

  const handleDelete = async (l: License) => {
    if (!confirm(`Delete license ${l.key}?`)) return;
    try { await licensesApi.delete(l.id); toast.success('Deleted'); fetchLicenses(pagination.page); }
    catch (e: unknown) { toast.error((e as { response?: { data?: { error?: string } } }).response?.data?.error || 'Failed'); }
  };

  const handleSuspend = async (l: License) => {
    try { await licensesApi.suspend(l.id); toast.success('Suspended'); fetchLicenses(pagination.page); }
    catch { toast.error('Failed'); }
  };

  const handleResume = async (l: License) => {
    try { await licensesApi.resume(l.id); toast.success('Resumed'); fetchLicenses(pagination.page); }
    catch { toast.error('Failed'); }
  };

  const copyKey = (key: string) => { navigator.clipboard.writeText(key); toast.success('Copied!'); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="page-title">Licenses</h1><p className="page-subtitle">{pagination.total} total licenses</p></div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setBulkOpen(true)}><Layers className="w-4 h-4" />Bulk Generate</Button>
          <Button variant="primary" onClick={() => setCreateOpen(true)}><Plus className="w-4 h-4" />New License</Button>
        </div>
      </div>

      <div className="glass-card p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input className="glass-input w-full pl-9 pr-4 py-2 text-sm" placeholder="Search key..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="glass-input px-4 py-2 text-sm bg-[#111118]" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          {['ACTIVE', 'SUSPENDED', 'EXPIRED', 'REVOKED'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className="glass-input px-4 py-2 text-sm bg-[#111118]" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          <option value="">All Types</option>
          {['PERMANENT', 'TIME_LIMITED', 'TRIAL'].map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
        </select>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b border-white/[0.08]">{['License Key', 'Product', 'User', 'Type', 'Expires', 'Status', ''].map(h => (
              <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-white/40 uppercase tracking-wider">{h}</th>
            ))}</tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={7} className="py-16 text-center"><div className="flex justify-center"><Spinner /></div></td></tr>
                : licenses.length === 0 ? <tr><td colSpan={7}><EmptyState icon={Key} title="No licenses found" description="Create your first license" /></td></tr>
                : licenses.map((l, i) => (
                  <motion.tr key={l.id} className="table-row" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-indigo-300 bg-indigo-500/10 px-2 py-1 rounded-lg">{l.key}</span>
                        <button onClick={() => copyKey(l.key)} className="text-white/30 hover:text-white/70"><Copy className="w-3 h-3" /></button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-white">{l.product.name}</td>
                    <td className="px-4 py-3 text-xs text-white/60">{l.user?.username ?? <span className="text-white/20">Unassigned</span>}</td>
                    <td className="px-4 py-3"><Badge status={l.type} /></td>
                    <td className="px-4 py-3 text-xs">
                      {l.expiresAt ? (
                        <div>
                          <p className="text-white/70">{formatDate(l.expiresAt)}</p>
                          <p className="text-white/40">{getTimeRemaining(l.expiresAt)}</p>
                        </div>
                      ) : <span className="text-indigo-400">Never</span>}
                    </td>
                    <td className="px-4 py-3"><Badge status={l.status} /></td>
                    <td className="px-4 py-3">
                      <div className="relative">
                        <button className="text-white/40 hover:text-white p-1 rounded-lg hover:bg-white/8 transition-colors" onClick={() => setMenuId(menuId === l.id ? null : l.id)}><MoreVertical className="w-4 h-4" /></button>
                        <AnimatePresence>
                          {menuId === l.id && (
                            <motion.div className="absolute right-0 top-8 z-20 w-40 glass-card p-1 shadow-glass-lg" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
                              {l.status === 'ACTIVE'
                                ? <button onClick={() => { handleSuspend(l); setMenuId(null); }} className="flex items-center gap-2 w-full px-3 py-2 text-xs rounded-lg hover:bg-white/8 text-yellow-400"><Pause className="w-3.5 h-3.5" />Suspend</button>
                                : <button onClick={() => { handleResume(l); setMenuId(null); }} className="flex items-center gap-2 w-full px-3 py-2 text-xs rounded-lg hover:bg-white/8 text-green-400"><Play className="w-3.5 h-3.5" />Resume</button>
                              }
                              <button onClick={() => { handleDelete(l); setMenuId(null); }} className="flex items-center gap-2 w-full px-3 py-2 text-xs rounded-lg hover:bg-white/8 text-red-400"><Trash2 className="w-3.5 h-3.5" />Delete</button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </td>
                  </motion.tr>
                ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-white/[0.08]">
          <Pagination page={pagination.page} totalPages={pagination.totalPages} onPageChange={p => fetchLicenses(p)} />
        </div>
      </div>
      <CreateLicenseModal open={createOpen} onClose={() => setCreateOpen(false)} onSuccess={() => fetchLicenses()} />
      <BulkCreateModal open={bulkOpen} onClose={() => setBulkOpen(false)} onSuccess={() => fetchLicenses()} />
    </div>
  );
}

export default function LicensesPage() {
  return <DashboardLayout><LicensesContent /></DashboardLayout>;
}
