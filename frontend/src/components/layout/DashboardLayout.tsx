'use client';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, Key, Package, ArrowLeftRight,
  BarChart3, Settings, User, LogOut, Menu, X, Zap,
  ChevronRight, Bell, Shield
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { cn } from '../../lib/utils';
import { getAccessToken } from '../../lib/auth';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/users', icon: Users, label: 'Users' },
  { href: '/licenses', icon: Key, label: 'Licenses' },
  { href: '/products', icon: Package, label: 'Products' },
  { href: '/transactions', icon: ArrowLeftRight, label: 'Transactions' },
  { href: '/analytics', icon: BarChart3, label: 'Analytics' },
  { href: '/settings', icon: Settings, label: 'Settings' },
  { href: '/profile', icon: User, label: 'Profile' },
];

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      <aside className={cn(
        'fixed left-0 top-0 h-full w-64 z-50 flex flex-col',
        'bg-[#0d0d1a]/95 backdrop-blur-2xl border-r border-white/[0.08]',
        'transition-transform duration-300 ease-in-out',
        open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}>
        <div className="p-6 border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-glow-brand">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white">LicenseServer</h1>
              <p className="text-[10px] text-white/40 uppercase tracking-wider">Admin Panel</p>
            </div>
            <button onClick={onClose} className="ml-auto lg:hidden text-white/40 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {user && (
          <div className="px-4 py-3 mx-3 mt-4 rounded-xl bg-white/5 border border-white/[0.08]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                {user.username[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{user.username}</p>
                <p className="text-[11px] text-white/40 truncate">{user.role}</p>
              </div>
              <Shield className="w-4 h-4 text-indigo-400 flex-shrink-0" />
            </div>
          </div>
        )}

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <p className="px-4 text-[10px] text-white/30 uppercase tracking-widest font-semibold mb-3">Navigation</p>
          {navItems.map((item) => {
            const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href} onClick={onClose}>
                <motion.div
                  className={cn('sidebar-item', active && 'active')}
                  whileHover={{ x: 3 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                >
                  <item.icon className={cn('w-4 h-4', active ? 'text-indigo-400' : 'text-white/40')} />
                  <span className="flex-1">{item.label}</span>
                  {active && <ChevronRight className="w-3 h-3 text-indigo-400 opacity-60" />}
                </motion.div>
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-white/[0.08]">
          <motion.button
            onClick={logout}
            className="sidebar-item w-full text-red-400/70 hover:text-red-400 hover:bg-red-500/10"
            whileHover={{ x: 3 }}
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </motion.button>
        </div>
      </aside>
    </>
  );
}

export function TopBar({ onMenuClick }: { onMenuClick: () => void }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const currentPage = navItems.find(i => i.href === pathname)?.label
    || navItems.find(i => pathname.startsWith(i.href))?.label
    || 'Dashboard';

  return (
    <header className="h-16 border-b border-white/[0.08] flex items-center px-6 gap-4 sticky top-0 z-30 bg-[#0a0a0f]/80 backdrop-blur-xl">
      <button onClick={onMenuClick} className="lg:hidden text-white/60 hover:text-white">
        <Menu className="w-5 h-5" />
      </button>
      <div className="flex-1">
        <h2 className="text-sm font-semibold text-white">{currentPage}</h2>
      </div>
      <div className="flex items-center gap-3">
        <button className="relative w-9 h-9 rounded-xl glass flex items-center justify-center text-white/60 hover:text-white transition-colors">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-indigo-400 rounded-full" />
        </button>
        {user && (
          <Link href="/profile">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm cursor-pointer hover:opacity-90 transition-opacity">
              {user.username[0].toUpperCase()}
            </div>
          </Link>
        )}
      </div>
    </header>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user && !getAccessToken()) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          className="w-10 h-10 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <TopBar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
