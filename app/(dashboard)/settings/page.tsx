'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Lock,
  Trash2,
  AlertTriangle,
  Eye,
  EyeOff,
  Shield,
  Bell,
  Palette,
  ChevronRight,
  Loader2,
  Check,
} from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import useToast from '@/lib/hooks/use-toast';
import { signOut } from 'next-auth/react';
import { ACCENT_COLORS, BG_FAMILIES, BG_BRIGHTNESS_LEVELS, hslToHex, applyAccent, applyBackground } from '@/components/ThemeProvider';
import Link from 'next/link';

export default function SettingsPage() {
  const { data: session } = useSession();
  const toast = useToast();

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  // Delete account state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // Notifications (localStorage-persisted UI)
  const [notifEnabled, setNotifEnabled] = useState(() => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem('notif-enabled') !== 'false';
  });

  const [accentColor, setAccentColor] = useState(() => {
    if (typeof window === 'undefined') return '#6366f1';
    return localStorage.getItem('accent-color') || '#6366f1';
  });

  const [bgFamily, setBgFamily] = useState(() => {
    if (typeof window === 'undefined') return 'neutral';
    return localStorage.getItem('bg-family') || 'neutral';
  });
  const [bgBrightness, setBgBrightness] = useState(() => {
    if (typeof window === 'undefined') return 3;
    return parseInt(localStorage.getItem('bg-brightness') || '3', 10);
  });

  // Password mutation
  const passwordMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/user/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      return json;
    },
    onSuccess: () => {
      toast.success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to change password');
    },
  });

  // Delete account mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/user/account', { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      return json;
    },
    onSuccess: () => {
      toast.success('Account deleted');
      signOut({ callbackUrl: '/login' });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to delete account');
    },
  });

  const handlePasswordChange = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters');
      return;
    }
    passwordMutation.mutate();
  };

  const toggleNotif = (val: boolean) => {
    setNotifEnabled(val);
    localStorage.setItem('notif-enabled', String(val));
  };

  const passwordStrength = (): { label: string; color: string; width: string } => {
    if (!newPassword) return { label: '', color: '', width: '0%' };
    let score = 0;
    if (newPassword.length >= 8) score++;
    if (newPassword.length >= 12) score++;
    if (/[A-Z]/.test(newPassword)) score++;
    if (/[0-9]/.test(newPassword)) score++;
    if (/[^A-Za-z0-9]/.test(newPassword)) score++;
    if (score <= 1) return { label: 'Weak', color: 'bg-red-500', width: '20%' };
    if (score === 2) return { label: 'Fair', color: 'bg-amber-500', width: '40%' };
    if (score === 3) return { label: 'Good', color: 'bg-yellow-500', width: '60%' };
    if (score === 4) return { label: 'Strong', color: 'bg-green-500', width: '80%' };
    return { label: 'Very Strong', color: 'bg-emerald-400', width: '100%' };
  };

  const strength = passwordStrength();

  const sections = [
    {
      id: 'security',
      icon: <Shield size={16} className="text-indigo-400" />,
      title: 'Security',
    },
    {
      id: 'appearance',
      icon: <Palette size={16} className="text-violet-400" />,
      title: 'Appearance',
    },
    {
      id: 'notifications',
      icon: <Bell size={16} className="text-blue-400" />,
      title: 'Notifications',
    },
    {
      id: 'danger',
      icon: <Trash2 size={16} className="text-red-400" />,
      title: 'Danger Zone',
    },
  ];

  return (
    <div className="py-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl font-bold text-white">Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage your account and preferences</p>
      </motion.div>

      {/* Account info row */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="rounded-2xl p-4 flex items-center justify-between" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-default)' }}
      >
        <div>
          <p className="text-sm font-medium text-white">{session?.user?.name}</p>
          <p className="text-xs text-gray-500">{session?.user?.email}</p>
        </div>
        <Link
          href="/profile"
          className="text-xs flex items-center gap-1 text-gray-400 hover:text-white transition-colors"
        >
          Edit profile <ChevronRight size={13} />
        </Link>
      </motion.div>

      {/* Security – Change password */}
      <motion.section
        id="security"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl p-5 space-y-4" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-default)' }}
      >
        <div className="flex items-center gap-2 mb-1">
          <Shield size={16} className="text-indigo-400" />
          <h2 className="text-sm font-semibold text-white">Change Password</h2>
        </div>

        <div className="relative">
          <Input
            label="Current password"
            type={showCurrent ? 'text' : 'password'}
            placeholder="Enter current password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setShowCurrent(!showCurrent)}
            className="absolute right-3 top-[38px] text-gray-500 hover:text-gray-300 transition-colors"
          >
            {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>

        <div>
          <div className="relative">
            <Input
              label="New password"
              type={showNew ? 'text' : 'password'}
              placeholder="At least 8 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute right-3 top-[38px] text-gray-500 hover:text-gray-300 transition-colors"
            >
              {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {newPassword && (
            <div className="mt-1.5">
              <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${strength.color}`}
                  style={{ width: strength.width }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">{strength.label}</p>
            </div>
          )}
        </div>

        <Input
          label="Confirm new password"
          type="password"
          placeholder="Repeat new password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={confirmPassword && newPassword !== confirmPassword ? "Passwords don't match" : undefined}
        />

        <Button
          variant="primary"
          onClick={handlePasswordChange}
          loading={passwordMutation.isPending}
          leftIcon={<Lock size={15} />}
          fullWidth
          disabled={!currentPassword || !newPassword || !confirmPassword}
        >
          Update password
        </Button>
      </motion.section>

      {/* Appearance */}
      <motion.section
        id="appearance"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="rounded-2xl p-5"
        style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-default)' }}
      >
        <div className="flex items-center gap-2 mb-5">
          <Palette size={16} className="text-violet-400" />
          <h2 className="text-sm font-semibold text-white">Appearance</h2>
        </div>

        {/* Background color family */}
        <p className="text-xs text-gray-500 mb-2.5">Background color</p>
        <div className="grid grid-cols-6 gap-2 mb-5">
          {BG_FAMILIES.map((family) => (
            <button
              key={family.id}
              onClick={() => {
                applyBackground(family.id, bgBrightness);
                setBgFamily(family.id);
              }}
              title={family.name}
              className="flex flex-col items-center gap-1.5"
            >
              <div
                className="w-full aspect-square rounded-xl border-2 transition-all duration-150 hover:scale-110"
                style={{
                  background: family.swatch,
                  borderColor: bgFamily === family.id ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.06)',
                }}
              />
              <span className={`text-[10px] font-medium transition-colors ${bgFamily === family.id ? 'text-white' : 'text-gray-600'}`}>
                {family.name}
              </span>
            </button>
          ))}
        </div>

        {/* Brightness */}
        <p className="text-xs text-gray-500 mb-2.5">Brightness</p>
        <div className="flex gap-2 mb-1">
          {BG_BRIGHTNESS_LEVELS.map((_, i) => {
            const level = i + 1;
            const activeFam = BG_FAMILIES.find((f) => f.id === bgFamily) ?? BG_FAMILIES[0];
            const previewHex = hslToHex(activeFam.hue, activeFam.saturation, BG_BRIGHTNESS_LEVELS[i]);
            return (
              <button
                key={level}
                onClick={() => {
                  applyBackground(bgFamily, level);
                  setBgBrightness(level);
                }}
                className="flex-1 h-10 rounded-xl border-2 transition-all duration-150 hover:scale-y-105"
                style={{
                  background: previewHex,
                  borderColor: bgBrightness === level ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.06)',
                }}
              />
            );
          })}
        </div>
        <div className="flex justify-between px-0.5 mb-5">
          <span className="text-[10px] text-gray-700">Darker</span>
          <span className="text-[10px] text-gray-700">Lighter</span>
        </div>

        {/* Accent override */}
        <p className="text-xs text-gray-500 mb-2.5">
          Accent color
          <span className="ml-1.5 text-gray-700">(auto-set by background)</span>
        </p>
        <div className="grid grid-cols-8 gap-2">
          {ACCENT_COLORS.map((color) => (
            <button
              key={color.value}
              onClick={() => { applyAccent(color.value, color.secondary); setAccentColor(color.value); }}
              title={color.name}
              className="relative aspect-square rounded-xl border-2 transition-all duration-150 hover:scale-110 flex items-center justify-center"
              style={{
                background: color.value,
                borderColor: accentColor === color.value ? 'rgba(255,255,255,0.8)' : 'transparent',
              }}
            >
              {accentColor === color.value && (
                <Check size={12} className="text-white" strokeWidth={3} />
              )}
            </button>
          ))}
        </div>

        <p className="text-xs text-gray-700 mt-3">
          Settings are saved automatically and persist across sessions.
        </p>
      </motion.section>

      {/* Notifications */}
      <motion.section
        id="notifications"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl p-5" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-default)' }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Bell size={16} className="text-blue-400" />
          <h2 className="text-sm font-semibold text-white">Notifications</h2>
        </div>

        <div className="space-y-3">
          {[
            { key: 'main', label: 'Activity notifications', desc: 'Ratings and comments on your posts', value: notifEnabled, toggle: toggleNotif },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between py-1">
              <div>
                <p className="text-sm text-white">{item.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
              </div>
              <button
                onClick={() => item.toggle(!item.value)}
                className={`relative w-10 h-6 rounded-full transition-all duration-200 flex-shrink-0 ${
                  item.value ? '' : 'bg-white/10'
                }`}
                style={item.value ? { background: 'var(--accent-primary)' } : undefined}
              >
                <span
                  className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
                    item.value ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Danger zone */}
      <motion.section
        id="danger"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="bg-[var(--bg-secondary)] border border-red-500/20 rounded-2xl p-5"
      >
        <div className="flex items-center gap-2 mb-1">
          <AlertTriangle size={16} className="text-red-400" />
          <h2 className="text-sm font-semibold text-red-400">Danger Zone</h2>
        </div>
        <p className="text-xs text-gray-500 mb-4">
          Permanently delete your account and all associated data. This cannot be undone.
        </p>
        <Button
          variant="danger"
          onClick={() => setDeleteOpen(true)}
          leftIcon={<Trash2 size={15} />}
        >
          Delete account
        </Button>
      </motion.section>

      {/* Delete confirmation modal */}
      <Modal
        isOpen={deleteOpen}
        onClose={() => { setDeleteOpen(false); setDeleteConfirmText(''); }}
        title="Delete account"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
            <AlertTriangle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-300">
              All your projects, references, portfolio items, and community posts will be permanently deleted.
            </p>
          </div>
          <Input
            label={`Type "delete" to confirm`}
            placeholder="delete"
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
          />
          <div className="flex gap-3">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => { setDeleteOpen(false); setDeleteConfirmText(''); }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              fullWidth
              loading={deleteMutation.isPending}
              disabled={deleteConfirmText.toLowerCase() !== 'delete'}
              onClick={() => deleteMutation.mutate()}
              leftIcon={<Trash2 size={15} />}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
