'use client';

import { useState, useCallback, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Camera, ExternalLink, Copy, Check, Save, FolderKanban, LayoutTemplate,
  Loader2, Upload, Lock, Trash2, AlertTriangle,
  Eye, EyeOff, Shield, Globe, LogOut,
} from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import useToast from '@/lib/hooks/use-toast';
import { getInitials } from '@/lib/utils';
import Link from 'next/link';
import { useT } from '@/lib/i18n';
import { signOut } from 'next-auth/react';
import { useAppStore } from '@/store/useAppStore';
import type { Lang } from '@/lib/i18n';
import { ACCENT_COLORS, applyAccent } from '@/components/ThemeProvider';

interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  username: string | null;
  bio: string | null;
  image: string | null;
  avatar: string | null;
  createdAt: string;
  _count: {
    projects: number;
    references: number;
    communityPosts: number;
    portfolioItems: number;
  };
}

export default function ProfilePage() {
  const { data: session, update: updateSession } = useSession();
  const toast = useToast();
  const queryClient = useQueryClient();
  const t = useT();
  const { lang, setLang } = useAppStore();
  const [accentHex, setAccentHex] = useState(() =>
    typeof window !== 'undefined' ? (localStorage.getItem('accent-color') || '#16a34a') : '#16a34a'
  );

  // Profile state
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Security state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  // Delete state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const { data, isLoading } = useQuery<{ data: UserProfile }>({
    queryKey: ['user-profile'],
    queryFn: () => fetch('/api/user/profile').then((r) => r.json()),
  });

  const profile = data?.data;

  useEffect(() => {
    if (profile && !initialized) {
      setName(profile.name ?? '');
      setUsername(profile.username ?? '');
      setBio(profile.bio ?? '');
      setAvatar(profile.avatar ?? profile.image ?? '');
      setInitialized(true);
    }
  }, [profile]); // eslint-disable-line react-hooks/exhaustive-deps

  const saveMutation = useMutation({
    mutationFn: async (vars: { name: string; username: string; bio: string; avatar: string }) => {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vars),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to save');
      return json;
    },
    onSuccess: (data) => {
      if (data?.data) {
        setName(data.data.name ?? '');
        setUsername(data.data.username ?? '');
        setBio(data.data.bio ?? '');
        setAvatar(data.data.avatar ?? data.data.image ?? '');
        queryClient.setQueryData(['user-profile'], (old: any) => old ? { ...old, data: { ...old.data, ...data.data } } : data);
      }
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      updateSession();
      toast.success(t.profile.saved);
    },
    onError: (err: any) => {
      toast.error(err.message || t.profile.saveFailed);
    },
  });

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
      toast.success(t.settings.pwChanged);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    },
    onError: (err: any) => {
      toast.error(err.message || t.settings.pwChangeFailed);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/user/account', { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      return json;
    },
    onSuccess: () => {
      toast.success(t.settings.accountDeleted);
      signOut({ callbackUrl: '/login' });
    },
    onError: (err: any) => {
      toast.error(err.message || t.settings.deleteFailed);
    },
  });

  const handleAvatarUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      const newUrl = json.data.url;
      setAvatar(newUrl);
      // Immediately persist to DB so it survives page refresh
      const saveRes = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar: newUrl }),
      });
      const saveJson = await saveRes.json();
      if (!saveRes.ok) throw new Error(saveJson.error || 'Failed to save avatar');
      queryClient.setQueryData(['user-profile'], (old: any) =>
        old ? { ...old, data: { ...old.data, avatar: newUrl } } : old
      );
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      updateSession();
      toast.success(t.profile.avatarUploaded);
    } catch (err: any) {
      toast.error(err.message || t.profile.uploadFailed);
    } finally {
      setAvatarUploading(false);
    }
  }, [queryClient, updateSession, t]);

  const copyProfileLink = () => {
    if (!username) return;
    navigator.clipboard.writeText(`${window.location.origin}/p/${username}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePasswordChange = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error(t.settings.fillAllFields);
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(t.settings.pwMismatch);
      return;
    }
    if (newPassword.length < 8) {
      toast.error(t.settings.pwTooShort);
      return;
    }
    passwordMutation.mutate();
  };

  const passwordStrength = (): { label: string; color: string; width: string } => {
    if (!newPassword) return { label: '', color: '', width: '0%' };
    let score = 0;
    if (newPassword.length >= 8) score++;
    if (newPassword.length >= 12) score++;
    if (/[A-Z]/.test(newPassword)) score++;
    if (/[0-9]/.test(newPassword)) score++;
    if (/[^A-Za-z0-9]/.test(newPassword)) score++;
    if (score <= 1) return { label: t.settings.pwWeak, color: 'bg-red-500', width: '20%' };
    if (score === 2) return { label: t.settings.pwFair, color: 'bg-amber-500', width: '40%' };
    if (score === 3) return { label: t.settings.pwGood, color: 'bg-yellow-500', width: '60%' };
    if (score === 4) return { label: t.settings.pwStrong, color: 'bg-green-500', width: '80%' };
    return { label: t.settings.pwVeryStrong, color: 'bg-emerald-400', width: '100%' };
  };

  const strength = passwordStrength();

  const LANGS: { value: Lang; label: string }[] = [
    { value: 'ko', label: '한국어' },
    { value: 'en', label: 'English' },
  ];

  const stats = [
    { label: t.profile.statsProjects, value: profile?._count.projects ?? 0, icon: FolderKanban, color: 'text-green-500', bg: 'bg-green-500/10' },
    { label: t.profile.statsPortfolio, value: profile?._count.portfolioItems ?? 0, icon: LayoutTemplate, color: 'text-green-400', bg: 'bg-green-500/10' },
  ];

  if (isLoading) {
    return (
      <div className="py-8 flex justify-center">
        <Loader2 size={24} className="animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="py-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{t.profile.title}</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>{t.profile.subtitle}</p>
      </motion.div>

      {/* Avatar */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="rounded-2xl p-5"
        style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-default)' }}
      >
        <div className="flex items-center gap-4">
          <div className="relative flex-shrink-0">
            <div className="w-20 h-20 rounded-2xl overflow-hidden border border-white/10">
              {avatar ? (
                <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center text-white text-2xl font-bold"
                  style={{ background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))' }}
                >
                  {getInitials(name || session?.user?.name)}
                </div>
              )}
            </div>
            <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity rounded-2xl cursor-pointer">
              {avatarUploading ? (
                <Loader2 size={18} className="animate-spin text-white" />
              ) : (
                <Camera size={18} className="text-white" />
              )}
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={avatarUploading} />
            </label>
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{name || session?.user?.name || 'Your Name'}</p>
            {username && <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>@{username}</p>}
            <div className="flex items-center gap-2 mt-2">
              <label className="flex items-center gap-1.5 text-xs cursor-pointer px-3 py-1.5 rounded-lg transition-colors" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}>
                <Upload size={12} />
                {t.profile.changePhoto}
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={avatarUploading} />
              </label>
              {avatar && (
                <button
                  onClick={() => setAvatar('')}
                  className="text-xs px-3 py-1.5 rounded-lg transition-colors hover:text-red-400"
                  style={{ background: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}
                >
                  {t.profile.remove}
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Personal info */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl p-5 space-y-4"
        style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-default)' }}
      >
        <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{t.profile.personalInfo}</h2>

        <Input
          label={t.profile.displayName}
          placeholder={t.profile.namePlaceholder}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <Input
          label={t.profile.username}
          placeholder={t.profile.usernamePlaceholder}
          value={username}
          onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
          hint={t.profile.usernameHint}
        />

        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>{t.profile.bio}</label>
          <textarea
            placeholder={t.profile.bioPlaceholder}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={200}
            rows={3}
            className="input-base resize-none"
          />
          <p className="text-xs mt-1 text-right" style={{ color: 'var(--text-disabled)' }}>{bio.length}/200</p>
        </div>

        <Input
          label={t.profile.email}
          value={profile?.email ?? ''}
          disabled
          hint={t.profile.emailHint}
        />

        <Button
          variant="primary"
          onClick={() => saveMutation.mutate({ name, username, bio, avatar })}
          loading={saveMutation.isPending}
          leftIcon={<Save size={15} />}
          fullWidth
        >
          {t.profile.saveChanges}
        </Button>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.13 }}
        className="rounded-2xl p-5"
        style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-default)' }}
      >
        <p className="text-xs font-semibold mb-3" style={{ color: 'var(--text-muted)' }}>진행 상황</p>
        <div className="flex gap-3">
          {stats.map((stat) => (
            <div key={stat.label} className="flex-1 flex items-center gap-2 rounded-xl px-3 py-2" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
              <stat.icon size={14} className={stat.color} />
              <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{stat.value}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Public profile link */}
      {username && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl p-5"
          style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-default)' }}
        >
          <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>{t.profile.publicProfile}</h2>
          <div className="flex items-center gap-2 rounded-xl px-3 py-2.5" style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-default)' }}>
            <span className="text-xs flex-1 truncate" style={{ color: 'var(--text-muted)' }}>
              {typeof window !== 'undefined' ? window.location.origin : ''}/p/{username}
            </span>
            <button onClick={copyProfileLink} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0">
              {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} style={{ color: 'var(--text-muted)' }} />}
            </button>
            <Link href={`/p/${username}`} target="_blank" className="p-1.5 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0">
              <ExternalLink size={14} style={{ color: 'var(--text-muted)' }} />
            </Link>
          </div>
        </motion.div>
      )}

      {/* E. Appearance — custom accent color */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.16 }}
        className="rounded-2xl p-5"
        style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-default)' }}
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ background: `linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))` }} />
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>테마 색상</h2>
        </div>
        {/* Preset swatches */}
        <div className="flex gap-2 flex-wrap mb-3">
          {ACCENT_COLORS.map((c) => (
            <button
              key={c.value}
              onClick={() => { applyAccent(c.value, c.secondary); setAccentHex(c.value); }}
              className="w-7 h-7 rounded-full transition-all hover:scale-110"
              style={{
                background: c.value,
                boxShadow: accentHex === c.value ? `0 0 0 2px var(--bg-secondary), 0 0 0 4px ${c.value}` : 'none',
              }}
              title={c.name}
            />
          ))}
        </div>
        {/* Custom hex input */}
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={accentHex}
            onChange={(e) => { setAccentHex(e.target.value); applyAccent(e.target.value); }}
            className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent flex-shrink-0"
          />
          <input
            type="text"
            value={accentHex}
            onChange={(e) => {
              const v = e.target.value;
              setAccentHex(v);
              if (/^#[0-9a-fA-F]{6}$/.test(v)) applyAccent(v);
            }}
            maxLength={7}
            placeholder="#16a34a"
            className="flex-1 px-3 py-1.5 rounded-xl text-xs font-mono focus:outline-none"
            style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-default)' }}
          />
          <div className="w-8 h-8 rounded-lg flex-shrink-0" style={{ background: accentHex }} />
        </div>
      </motion.section>

      {/* Language */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.17 }}
        className="rounded-2xl p-5"
        style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-default)' }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Globe size={16} className="text-sky-400" />
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{t.settings.language}</h2>
        </div>
        <div className="flex gap-2">
          {LANGS.map((l) => (
            <button
              key={l.value}
              onClick={() => setLang(l.value)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
              style={{
                background: lang === l.value ? 'rgba(var(--accent-primary-rgb),0.12)' : 'var(--bg-tertiary)',
                color: lang === l.value ? 'var(--accent-primary)' : 'var(--text-secondary)',
                border: `1.5px solid ${lang === l.value ? 'rgba(var(--accent-primary-rgb),0.4)' : 'var(--border-default)'}`,
              }}
            >
              {l.label}
              {lang === l.value && <Check size={13} />}
            </button>
          ))}
        </div>
      </motion.section>

      {/* Security */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.24 }}
        className="rounded-2xl p-5 space-y-4"
        style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-default)' }}
      >
        <div className="flex items-center gap-2 mb-1">
          <Shield size={16} className="text-green-500" />
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{t.settings.changePassword}</h2>
        </div>

        <div className="relative">
          <Input
            label={t.settings.currentPw}
            type={showCurrent ? 'text' : 'password'}
            placeholder={t.settings.currentPwPlaceholder}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setShowCurrent(!showCurrent)}
            className="absolute right-3 top-[38px] transition-colors"
            style={{ color: 'var(--text-muted)' }}
          >
            {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>

        <div>
          <div className="relative">
            <Input
              label={t.settings.newPw}
              type={showNew ? 'text' : 'password'}
              placeholder={t.settings.newPwPlaceholder}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute right-3 top-[38px] transition-colors"
              style={{ color: 'var(--text-muted)' }}
            >
              {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {newPassword && (
            <div className="mt-1.5">
              <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                <div className={`h-full rounded-full transition-all duration-300 ${strength.color}`} style={{ width: strength.width }} />
              </div>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{strength.label}</p>
            </div>
          )}
        </div>

        <Input
          label={t.settings.confirmPw}
          type="password"
          placeholder={t.settings.confirmPwPlaceholder}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={confirmPassword && newPassword !== confirmPassword ? t.settings.pwNoMatch : undefined}
        />

        <Button
          variant="primary"
          onClick={handlePasswordChange}
          loading={passwordMutation.isPending}
          leftIcon={<Lock size={15} />}
          fullWidth
          disabled={!currentPassword || !newPassword || !confirmPassword}
        >
          {t.settings.updatePw}
        </Button>
      </motion.section>

      {/* Logout */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.26 }}
        className="rounded-2xl p-5"
        style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-default)' }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{session?.user?.name}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{session?.user?.email}</p>
          </div>
          <Button variant="secondary" size="sm" leftIcon={<LogOut size={14} />} onClick={() => signOut({ callbackUrl: '/login' })}>
            {t.nav.signOut}
          </Button>
        </div>
      </motion.section>

      {/* Delete account */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.28 }}
        className="rounded-2xl p-5"
        style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid rgba(239,68,68,0.2)' }}
      >
        <div className="flex items-center gap-2 mb-1">
          <AlertTriangle size={16} className="text-red-400" />
          <h2 className="text-sm font-semibold text-red-400">{t.settings.dangerZone}</h2>
        </div>
        <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>{t.settings.dangerDesc}</p>
        <Button variant="danger" onClick={() => setDeleteOpen(true)} leftIcon={<Trash2 size={15} />}>
          {t.settings.deleteAccount}
        </Button>
      </motion.section>

      {/* Delete confirmation modal */}
      <Modal
        isOpen={deleteOpen}
        onClose={() => { setDeleteOpen(false); setDeleteConfirmText(''); }}
        title={t.settings.deleteModalTitle}
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
            <AlertTriangle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-500">{t.settings.deleteWarning}</p>
          </div>
          <Input
            label={t.settings.deleteTypeLabel}
            placeholder={t.settings.deletePlaceholder}
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
          />
          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={() => { setDeleteOpen(false); setDeleteConfirmText(''); }}>
              {t.settings.cancel}
            </Button>
            <Button
              variant="danger"
              fullWidth
              loading={deleteMutation.isPending}
              disabled={deleteConfirmText.toLowerCase() !== 'delete'}
              onClick={() => deleteMutation.mutate()}
              leftIcon={<Trash2 size={15} />}
            >
              {t.settings.deleteBtn}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
