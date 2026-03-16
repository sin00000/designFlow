'use client';

import { useState, useCallback, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Camera,
  ExternalLink,
  Copy,
  Check,
  Save,
  FolderKanban,
  BookImage,
  Users,
  LayoutTemplate,
  Loader2,
  Upload,
} from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import useToast from '@/lib/hooks/use-toast';
import { getInitials } from '@/lib/utils';
import Link from 'next/link';

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

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [initialized, setInitialized] = useState(false);

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
  }, [profile, initialized]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, username, bio, avatar }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      return json;
    },
    onSuccess: () => {
      toast.success('Profile saved');
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      updateSession();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to save profile');
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
      setAvatar(json.data.url);
      toast.success('Avatar uploaded');
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setAvatarUploading(false);
    }
  }, []);

  const copyProfileLink = () => {
    if (!username) return;
    navigator.clipboard.writeText(`${window.location.origin}/p/${username}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const stats = [
    { label: 'Projects', value: profile?._count.projects ?? 0, icon: FolderKanban, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
    { label: 'References', value: profile?._count.references ?? 0, icon: BookImage, color: 'text-violet-400', bg: 'bg-violet-500/10' },
    { label: 'Community', value: profile?._count.communityPosts ?? 0, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Portfolio', value: profile?._count.portfolioItems ?? 0, icon: LayoutTemplate, color: 'text-green-400', bg: 'bg-green-500/10' },
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
        <h1 className="text-xl font-bold text-white">Profile</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage your public profile</p>
      </motion.div>

      {/* Avatar */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-2xl p-5"
      >
        <div className="flex items-center gap-4">
          {/* Avatar circle */}
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
            {/* Upload overlay */}
            <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity rounded-2xl cursor-pointer">
              {avatarUploading ? (
                <Loader2 size={18} className="animate-spin text-white" />
              ) : (
                <Camera size={18} className="text-white" />
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
                disabled={avatarUploading}
              />
            </label>
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-semibold text-white">{name || session?.user?.name || 'Your Name'}</p>
            {username && (
              <p className="text-sm text-gray-500 mt-0.5">@{username}</p>
            )}
            <div className="flex items-center gap-2 mt-2">
              <label className="flex items-center gap-1.5 text-xs cursor-pointer px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                <Upload size={12} />
                Change photo
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                  disabled={avatarUploading}
                />
              </label>
              {avatar && (
                <button
                  onClick={() => setAvatar('')}
                  className="text-xs px-3 py-1.5 rounded-lg bg-white/5 hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-colors"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Edit form */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-2xl p-5 space-y-4"
      >
        <h2 className="text-sm font-semibold text-white">Personal info</h2>

        <Input
          label="Display name"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <div>
          <Input
            label="Username"
            placeholder="yourname"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
            hint="3–30 characters: a–z, 0–9, underscores"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Bio</label>
          <textarea
            placeholder="Tell the community about yourself…"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={200}
            rows={3}
            className="input-base resize-none"
          />
          <p className="text-xs text-gray-600 mt-1 text-right">{bio.length}/200</p>
        </div>

        <div className="pt-1">
          <Input
            label="Email"
            value={profile?.email ?? ''}
            disabled
            hint="Email cannot be changed here"
          />
        </div>

        <Button
          variant="primary"
          onClick={() => saveMutation.mutate()}
          loading={saveMutation.isPending}
          leftIcon={<Save size={15} />}
          fullWidth
        >
          Save changes
        </Button>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-2xl p-5"
      >
        <h2 className="text-sm font-semibold text-white mb-4">Activity</h2>
        <div className="grid grid-cols-2 gap-3">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-[var(--bg-tertiary)] rounded-xl p-3 flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${stat.bg}`}>
                <stat.icon size={15} className={stat.color} />
              </div>
              <div>
                <p className="text-lg font-bold text-white leading-none">{stat.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Public profile link */}
      {username && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-2xl p-5"
        >
          <h2 className="text-sm font-semibold text-white mb-3">Public profile</h2>
          <div className="flex items-center gap-2 bg-[var(--bg-tertiary)] rounded-xl px-3 py-2.5 border border-[var(--border-default)]">
            <span className="text-xs text-gray-500 flex-1 truncate">
              {typeof window !== 'undefined' ? window.location.origin : ''}/p/{username}
            </span>
            <button
              onClick={copyProfileLink}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0"
              title="Copy link"
            >
              {copied ? (
                <Check size={14} className="text-green-400" />
              ) : (
                <Copy size={14} className="text-gray-400" />
              )}
            </button>
            <Link
              href={`/p/${username}`}
              target="_blank"
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0"
              title="View public profile"
            >
              <ExternalLink size={14} className="text-gray-400" />
            </Link>
          </div>
        </motion.div>
      )}
    </div>
  );
}
