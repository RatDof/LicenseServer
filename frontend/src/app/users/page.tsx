'use client';
import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Plus, Search, Trash2, DollarSign, MoreVertical, UserCheck, UserX } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Badge, Button, Input, Select, Modal, Spinner, EmptyState, Pagination } from '../../components/ui';
import { usersApi } from '../../lib/api';
import { formatCurrency, timeAgo } from '../../lib/utils';
import toast from 'react-hot-toast';

interface User {
  id: string; username: string; email: string; role: string;
  balance: number; isActive: boolean; lastLoginAt: string | null;
  createdAt: string; _count?: { licenses: number; transactions: number };
}
interface PaginationData { page: number; totalPages: number; total: number; }

function CreateUserModal({ open, onClose, onSuccess }: { open: boolean; onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({ username: '', email: '', password: '', role: 'USER', balance: '0' });
  const [loading, setLoading] = useState(false);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm(p => ({ ...p, [k]: e.target.value }));
  const handleSubmit = async () => {
    if (!form.username || !form.email || !form.password) { toast.error('Fill all required fields'); return; }
    setLoading(true);
    try {
      await usersApi.create({ ...form, balance: parseFloat(form.balance) });
      toast.success('User created'); onSuccess(); onClose();
      setForm({ username: '', email: '', password: '', role: 'USER', balance: '0' });
    } catch (e: unknown) { toast.error((e as { response?: { data?: { error?: string } } }).response?.data?.error || 'Failed'); }
    finally { setLoading(false); }
  };
  return (
    <Modal open={open} onClose={onClose} title="Create New User">
      <div className="space-y-4">
        <Input label="Username *" value={form.username} onChange={set('username')} placeholder="johndoe" />
        <Input label="Email *" type="email" value={form.email} onChange={set('email')} placeholder="john@example.com" />
        <Input label="Password *" type="password" value={form.password} onChange={set('password')} placeholder="••••••••" />
        <Select label="Role" value={form.role} onChange={set('role')} options={[{ value: 'USER', label: 'User' }, { value: 'RESELLER', label: 'Reseller' }, { value: 'ADMIN', label: 'Admin' }]} />
        <Input label="Initial Balance ($)" type="number" value={form.balance} onChange={set('balance')} />
        <div className="flex gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
          <Button variant="primary" onClick={handleSubmit} loading={loading} className="flex-1">Create</Button>
        </div>
      </div>
    </Modal>
  );
}

function BalanceModal({ user, open, onClose, onSuccess }: { user: User | null; open: boolean; onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({ amount: '', type: 'TOPUP', description: '' });
  const [loading, setLoading] = useState(false);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm(p => ({ ...p, [k]: e.target.value }));
  const handleSubmit = async () => {
    if (!user || !form.amount) return;
    setLoading(true);
    try {
      await usersApi.adjustBalance(user.id, { amount: parseFloat(form.amount), type: form.type, description: form.description });
      toast.success('Balance adjusted'); onSuccess(); onClose();
    } catch (e: unknown) { toast.error((e as { response?: { data?: { error?: string } } }).response?.data?.error || 'Failed'); }
    finally { setLoading(false); }
  };
  return (
    <Modal open={open} onClose={onClose} title={`Balance — ${user?.username}`}>
      <div className="space-y-4">
        <div className="glass p-4 rounded-xl text-center">
          <p className="text-xs text-white/50">Current Balance</p>
          <p className="text-2xl font-bold text-white mt-1">{formatCurrency(user?.balance ?? 0)}</p>
        </div>
        <Select label="Operation" value={form.type} onChange={set('type')} options={[{ value: 'TOPUP', label: '+ Top Up' }, { value: 'DEDUCT', label: '- Deduct' }]} />
        <Input label="Amount ($)" type="number" min="0.01" value={form.amount} onChange={set('amount')} placeholder="0.00" />
        <Input label="Description" value={form.description} onChange={set('description')} placeholder="Reason..." />
        <div className="flex gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
          <Button variant="primary" onClick={handleSubmit} loading={loading} className="flex-1">Apply</Button>
        </div>
      </div>
    </Modal>
  );
}

function UsersContent() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationData>({ page: 1, totalPages: 1, total: 0 });
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [balanceUser, setBalanceUser] = useState<User | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);

  const fetchUsers = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await usersApi.getAll({ page, limit: 10, search: search || undefined, role: roleFilter || undefined });
      setUsers(res.data.data.data);
      setPagination(res.data.data.pagination);
    } catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  }, [search, roleFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleDelete = async (u: User) => {
    if (!confirm(`Delete "${u.username}"?`)) return;
    try { await usersApi.delete(u.id); toast.success('User deleted'); fetchUsers(pagination.page); }
    catch (e: unknown) { toast.error((e as { response?: { data?: { error?: string } } }).response?.data?.error || 'Failed'); }
  };

  const handleToggle = async (u: User) => {
    try { await usersApi.update(u.id, { isActive: !u.isActive }); toast.success(`User ${u.isActive ? 'disabled' : 'enabled'}`); fetchUsers(pagination.page); }
    catch { toast.error('Failed'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="page-title">Users</h1><p className="page-subtitle">{pagination.total} total users</p></div>
        <Button variant="primary" onClick={() => setCreateOpen(true)}><Plus className="w-4 h-4" />New User</Button>
      </div>
      <div className="glass-card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input className="glass-input w-full pl-9 pr-4 py-2 text-sm" placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="glass-input px-4 py-2 text-sm bg-[#111118]" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
          <option value="">All Roles</option>
          {['ADMIN', 'RESELLER', 'USER'].map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b border-white/[0.08]">{['User', 'Role', 'Balance', 'Licenses', 'Last Login', 'Status', ''].map(h => (
              <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-white/40 uppercase tracking-wider">{h}</th>
            ))}</tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={7} className="py-16 text-center"><div className="flex justify-center"><Spinner /></div></td></tr>
                : users.length === 0 ? <tr><td colSpan={7}><EmptyState icon={Users} title="No users found" description="Try adjusting search filters" /></td></tr>
                : users.map((u, i) => (
                  <motion.tr key={u.id} className="table-row" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs">{u.username[0].toUpperCase()}</div>
                        <div><p className="text-sm font-medium text-white">{u.username}</p><p className="text-xs text-white/40">{u.email}</p></div>
                      </div>
                    </td>
                    <td className="px-4 py-3"><Badge status={u.role} /></td>
                    <td className="px-4 py-3 text-sm text-green-400 font-mono">{formatCurrency(u.balance)}</td>
                    <td className="px-4 py-3 text-sm text-white/60">{u._count?.licenses ?? 0}</td>
                    <td className="px-4 py-3 text-xs text-white/40">{u.lastLoginAt ? timeAgo(u.lastLoginAt) : 'Never'}</td>
                    <td className="px-4 py-3"><Badge status={u.isActive ? 'ACTIVE' : 'SUSPENDED'} /></td>
                    <td className="px-4 py-3">
                      <div className="relative">
                        <button className="text-white/40 hover:text-white p-1 rounded-lg hover:bg-white/8 transition-colors" onClick={() => setMenuId(menuId === u.id ? null : u.id)}><MoreVertical className="w-4 h-4" /></button>
                        <AnimatePresence>
                          {menuId === u.id && (
                            <motion.div className="absolute right-0 top-8 z-20 w-44 glass-card p-1 shadow-glass-lg" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
                              {[
                                { icon: DollarSign, label: 'Adjust Balance', fn: () => { setBalanceUser(u); setMenuId(null); }, c: 'text-green-400' },
                                { icon: u.isActive ? UserX : UserCheck, label: u.isActive ? 'Disable' : 'Enable', fn: () => { handleToggle(u); setMenuId(null); }, c: 'text-yellow-400' },
                                { icon: Trash2, label: 'Delete', fn: () => { handleDelete(u); setMenuId(null); }, c: 'text-red-400' },
                              ].map(item => (
                                <button key={item.label} onClick={item.fn} className={`flex items-center gap-2 w-full px-3 py-2 text-xs rounded-lg hover:bg-white/8 transition-colors ${item.c}`}>
                                  <item.icon className="w-3.5 h-3.5" />{item.label}
                                </button>
                              ))}
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
          <Pagination page={pagination.page} totalPages={pagination.totalPages} onPageChange={p => fetchUsers(p)} />
        </div>
      </div>
      <CreateUserModal open={createOpen} onClose={() => setCreateOpen(false)} onSuccess={() => fetchUsers()} />
      <BalanceModal user={balanceUser} open={!!balanceUser} onClose={() => setBalanceUser(null)} onSuccess={() => fetchUsers(pagination.page)} />
    </div>
  );
}

export default function UsersPage() {
  return <DashboardLayout><UsersContent /></DashboardLayout>;
}
