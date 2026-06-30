'use client';
import { motion } from 'framer-motion';
import { cn, statusBg } from '../../lib/utils';
import { LucideIcon } from 'lucide-react';

// ─── Stat Card ────────────────────────────────────────────────────────────────
interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'up' | 'down' | 'neutral';
  icon: LucideIcon;
  iconColor?: string;
  gradient?: string;
  delay?: number;
}

export function StatCard({ title, value, change, changeType = 'neutral', icon: Icon, iconColor = 'text-indigo-400', gradient = 'from-indigo-500/20 to-purple-500/10', delay = 0 }: StatCardProps) {
  return (
    <motion.div
      className="stat-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
    >
      <div className={cn('absolute inset-0 bg-gradient-to-br opacity-30 rounded-2xl pointer-events-none', gradient)} />
      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div className={cn('w-10 h-10 rounded-xl bg-white/8 flex items-center justify-center', iconColor)}>
            <Icon className="w-5 h-5" />
          </div>
          {change && (
            <span className={cn(
              'text-xs font-medium px-2 py-1 rounded-lg',
              changeType === 'up' && 'text-green-400 bg-green-500/15',
              changeType === 'down' && 'text-red-400 bg-red-500/15',
              changeType === 'neutral' && 'text-white/40 bg-white/8',
            )}>
              {change}
            </span>
          )}
        </div>
        <div>
          <AnimatedCounter value={typeof value === 'number' ? value : 0} displayValue={String(value)} />
          <p className="text-xs text-white/50 mt-1">{title}</p>
        </div>
      </div>
    </motion.div>
  );
}

function AnimatedCounter({ value, displayValue }: { value: number; displayValue: string }) {
  return (
    <motion.div
      className="text-2xl font-bold text-white"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 200 }}
    >
      {displayValue}
    </motion.div>
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────────
export function Badge({ status }: { status: string }) {
  return (
    <span className={cn('badge', statusBg(status))}>
      {status.replace('_', ' ')}
    </span>
  );
}

// ─── Loading Spinner ─────────────────────────────────────────────────────────
export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' };
  return (
    <motion.div
      className={cn('border-2 border-indigo-500/30 border-t-indigo-500 rounded-full', sizes[size])}
      animate={{ rotate: 360 }}
      transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
    />
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
export function EmptyState({ icon: Icon, title, description }: { icon: LucideIcon; title: string; description: string }) {
  return (
    <motion.div
      className="text-center py-16"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
    >
      <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
        <Icon className="w-8 h-8 text-white/20" />
      </div>
      <h3 className="text-base font-semibold text-white/60 mb-1">{title}</h3>
      <p className="text-sm text-white/30">{description}</p>
    </motion.div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        onClick={onClose}
      />
      <motion.div
        className="relative w-full max-w-lg glass-card p-6 z-10"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-white">{title}</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">✕</button>
        </div>
        {children}
      </motion.div>
    </div>
  );
}

// ─── Button ───────────────────────────────────────────────────────────────────
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export function Button({ children, variant = 'primary', size = 'md', loading, className, ...props }: ButtonProps) {
  const variants = {
    primary: 'glass-button',
    secondary: 'bg-white/8 hover:bg-white/12 text-white border border-white/10 rounded-xl font-medium transition-all',
    danger: 'bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-xl font-medium transition-all',
    ghost: 'text-white/60 hover:text-white hover:bg-white/8 rounded-xl transition-all',
  };
  const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm', lg: 'px-6 py-3 text-base' };

  return (
    <motion.button
      className={cn(variants[variant], sizes[size], 'inline-flex items-center gap-2', className)}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      disabled={loading || props.disabled}
      {...(props as object)}
    >
      {loading && <Spinner size="sm" />}
      {children}
    </motion.button>
  );
}

// ─── Input ────────────────────────────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className, ...props }: InputProps) {
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-xs font-medium text-white/60 uppercase tracking-wide">{label}</label>}
      <input
        className={cn('glass-input w-full px-4 py-2.5 text-sm', className)}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

// ─── Select ───────────────────────────────────────────────────────────────────
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
}

export function Select({ label, options, className, ...props }: SelectProps) {
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-xs font-medium text-white/60 uppercase tracking-wide">{label}</label>}
      <select
        className={cn('glass-input w-full px-4 py-2.5 text-sm bg-[#111118]', className)}
        {...props}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value} className="bg-[#111118]">{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────
interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center gap-2 justify-center mt-6">
      <Button variant="secondary" size="sm" onClick={() => onPageChange(page - 1)} disabled={page <= 1}>←</Button>
      <span className="text-sm text-white/50 px-3">{page} / {totalPages}</span>
      <Button variant="secondary" size="sm" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}>→</Button>
    </div>
  );
}
