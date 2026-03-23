'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Plus,
  CheckSquare,
  BookImage,
  LayoutTemplate,
  Images,
  Trash2,
  Check,
  Loader2,
  Flag,
  Upload,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import ProgressBar from '@/components/ui/ProgressBar';
import { Badge } from '@/components/ui/Badge';
import ImageUpload from '@/components/ui/ImageUpload';
import useToast from '@/lib/hooks/use-toast';
import {
  cn,
  formatDate,
  formatDeadline,
  getStatusColor,
  getStatusLabel,
  getPriorityColor,
} from '@/lib/utils';
import type { Project, Task, TaskStatus, Priority, ProjectStatus } from '@/types';
import { useT } from '@/lib/i18n';

type Tab = 'tasks' | 'references' | 'work';

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const toast = useToast();
  const t = useT();

  const [activeTab, setActiveTab] = useState<Tab>('tasks');
  const [addTaskOpen, setAddTaskOpen] = useState(false);
  const [portfolioModalOpen, setPortfolioModalOpen] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: '', priority: 'MEDIUM' as Priority });
  const [portfolioForm, setPortfolioForm] = useState({
    title: '',
    description: '',
    tags: '',
    isPublic: false,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: () => fetch(`/api/projects/${id}`).then((r) => r.json()),
  });

  const project: Project | undefined = data?.data;

  const updateProjectMutation = useMutation({
    mutationFn: (body: any) =>
      fetch(`/api/projects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: (body: any) =>
      fetch(`/api/projects/${id}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).then((r) => r.json()),
    onSuccess: (data) => {
      if (data.error) { toast.error(data.error); return; }
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      toast.success(t.projectDetail.taskAdded);
      setAddTaskOpen(false);
      setTaskForm({ title: '', priority: 'MEDIUM' });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: (body: any) =>
      fetch(`/api/projects/${id}/tasks`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).then((r) => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['project', id] }),
  });

  const uploadWorkImageMutation = useMutation({
    mutationFn: (imageUrl: string) =>
      fetch(`/api/projects/${id}/work-images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl }),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      toast.success(t.projectDetail.workImageAdded);
    },
  });

  const createPortfolioMutation = useMutation({
    mutationFn: (body: any) =>
      fetch('/api/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).then((r) => r.json()),
    onSuccess: (data) => {
      if (data.error) { toast.error(data.error); return; }
      toast.success(t.portfolio.added);
      setPortfolioModalOpen(false);
      router.push('/portfolio');
    },
  });

  const toggleTaskStatus = (task: Task) => {
    const nextStatus: Record<TaskStatus, TaskStatus> = {
      TODO: 'IN_PROGRESS',
      IN_PROGRESS: 'DONE',
      DONE: 'TODO',
    };
    updateTaskMutation.mutate({
      taskId: task.id,
      status: nextStatus[task.status],
    });
  };

  const handlePortfolioSubmit = () => {
    if (!portfolioForm.title.trim()) {
      toast.error(t.portfolio.titleRequired);
      return;
    }
    createPortfolioMutation.mutate({
      ...portfolioForm,
      tags: portfolioForm.tags.split(',').map((t) => t.trim()).filter(Boolean),
      projectId: id,
      imageUrl: project?.coverImage || project?.workImages?.[0]?.imageUrl,
    });
  };

  if (isLoading) {
    return (
      <div className="py-4 flex justify-center items-center min-h-[300px]">
        <Loader2 size={24} className="animate-spin text-green-500" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="py-4 text-center">
        <p className="text-gray-400">{t.projectDetail.notFound}</p>
        <Button variant="ghost" onClick={() => router.push('/projects')} className="mt-4">
          {t.projectDetail.backToProjects}
        </Button>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: React.ElementType; count?: number }[] = [
    { id: 'tasks', label: t.projectDetail.tabTasks, icon: CheckSquare, count: project.tasks?.length },
    { id: 'references', label: t.projectDetail.tabReferences, icon: BookImage, count: project.references?.length },
    { id: 'work', label: t.projectDetail.tabProgress, icon: Images, count: project.workImages?.length },
  ];

  const tasksByStatus = {
    TODO: project.tasks?.filter((t) => t.status === 'TODO') || [],
    IN_PROGRESS: project.tasks?.filter((t) => t.status === 'IN_PROGRESS') || [],
    DONE: project.tasks?.filter((t) => t.status === 'DONE') || [],
  };

  return (
    <div className="py-4 space-y-4">
      {/* Back + header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push('/projects')}
          className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-white truncate">{project.title}</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={cn('text-xs px-2 py-0.5 rounded-full border', getStatusColor(project.status))}>
              {getStatusLabel(project.status)}
            </span>
            {project.deadline && (
              <span className="text-xs text-gray-500">{formatDeadline(project.deadline)}</span>
            )}
          </div>
        </div>
      </div>

      {/* Project overview card */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-2xl p-4 space-y-3">
        {project.description && (
          <p className="text-sm text-gray-400">{project.description}</p>
        )}

        {/* Progress slider */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400">{t.projectDetail.progress}</span>
            <span className="text-xs font-semibold text-white">{project.progress}%</span>
          </div>
          <ProgressBar value={project.progress} size="md" showLabel={false} />
          <input
            type="range"
            min="0"
            max="100"
            value={project.progress}
            onChange={(e) => updateProjectMutation.mutate({ progress: parseInt(e.target.value) })}
            className="w-full mt-2 accent-green-600 cursor-pointer"
            style={{ height: '2px' }}
          />
        </div>

        {/* Status selector */}
        <div className="flex gap-2 flex-wrap">
          {(['PLANNING', 'IN_PROGRESS', 'REVIEW', 'COMPLETED'] as ProjectStatus[]).map((s) => (
            <button
              key={s}
              onClick={() => updateProjectMutation.mutate({ status: s })}
              className={cn(
                'text-xs px-2.5 py-1 rounded-lg border transition-colors',
                project.status === s
                  ? getStatusColor(s)
                  : 'border-white/5 text-gray-600 hover:text-gray-400'
              )}
            >
              {getStatusLabel(s)}
            </button>
          ))}
        </div>
      </div>

      {/* Portfolio CTA */}
      {project.status === 'COMPLETED' && !project.portfolioItem && (
        <div className="bg-gradient-to-r from-green-600/10 to-emerald-500/10 border border-green-500/20 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-green-600/20 flex items-center justify-center flex-shrink-0">
            <LayoutTemplate size={16} className="text-green-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white">{t.projectDetail.projectComplete}</p>
            <p className="text-xs text-gray-400">{t.projectDetail.convertSubtitle}</p>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setPortfolioForm({ title: project.title, description: project.description || '', tags: '', isPublic: false });
              setPortfolioModalOpen(true);
            }}
          >
            {t.projectDetail.convert}
          </Button>
        </div>
      )}

      {project.portfolioItem && (
        <Link href="/portfolio">
          <div className="flex items-center gap-3 bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-2xl p-3 hover:border-green-600/30 transition-colors">
            <LayoutTemplate size={15} className="text-green-500 flex-shrink-0" />
            <p className="text-sm text-gray-300 flex-1">{t.projectDetail.alreadyInPortfolio}</p>
            <span className="text-xs text-green-500">{t.projectDetail.viewPortfolio}</span>
          </div>
        </Link>
      )}

      {/* Tabs */}
      <div className="flex bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-2xl p-1 gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium transition-all',
              activeTab === tab.id
                ? 'bg-green-600 text-white'
                : 'text-gray-500 hover:text-gray-300'
            )}
          >
            <tab.icon size={13} />
            <span>{tab.label}</span>
            {tab.count !== undefined && tab.count > 0 && (
              <span className={cn(
                'text-2xs px-1.5 py-0.5 rounded-full',
                activeTab === tab.id ? 'bg-white/20' : 'bg-white/5'
              )}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.15 }}
        >
          {/* Tasks tab */}
          {activeTab === 'tasks' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setAddTaskOpen(true)}
                  leftIcon={<Plus size={14} />}
                >
                  {t.projectDetail.addTask}
                </Button>
              </div>

              {project.tasks?.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CheckSquare size={24} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">{t.projectDetail.noTasks}</p>
                </div>
              ) : (
                Object.entries(tasksByStatus).map(([status, tasks]) =>
                  tasks.length > 0 ? (
                    <div key={status}>
                      <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">
                        {status === 'TODO' ? t.projectDetail.taskStatusTodo : status === 'IN_PROGRESS' ? t.projectDetail.taskStatusInProgress : t.projectDetail.taskStatusDone}
                        <span className="ml-2 text-gray-600">{tasks.length}</span>
                      </p>
                      <div className="space-y-2">
                        {tasks.map((task) => (
                          <motion.div
                            key={task.id}
                            layout
                            className={cn(
                              'flex items-start gap-3 bg-[var(--bg-secondary)] border rounded-xl p-3 transition-colors',
                              task.status === 'DONE'
                                ? 'border-green-500/10 bg-green-500/3'
                                : 'border-[var(--border-default)]'
                            )}
                          >
                            <button
                              onClick={() => toggleTaskStatus(task)}
                              className={cn(
                                'mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all',
                                task.status === 'DONE'
                                  ? 'bg-green-500 border-green-500'
                                  : task.status === 'IN_PROGRESS'
                                  ? 'border-green-600'
                                  : 'border-gray-600 hover:border-gray-400'
                              )}
                            >
                              {task.status === 'DONE' && <Check size={12} className="text-white" strokeWidth={3} />}
                              {task.status === 'IN_PROGRESS' && <div className="w-1.5 h-1.5 rounded-full bg-green-600" />}
                            </button>
                            <div className="flex-1 min-w-0">
                              <p className={cn(
                                'text-sm text-white',
                                task.status === 'DONE' && 'line-through text-gray-500'
                              )}>
                                {task.title}
                              </p>
                              {task.description && (
                                <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{task.description}</p>
                              )}
                            </div>
                            <span className={cn(
                              'text-2xs px-1.5 py-0.5 rounded-md border flex-shrink-0',
                              getPriorityColor(task.priority)
                            )}>
                              {task.priority === 'LOW' ? t.projectDetail.priorityLow : task.priority === 'MEDIUM' ? t.projectDetail.priorityMedium : t.projectDetail.priorityHigh}
                            </span>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  ) : null
                )
              )}
            </div>
          )}

          {/* References tab */}
          {activeTab === 'references' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">{t.projectDetail.referencesCount(project.references?.length || 0)}</p>
                <Link href={`/references?project=${id}`}>
                  <Button variant="secondary" size="sm" leftIcon={<Plus size={14} />}>
                    {t.projectDetail.addReference}
                  </Button>
                </Link>
              </div>
              {(project.references?.length ?? 0) === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <BookImage size={24} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">{t.projectDetail.noReferencesDesc}</p>
                  <p className="text-xs mt-1 text-gray-600">{t.projectDetail.refLinkHint}</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {project.references!.map((ref) => (
                    <div key={ref.id} className="rounded-xl overflow-hidden bg-[var(--bg-tertiary)] aspect-video">
                      <img src={ref.imageUrl} alt={ref.title} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Work Progress tab */}
          {activeTab === 'work' && (
            <div className="space-y-3">
              <ImageUpload
                onChange={(url) => uploadWorkImageMutation.mutate(url)}
                placeholder={t.projectDetail.uploadProgress}
                aspectRatio="video"
              />
              {(project.workImages?.length ?? 0) === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  <p className="text-sm">{t.projectDetail.noWorkImages}</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {project.workImages!.map((img) => (
                    <div key={img.id} className="rounded-xl overflow-hidden bg-[var(--bg-tertiary)] aspect-video">
                      <img src={img.imageUrl} alt="Work" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Add task modal */}
      <Modal
        isOpen={addTaskOpen}
        onClose={() => setAddTaskOpen(false)}
        title={t.projectDetail.addTask}
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label={t.projectDetail.taskTitleLabel}
            placeholder={t.projectDetail.taskTitlePlaceholder}
            value={taskForm.title}
            onChange={(e) => setTaskForm((p) => ({ ...p, title: e.target.value }))}
            onKeyDown={(e) => e.key === 'Enter' && createTaskMutation.mutate(taskForm)}
            autoFocus
            required
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-300">{t.projectDetail.priority}</label>
            <div className="flex gap-2">
              {(['LOW', 'MEDIUM', 'HIGH'] as Priority[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setTaskForm((prev) => ({ ...prev, priority: p }))}
                  className={cn(
                    'flex-1 py-2 rounded-xl text-xs font-medium border transition-colors',
                    taskForm.priority === p
                      ? getPriorityColor(p)
                      : 'border-[var(--border-default)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  )}
                >
                  {p === 'LOW' ? t.projectDetail.priorityLow : p === 'MEDIUM' ? t.projectDetail.priorityMedium : t.projectDetail.priorityHigh}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={() => setAddTaskOpen(false)}>
              {t.projectDetail.cancel}
            </Button>
            <Button
              variant="primary"
              fullWidth
              loading={createTaskMutation.isPending}
              onClick={() => {
                if (!taskForm.title.trim()) return;
                createTaskMutation.mutate(taskForm);
              }}
            >
              {t.common.add}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Portfolio modal */}
      <Modal
        isOpen={portfolioModalOpen}
        onClose={() => setPortfolioModalOpen(false)}
        title={t.projectDetail.portfolioModalTitle}
        size="md"
      >
        <div className="space-y-4">
          <Input
            label={t.projectDetail.portfolioTitleLabel}
            value={portfolioForm.title}
            onChange={(e) => setPortfolioForm((p) => ({ ...p, title: e.target.value }))}
            required
          />
          <Textarea
            label={t.projectDetail.portfolioDescLabel}
            value={portfolioForm.description}
            onChange={(e) => setPortfolioForm((p) => ({ ...p, description: e.target.value }))}
            rows={3}
          />
          <Input
            label={t.projectDetail.portfolioTagsLabel}
            placeholder="branding, ui, typography"
            value={portfolioForm.tags}
            onChange={(e) => setPortfolioForm((p) => ({ ...p, tags: e.target.value }))}
          />
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={portfolioForm.isPublic}
              onChange={(e) => setPortfolioForm((p) => ({ ...p, isPublic: e.target.checked }))}
              className="w-4 h-4 rounded accent-green-600"
            />
            <div>
              <p className="text-sm text-white">{t.projectDetail.portfolioPublic}</p>
              <p className="text-xs text-gray-500">{t.projectDetail.portfolioPublicDesc}</p>
            </div>
          </label>
          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={() => setPortfolioModalOpen(false)}>
              {t.projectDetail.cancel}
            </Button>
            <Button
              variant="primary"
              fullWidth
              loading={createPortfolioMutation.isPending}
              onClick={handlePortfolioSubmit}
            >
              {t.projectDetail.convertToPortfolio}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
