'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  LayoutTemplate,
  Share2,
  Link2,
  Globe,
  Lock,
  Pencil,
  Trash2,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import PortfolioCard from '@/components/cards/PortfolioCard';
import { Badge } from '@/components/ui/Badge';
import useToast from '@/lib/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { Portfolio, Project } from '@/types';

export default function PortfolioPage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const toast = useToast();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Portfolio | null>(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    tags: '',
    isPublic: false,
    coverColor: '#6366f1',
    layout: 'grid',
    projectId: '',
  });
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['portfolio'],
    queryFn: () => fetch('/api/portfolio').then((r) => r.json()),
  });

  const { data: projectsData } = useQuery({
    queryKey: ['completed-projects'],
    queryFn: () => fetch('/api/projects?status=COMPLETED').then((r) => r.json()),
  });

  const portfolioItems: Portfolio[] = data?.data || [];
  const completedProjects: Project[] = projectsData?.data || [];

  const createMutation = useMutation({
    mutationFn: (body: any) =>
      fetch('/api/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).then((r) => r.json()),
    onSuccess: (data) => {
      if (data.error) { toast.error(data.error); return; }
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
      toast.success('Portfolio item created!');
      setCreateModalOpen(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: any }) =>
      fetch(`/api/portfolio/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
      toast.success('Portfolio item updated!');
      setEditItem(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/portfolio/${id}`, { method: 'DELETE' }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
      toast.success('Portfolio item deleted');
    },
  });

  const resetForm = () => {
    setForm({
      title: '',
      description: '',
      tags: '',
      isPublic: false,
      coverColor: '#6366f1',
      layout: 'grid',
      projectId: '',
    });
  };

  const openEditModal = (item: Portfolio) => {
    setEditItem(item);
    setForm({
      title: item.title,
      description: item.description || '',
      tags: item.tags.join(', '),
      isPublic: item.isPublic,
      coverColor: item.coverColor,
      layout: item.layout,
      projectId: item.projectId || '',
    });
  };

  const handleSubmit = () => {
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    const body = {
      title: form.title,
      description: form.description || undefined,
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      isPublic: form.isPublic,
      coverColor: form.coverColor,
      layout: form.layout,
      projectId: form.projectId || undefined,
    };
    if (editItem) {
      updateMutation.mutate({ id: editItem.id, body });
    } else {
      createMutation.mutate(body);
    }
  };

  const handleShare = async (item: Portfolio) => {
    if (!item.publicSlug) return;
    const url = `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/p/${item.publicSlug}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedSlug(item.id);
      toast.success('Portfolio link copied!');
      setTimeout(() => setCopiedSlug(null), 2000);
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const publicPortfolioUrl = session?.user?.username
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/p/${session.user.username}`
    : null;

  return (
    <div className="py-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Portfolio</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {portfolioItems.length} item{portfolioItems.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => { resetForm(); setEditItem(null); setCreateModalOpen(true); }}
          leftIcon={<Plus size={14} />}
        >
          Add Item
        </Button>
      </div>

      {/* Public portfolio link */}
      {publicPortfolioUrl && portfolioItems.some((i) => i.isPublic) && (
        <div
          className="rounded-2xl p-4"
          style={{ background: 'rgba(var(--accent-primary-rgb),0.08)', border: '1px solid rgba(var(--accent-primary-rgb),0.2)' }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Globe size={14} style={{ color: 'var(--accent-primary)' }} />
            <span className="text-xs font-medium" style={{ color: 'var(--accent-primary)' }}>Your public portfolio</span>
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs text-gray-300 bg-black/30 px-3 py-2 rounded-lg truncate">
              {publicPortfolioUrl}
            </code>
            <Button
              variant="secondary"
              size="sm"
              onClick={async () => {
                await navigator.clipboard.writeText(publicPortfolioUrl);
                toast.success('Link copied!');
              }}
              leftIcon={<Link2 size={13} />}
            >
              Copy
            </Button>
          </div>
        </div>
      )}

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton rounded-2xl aspect-[4/5]" />
          ))}
        </div>
      ) : portfolioItems.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-4">
            <LayoutTemplate size={28} className="text-indigo-400" />
          </div>
          <h3 className="font-semibold text-white mb-2">Build your portfolio</h3>
          <p className="text-sm text-gray-500 mb-5 max-w-[240px]">
            Showcase your completed projects. Convert finished projects to portfolio items.
          </p>
          <Button
            variant="primary"
            onClick={() => { resetForm(); setCreateModalOpen(true); }}
            leftIcon={<Plus size={16} />}
          >
            Add First Item
          </Button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <AnimatePresence>
            {portfolioItems.map((item) => (
              <div key={item.id} className="relative group">
                <PortfolioCard
                  item={item}
                  onEdit={() => openEditModal(item)}
                  onShare={() => handleShare(item)}
                />
                {/* Delete button */}
                <button
                  onClick={() => deleteMutation.mutate(item.id)}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-500/20 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/30"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Create/Edit modal */}
      <Modal
        isOpen={createModalOpen || !!editItem}
        onClose={() => { setCreateModalOpen(false); setEditItem(null); }}
        title={editItem ? 'Edit Portfolio Item' : 'Add Portfolio Item'}
        size="md"
      >
        <div className="space-y-4">
          {/* Auto-populate from project */}
          {!editItem && completedProjects.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-300">From Completed Project</label>
              <select
                value={form.projectId}
                onChange={(e) => {
                  const selectedProject = completedProjects.find((p) => p.id === e.target.value);
                  setForm((prev) => ({
                    ...prev,
                    projectId: e.target.value,
                    title: selectedProject?.title || prev.title,
                    description: selectedProject?.description || prev.description,
                  }));
                }}
                className="w-full px-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] text-sm focus:outline-none"
              >
                <option value="">Create manually</option>
                {completedProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          <Input
            label="Title"
            placeholder="Portfolio item title"
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            required
          />

          <Textarea
            label="Description"
            placeholder="Describe this portfolio piece..."
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            rows={3}
          />

          <Input
            label="Tags"
            placeholder="branding, ui, illustration"
            value={form.tags}
            onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value }))}
          />

          {/* Cover color */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-300">Cover Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={form.coverColor}
                onChange={(e) => setForm((p) => ({ ...p, coverColor: e.target.value }))}
                className="w-10 h-10 rounded-xl border-0 cursor-pointer bg-transparent"
              />
              <div
                className="flex-1 h-10 rounded-xl"
                style={{
                  background: `linear-gradient(135deg, ${form.coverColor}66, ${form.coverColor}33)`,
                  border: `1px solid ${form.coverColor}44`,
                }}
              />
            </div>
          </div>

          {/* Visibility */}
          <label className="flex items-center gap-3 cursor-pointer p-3 bg-[var(--bg-tertiary)] rounded-xl">
            <input
              type="checkbox"
              checked={form.isPublic}
              onChange={(e) => setForm((p) => ({ ...p, isPublic: e.target.checked }))}
              className="w-4 h-4 rounded accent-indigo-500"
            />
            <div className="flex items-center gap-2">
              {form.isPublic ? (
                <Globe size={14} className="text-green-400" />
              ) : (
                <Lock size={14} className="text-gray-400" />
              )}
              <div>
                <p className="text-sm text-white">{form.isPublic ? 'Public' : 'Private'}</p>
                <p className="text-xs text-gray-500">
                  {form.isPublic ? 'Anyone can view this item' : 'Only you can see this'}
                </p>
              </div>
            </div>
          </label>

          <div className="flex gap-3 pt-2">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => { setCreateModalOpen(false); setEditItem(null); }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              fullWidth
              loading={createMutation.isPending || updateMutation.isPending}
              onClick={handleSubmit}
            >
              {editItem ? 'Save Changes' : 'Create Item'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
