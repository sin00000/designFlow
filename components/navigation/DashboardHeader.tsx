'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { LogOut, Moon, Sun } from 'lucide-react';
import StarEyeLogo from '@/components/icons/StarEyeLogo';
import { signOut } from 'next-auth/react';
import { getInitials } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { applyTheme, type ThemeMode } from '@/components/ThemeProvider';
import { useT } from '@/lib/i18n';

interface DashboardHeaderProps {
  user: {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    username?: string | null;
  };
}

export default function DashboardHeader({ user }: DashboardHeaderProps) {
  const t = useT();
  const [menuOpen, setMenuOpen] = useState(false);
  const [themeMode, setThemeMode] = useState<ThemeMode>('light');

  useEffect(() => {
    const savedMode = (localStorage.getItem('theme-mode') || 'light') as ThemeMode;
    setThemeMode(savedMode);
  }, []);

  const handleThemeToggle = () => {
    const next: ThemeMode = themeMode === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    setThemeMode(next);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-40 backdrop-blur-xl border-b" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-default)' }}>
      <div className="max-w-2xl mx-auto px-4 h-[60px] flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <StarEyeLogo size={26} className="text-white" />
          <span className="font-bold text-white text-sm tracking-tight">DesignFlow</span>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-1">
          {/* Theme toggle */}
          <button
            onClick={handleThemeToggle}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
            title={themeMode === 'dark' ? 'Switch to light' : 'Switch to dark'}
          >
            {themeMode === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* Avatar + menu */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="w-8 h-8 rounded-xl overflow-hidden border border-white/10 hover:border-white/20 transition-colors"
            >
              {user.image ? (
                <img
                  src={user.image}
                  alt={user.name || 'User'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center text-white text-xs font-bold"
                  style={{ background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))' }}
                >
                  {getInitials(user.name)}
                </div>
              )}
            </button>

            <AnimatePresence>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -8 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-10 w-52 rounded-2xl shadow-modal z-50 overflow-hidden py-1"
                    style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-default)' }}
                  >
                    <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border-default)' }}>
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{user.name}</p>
                      <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>{user.email}</p>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          signOut({ callbackUrl: '/login' });
                        }}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 w-full transition-colors"
                      >
                        <LogOut size={15} />
                        {t.nav.signOut}
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}
