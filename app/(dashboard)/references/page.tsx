'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Plus,
  Filter,
  X,
  BookImage,
  Link2,
  Image as ImageIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import ReferenceCard from '@/components/cards/ReferenceCard';
import { Badge } from '@/components/ui/Badge';
import ImageUpload from '@/components/ui/ImageUpload';
import useToast from '@/lib/hooks/use-toast';
import { parseTagsInput } from '@/lib/utils';
import type { Reference, Project } from '@/types';
import { useT } from '@/lib/i18n';

interface AddReferenceForm {
  imageUrl: string;
  sourceUrl: string;
  title: string;
  tags: string;
  notes: string;
  linkedProjectId: string;
}

const defaultForm: AddReferenceForm = {
  imageUrl: '',
  sourceUrl: '',
  title: '',
  tags: '',
  notes: '',
  linkedProjectId: '',
};

export default function ReferencesPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const t = useT();

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [tagFilter, setTagFilter] = useState<string[]>([]);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [form, setForm] = useState<AddReferenceForm>(defaultForm);
  const [editRef, setEditRef] = useState<Reference | null>(null);
  const [uploadMode, setUploadMode] = useState<'url' | 'upload'>('upload');
  const [errors, setErrors] = useState<Partial<AddReferenceForm>>({});

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading } = useQuery({
    queryKey: ['references', debouncedSearch, tagFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (tagFilter.length > 0) params.set('tags', tagFilter.join(','));
      return fetch(`/api/references?${params}`).then((r) => r.json());
    },
  });

  const { data: projectsData } = useQuery({
    queryKey: ['projects-list'],
    queryFn: () => fetch('/api/projects').then((r) => r.json()),
  });

  const references: Reference[] = data?.data || [];
  const projects: Project[] = projectsData?.data || [];

  // All unique tags from references
  const allTags = Array.from(new Set(references.flatMap((r) => r.tags))).sort();

  const createMutation = useMutation({
    mutationFn: (body: any) =>
      fetch('/api/references', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).then((r) => r.json()),
    onSuccess: (data) => {
      if (data.error) {
        toast.error(data.error);
        return;
      }
      queryClient.invalidateQueries({ queryKey: ['references'] });
      toast.success(t.references.added);
      setAddModalOpen(false);
      setForm(defaultForm);
    },
    onError: () => toast.error(t.references.addFailed),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: any }) =>
      fetch(`/api/references/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['references'] });
      toast.success(t.references.updated);
      setEditRef(null);
      setAddModalOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/references/${id}`, { method: 'DELETE' }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['references'] });
      toast.success(t.references.deleted);
    },
  });

  const validate = () => {
    const e: Partial<AddReferenceForm> = {};
    if (!form.title.trim()) e.title = t.references.titleRequired;
    if (!form.imageUrl.trim()) e.imageUrl = t.references.imageRequired;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const body = {
      imageUrl: form.imageUrl,
      sourceUrl: form.sourceUrl || undefined,
      title: form.title,
      tags: parseTagsInput(form.tags),
      notes: form.notes || undefined,
      linkedProjectId: form.linkedProjectId || undefined,
    };

    if (editRef) {
      updateMutation.mutate({ id: editRef.id, body });
    } else {
      createMutation.mutate(body);
    }
  };

  const openEditModal = (ref: Reference) => {
    setEditRef(ref);
    setForm({
      imageUrl: ref.imageUrl,
      sourceUrl: ref.sourceUrl || '',
      title: ref.title,
      tags: ref.tags.join(', '),
      notes: ref.notes || '',
      linkedProjectId: ref.linkedProjectId || '',
    });
    setAddModalOpen(true);
  };

  const openAddModal = () => {
    setEditRef(null);
    setForm(defaultForm);
    setErrors({});
    setAddModalOpen(true);
  };

  const toggleTagFilter = (tag: string) => {
    setTagFilter((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  return (
    <div className="py-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">{t.references.title}</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {t.references.count(references.length, debouncedSearch || undefined)}
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={openAddModal}
          leftIcon={<Plus size={14} />}
        >
          {t.references.addBtn}
        </Button>
      </div>

      {/* Search */}
      <Input
        placeholder={t.references.searchPlaceholder}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        leftIcon={<Search size={16} />}
        rightIcon={
          search ? (
            <button onClick={() => setSearch('')}>
              <X size={14} className="text-gray-400 hover:text-white" />
            </button>
          ) : undefined
        }
      />

      {/* Tag filters */}
      {allTags.length > 0 && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {allTags.slice(0, 12).map((tag) => (
            <button
              key={tag}
              onClick={() => toggleTagFilter(tag)}
              className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                !tagFilter.includes(tag) ? 'bg-white/5 text-gray-400 hover:bg-white/10' : ''
              }`}
            style={tagFilter.includes(tag) ? { background: 'var(--accent-primary)', color: '#fff' } : undefined}
            >
              {tag}
            </button>
          ))}
          {tagFilter.length > 0 && (
            <button
              onClick={() => setTagFilter([])}
              className="flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20"
            >
              {t.references.clearFilters}
            </button>
          )}
        </div>
      )}

      {/* Grid */}
      {isLoading ? (
        <div className="columns-2 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="skeleton mb-3"
              style={{ height: `${Math.random() * 80 + 120}px` }}
            />
          ))}
        </div>
      ) : references.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-4">
            <BookImage size={28} className="text-emerald-400" />
          </div>
          <h3 className="font-semibold text-white mb-2">{t.references.emptyTitle}</h3>
          <p className="text-sm text-gray-500 mb-5 max-w-[220px]">
            {t.references.emptyDesc}
          </p>
          <Button variant="primary" onClick={openAddModal} leftIcon={<Plus size={16} />}>
            {t.references.emptyCta}
          </Button>
        </motion.div>
      ) : (
        <div className="columns-2 gap-3">
          <AnimatePresence>
            {references.map((ref) => (
              <div key={ref.id} className="break-inside-avoid mb-3">
                <ReferenceCard
                  reference={ref}
                  onDelete={(id) => deleteMutation.mutate(id)}
                  onEdit={openEditModal}
                />
              </div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => { setAddModalOpen(false); setEditRef(null); }}
        title={editRef ? t.references.editModal : t.references.addModal}
        size="md"
      >
        <div className="space-y-4">
          {/* Image input mode toggle (add mode only) */}
          {!editRef && (
            <div className="flex rounded-xl overflow-hidden border border-[var(--border-default)] p-1 gap-1">
              <button
                onClick={() => setUploadMode('upload')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors ${
                  uploadMode !== 'upload' ? 'text-gray-400 hover:text-white' : 'text-white'
                }`}
                style={uploadMode === 'upload' ? { background: 'var(--accent-primary)' } : undefined}
              >
                <ImageIcon size={14} />
                {t.references.uploadImage}
              </button>
              <button
                onClick={() => setUploadMode('url')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors ${
                  uploadMode !== 'url' ? 'text-gray-400 hover:text-white' : 'text-white'
                }`}
                style={uploadMode === 'url' ? { background: 'var(--accent-primary)' } : undefined}
              >
                <Link2 size={14} />
                {t.references.fromUrl}
              </button>
            </div>
          )}

          {/* Image */}
          {uploadMode === 'upload' && !editRef ? (
            <ImageUpload
              value={form.imageUrl}
              onChange={(url) => setForm((p) => ({ ...p, imageUrl: url }))}
              onClear={() => setForm((p) => ({ ...p, imageUrl: '' }))}
              aspectRatio="video"
            />
          ) : (
            <Input
              label={t.references.imageUrl}
              placeholder="https://example.com/image.jpg"
              value={form.imageUrl}
              onChange={(e) => setForm((p) => ({ ...p, imageUrl: e.target.value }))}
              error={errors.imageUrl}
            />
          )}

          <Input
            label={t.references.titleLabel}
            placeholder={t.references.titlePlaceholder}
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            error={errors.title}
            required
          />

          <Input
            label={t.references.sourceUrl}
            placeholder={t.references.sourcePlaceholder}
            value={form.sourceUrl}
            onChange={(e) => setForm((p) => ({ ...p, sourceUrl: e.target.value }))}
          />

          <Input
            label={t.references.tagsLabel}
            placeholder={t.references.tagsPlaceholder}
            value={form.tags}
            onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value }))}
            hint={t.references.tagsHint}
          />

          <Textarea
            label={t.references.notesLabel}
            placeholder={t.references.notesPlaceholder}
            value={form.notes}
            onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
            rows={2}
          />

          {/* Link to project */}
          {projects.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{t.references.linkProject}</label>
              <select
                value={form.linkedProjectId}
                onChange={(e) => setForm((p) => ({ ...p, linkedProjectId: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border text-sm focus:outline-none"
                style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
              >
                <option value="">{t.references.none}</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => { setAddModalOpen(false); setEditRef(null); }}
            >
              {t.references.cancel}
            </Button>
            <Button
              variant="primary"
              fullWidth
              loading={createMutation.isPending || updateMutation.isPending}
              onClick={handleSubmit}
            >
              {editRef ? t.references.saveChanges : t.references.addRef}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
