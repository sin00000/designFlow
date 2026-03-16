'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Bell, LogOut, User, Settings, Palette, MessageCircle, Star, Moon, Sun } from 'lucide-react';
import StarEyeLogo from '@/components/icons/StarEyeLogo';
import { signOut } from 'next-auth/react';
import { getInitials, formatRelativeDate } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { BG_FAMILIES, BG_BRIGHTNESS_LEVELS, BG_LIGHT_BRIGHTNESS_LEVELS, hslToHex, applyBackground, type ThemeMode } from '@/components/ThemeProvider';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

interface DashboardHeaderProps {
  user: {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    username?: string | null;
  };
}

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  link?: string | null;
  isRead: boolean;
  createdAt: string;
}

export default function DashboardHeader({ user }: DashboardHeaderProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [menuOpen, setMenuOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [bgFamily, setBgFamily] = useState('neutral');
  const [bgBrightness, setBgBrightness] = useState(3);
  const [themeMode, setThemeMode] = useState<ThemeMode>('dark');

  useEffect(() => {
    const savedFamily = localStorage.getItem('bg-family');
    const savedBrightness = parseInt(localStorage.getItem('bg-brightness') || '3', 10);
    const savedMode = (localStorage.getItem('bg-mode') || 'dark') as ThemeMode;
    if (savedFamily) setBgFamily(savedFamily);
    if (savedBrightness) setBgBrightness(savedBrightness);
    setThemeMode(savedMode);
  }, []);

  const { data: notifData } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => fetch('/api/notifications').then((r) => r.json()),
    refetchInterval: 30000,
  });

  const notifications: Notification[] = notifData?.data || [];
  const unreadCount: number = notifData?.unread || 0;

  const handleNotifOpen = async () => {
    const opening = !notifOpen;
    setNotifOpen(opening);
    setMenuOpen(false);
    setThemeOpen(false);
    if (opening && unreadCount > 0) {
      await fetch('/api/notifications', { method: 'PATCH' });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  };

  const handleBgChange = (familyId: string, brightness: number, mode?: ThemeMode) => {
    const newMode = mode ?? themeMode;
    applyBackground(familyId, brightness, newMode);
    setBgFamily(familyId);
    setBgBrightness(brightness);
    if (mode) setThemeMode(mode);
  };

  const brightnessLevels = themeMode === 'light' ? BG_LIGHT_BRIGHTNESS_LEVELS : BG_BRIGHTNESS_LEVELS;

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
          {/* Theme button */}
          <div className="relative">
            <button
              onClick={() => { setThemeOpen(!themeOpen); setMenuOpen(false); setNotifOpen(false); }}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
              title="Customize theme"
            >
              <Palette size={16} />
            </button>

            <AnimatePresence>
              {themeOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setThemeOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -8 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-10 w-60 rounded-2xl shadow-modal z-50 overflow-hidden"
                    style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-default)' }}
                  >
                    <div className="px-4 pt-3 pb-2" style={{ borderBottom: '1px solid var(--border-default)' }}>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Background</p>
                    </div>

                    {/* Dark / Light toggle */}
                    <div className="px-3 pt-3 pb-2">
                      <p className="text-[10px] text-gray-600 mb-2">Mode</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleBgChange(bgFamily, bgBrightness, 'dark')}
                          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-medium transition-all duration-150"
                          style={{
                            background: themeMode === 'dark' ? 'rgba(var(--accent-primary-rgb),0.15)' : 'rgba(128,128,128,0.1)',
                            color: themeMode === 'dark' ? 'var(--accent-primary)' : 'var(--text-muted)',
                            border: `1px solid ${themeMode === 'dark' ? 'rgba(var(--accent-primary-rgb),0.4)' : 'var(--border-default)'}`,
                          }}
                        >
                          <Moon size={11} />
                          Dark
                        </button>
                        <button
                          onClick={() => handleBgChange(bgFamily, bgBrightness, 'light')}
                          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-medium transition-all duration-150"
                          style={{
                            background: themeMode === 'light' ? 'rgba(var(--accent-primary-rgb),0.15)' : 'rgba(128,128,128,0.1)',
                            color: themeMode === 'light' ? 'var(--accent-primary)' : 'var(--text-muted)',
                            border: `1px solid ${themeMode === 'light' ? 'rgba(var(--accent-primary-rgb),0.4)' : 'var(--border-default)'}`,
                          }}
                        >
                          <Sun size={11} />
                          Light
                        </button>
                      </div>
                    </div>

                    {/* Color family */}
                    <div className="px-3 pb-2" style={{ borderTop: '1px solid var(--border-default)', paddingTop: '10px', marginTop: '2px' }}>
                      <p className="text-[10px] text-gray-600 mb-2">Color</p>
                      <div className="grid grid-cols-6 gap-1.5">
                        {BG_FAMILIES.map((family) => (
                          <button
                            key={family.id}
                            onClick={() => handleBgChange(family.id, bgBrightness)}
                            title={family.name}
                            className="flex flex-col items-center gap-1"
                          >
                            <div
                              className="w-full aspect-square rounded-xl border-2 transition-all duration-150 hover:scale-110"
                              style={{
                                background: themeMode === 'light' ? family.swatchLight : family.swatch,
                                borderColor: bgFamily === family.id ? 'rgba(var(--accent-primary-rgb),0.8)' : 'var(--border-default)',
                              }}
                            />
                            <span
                              className="text-[8px] font-medium leading-none transition-colors"
                              style={{ color: bgFamily === family.id ? 'var(--text-primary)' : 'var(--text-muted)' }}
                            >
                              {family.name}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Brightness */}
                    <div className="px-3 pb-3" style={{ borderTop: '1px solid var(--border-default)', paddingTop: '10px', marginTop: '4px' }}>
                      <p className="text-[10px] text-gray-600 mb-2">Brightness</p>
                      <div className="flex gap-1.5">
                        {brightnessLevels.map((_, i) => {
                          const level = i + 1;
                          const activeFam = BG_FAMILIES.find((f) => f.id === bgFamily) ?? BG_FAMILIES[0];
                          const ls = themeMode === 'light' ? Math.min(activeFam.saturation, 12) : activeFam.saturation;
                          const previewHex = hslToHex(activeFam.hue, ls, brightnessLevels[i]);
                          return (
                            <button
                              key={level}
                              onClick={() => handleBgChange(bgFamily, level)}
                              className="flex-1 h-7 rounded-lg border-2 transition-all duration-150 hover:scale-y-110"
                              style={{
                                background: previewHex,
                                borderColor: bgBrightness === level ? 'rgba(var(--accent-primary-rgb),0.8)' : 'rgba(128,128,128,0.2)',
                              }}
                            />
                          );
                        })}
                      </div>
                      <div className="flex justify-between mt-1 px-0.5">
                        <span className="text-[8px]" style={{ color: 'var(--text-muted)' }}>Dark</span>
                        <span className="text-[8px]" style={{ color: 'var(--text-muted)' }}>Light</span>
                      </div>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={handleNotifOpen}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/5 transition-colors relative"
            >
              <Bell size={17} />
              {unreadCount > 0 && (
                <span
                  className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full"
                  style={{ background: 'var(--accent-primary)' }}
                />
              )}
            </button>

            <AnimatePresence>
              {notifOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -8 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-10 w-72 rounded-2xl shadow-modal z-50 overflow-hidden"
                    style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-default)' }}
                  >
                    <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-default)' }}>
                      <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Notifications</p>
                      {unreadCount > 0 && (
                        <span
                          className="text-xs px-1.5 py-0.5 rounded-full text-white font-medium"
                          style={{ background: 'var(--accent-primary)' }}
                        >
                          {unreadCount}
                        </span>
                      )}
                    </div>

                    {notifications.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 text-center px-4">
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mb-3">
                          <Bell size={18} className="text-gray-500" />
                        </div>
                        <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>All caught up</p>
                        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>New activity will appear here</p>
                      </div>
                    ) : (
                      <div className="overflow-y-auto max-h-80">
                        {notifications.map((notif) => (
                          <button
                            key={notif.id}
                            onClick={() => {
                              setNotifOpen(false);
                              if (notif.link) router.push(notif.link);
                            }}
                            className="w-full flex items-start gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left last:border-0"
                            style={{ borderBottom: '1px solid var(--border-default)' }}
                          >
                            <div
                              className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                              style={{ background: 'rgba(var(--accent-primary-rgb),0.1)' }}
                            >
                              {notif.type === 'COMMENT' ? (
                                <MessageCircle size={14} style={{ color: 'var(--accent-primary)' }} />
                              ) : (
                                <Star size={14} style={{ color: 'var(--accent-primary)' }} />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium leading-snug" style={{ color: 'var(--text-primary)' }}>{notif.title}</p>
                              <p className="text-xs mt-0.5 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{notif.body}</p>
                              <p className="text-2xs mt-1" style={{ color: 'var(--text-muted)' }}>{formatRelativeDate(notif.createdAt)}</p>
                            </div>
                            {!notif.isRead && (
                              <span
                                className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5"
                                style={{ background: 'var(--accent-primary)' }}
                              />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Avatar + menu */}
          <div className="relative">
            <button
              onClick={() => { setMenuOpen(!menuOpen); setThemeOpen(false); setNotifOpen(false); }}
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
                      <Link
                        href="/profile"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-white/5 transition-colors"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        <User size={15} />
                        Profile
                      </Link>
                      <Link
                        href="/settings"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-white/5 transition-colors"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        <Settings size={15} />
                        Settings
                      </Link>
                    </div>

                    <div className="py-1" style={{ borderTop: '1px solid var(--border-default)' }}>
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          signOut({ callbackUrl: '/login' });
                        }}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 w-full transition-colors"
                      >
                        <LogOut size={15} />
                        Sign Out
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
