'use client';
import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Package, Plus, Edit, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Badge, Button, Input, Modal, Spinner, EmptyState } from '../../components/ui';
import { productsApi } from '../../lib/api';
import { formatCurrency, formatDate } from '../../lib/utils';
import toast from 'react-hot-toast';

interface Product { id: string; name: string; description: string | null; price: number; isActive: boolean; version: string | null; createdAt: string; _count?: { licenses: number }; }

function ProductModal({ product, open, onClose, onSuccess }: { product?: Product | null; open: boolean; onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({ name: '', description: '', price: '0', version: '' });
  const [loading, setLoading] = useState(false);
  const editing = !!product;

  useEffect(() => {
    if (product) setForm({ name: product.name, description: product.description || '', price: String(product.price), version: product.version || '' });
    else setForm({ name: '', description: '', price: '0', version: '' });
  }, [product, open]);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.name) { toast.error('Name required'); return; }
    setLoading(true);
    try {
      const data = { ...form, price: parseFloat(form.price) || 0 };
      if (editing && product) await productsApi.update(product.id, data);
      else await productsApi.create(data);
      toast.success(editing ? 'Product updated' : 'Product created');
      onSuccess(); onClose();
    } catch (e: unknown) { toast.error((e as { response?: { data?: { error?: string } } }).response?.data?.error || 'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Edit Product' : 'New Product'}>
      <div className="space-y-4">
        <Input label="Name *" value={form.name} onChange={set('name')} placeholder="Pro License" />
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-white/60 uppercase tracking-wide">Description</label>
          <textarea className="glass-input w-full px-4 py-2.5 text-sm resize-none" rows={3} value={form.description} onChange={set('description')} placeholder="Product description..." />
        </div>
        <Input label="Price ($)" type="number" min="0" step="0.01" value={form.price} onChange={set('price')} />
        <Input label="Version" value={form.version} onChange={set('version')} placeholder="1.0.0" />
        <div className="flex gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
          <Button variant="primary" onClick={handleSubmit} loading={loading} className="flex-1">{editing ? 'Update' : 'Create'}</Button>
        </div>
      </div>
    </Modal>
  );
}

function ProductsContent() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await productsApi.getAll({ limit: 50 });
      setProducts(res.data.data.data);
    } catch { toast.error('Failed to load products'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleDelete = async (p: Product) => {
    if (!confirm(`Delete "${p.name}"?`)) return;
    try { await productsApi.delete(p.id); toast.success('Deleted'); fetchProducts(); }
    catch (e: unknown) { toast.error((e as { response?: { data?: { error?: string } } }).response?.data?.error || 'Failed'); }
  };

  const handleToggle = async (p: Product) => {
    try { await productsApi.update(p.id, { isActive: !p.isActive }); toast.success(`Product ${p.isActive ? 'disabled' : 'enabled'}`); fetchProducts(); }
    catch { toast.error('Failed'); }
  };

  const openCreate = () => { setEditProduct(null); setModalOpen(true); };
  const openEdit = (p: Product) => { setEditProduct(p); setModalOpen(true); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="page-title">Products</h1><p className="page-subtitle">{products.length} products</p></div>
        <Button variant="primary" onClick={openCreate}><Plus className="w-4 h-4" />New Product</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : products.length === 0 ? (
        <EmptyState icon={Package} title="No products yet" description="Create your first product to start issuing licenses" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((p, i) => (
            <motion.div key={p.id} className="glass-card p-5" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/30 to-purple-500/20 flex items-center justify-center">
                  <Package className="w-5 h-5 text-indigo-400" />
                </div>
                <Badge status={p.isActive ? 'ACTIVE' : 'SUSPENDED'} />
              </div>
              <h3 className="text-base font-bold text-white mb-1">{p.name}</h3>
              {p.version && <span className="text-[10px] text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">v{p.version}</span>}
              <p className="text-xs text-white/50 mt-2 line-clamp-2 min-h-[2rem]">{p.description || 'No description'}</p>
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/[0.06]">
                <div>
                  <p className="text-lg font-bold text-white">{formatCurrency(p.price)}</p>
                  <p className="text-[10px] text-white/40">{p._count?.licenses ?? 0} licenses issued</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => handleToggle(p)} className="p-2 rounded-lg hover:bg-white/8 text-white/40 hover:text-white transition-colors">
                    {p.isActive ? <ToggleRight className="w-4 h-4 text-green-400" /> : <ToggleLeft className="w-4 h-4" />}
                  </button>
                  <button onClick={() => openEdit(p)} className="p-2 rounded-lg hover:bg-white/8 text-white/40 hover:text-white transition-colors"><Edit className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(p)} className="p-2 rounded-lg hover:bg-red-500/10 text-white/40 hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <ProductModal product={editProduct} open={modalOpen} onClose={() => { setModalOpen(false); setEditProduct(null); }} onSuccess={fetchProducts} />
    </div>
  );
}

export default function ProductsPage() {
  return <DashboardLayout><ProductsContent /></DashboardLayout>;
}
