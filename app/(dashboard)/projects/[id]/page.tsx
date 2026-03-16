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
  Share2,
  LayoutTemplate,
  Images,
  Trash2,
  Check,
  Circle,
  Clock,
  ChevronDown,
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
import { StarDisplay } from '@/components/ui/StarRating';
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

type Tab = 'tasks' | 'references' | 'work' | 'share';

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<Tab>('tasks');
  const [addTaskOpen, setAddTaskOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [portfolioModalOpen, setPortfolioModalOpen] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: '', priority: 'MEDIUM' as Priority });
  const [shareForm, setShareForm] = useState({
    title: '',
    description: '',
    tags: '',
    isAnonymous: false,
    imageUrl: '',
  });
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
      toast.success('Task added');
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
      toast.success('Work image added!');
    },
  });

  const shareToCommMutation = useMutation({
    mutationFn: (body: any) =>
      fetch('/api/community', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).then((r) => r.json()),
    onSuccess: (data) => {
      if (data.error) { toast.error(data.error); return; }
      toast.success('Shared to community!');
      setShareModalOpen(false);
      router.push(`/community/${data.data.id}`);
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
      toast.success('Added to portfolio!');
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

  const handleShareSubmit = () => {
    if (!shareForm.title.trim() || !shareForm.imageUrl) {
      toast.error('Title and image are required');
      return;
    }
    shareToCommMutation.mutate({
      ...shareForm,
      tags: shareForm.tags.split(',').map((t) => t.trim()).filter(Boolean),
      projectId: id,
    });
  };

  const handlePortfolioSubmit = () => {
    if (!portfolioForm.title.trim()) {
      toast.error('Title is required');
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
        <Loader2 size={24} className="animate-spin text-indigo-400" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="py-4 text-center">
        <p className="text-gray-400">Project not found</p>
        <Button variant="ghost" onClick={() => router.push('/projects')} className="mt-4">
          Back to Projects
        </Button>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: React.ElementType; count?: number }[] = [
    { id: 'tasks', label: 'Tasks', icon: CheckSquare, count: project.tasks?.length },
    { id: 'references', label: 'References', icon: BookImage, count: project.references?.length },
    { id: 'work', label: 'Work', icon: Images, count: project.workImages?.length },
    { id: 'share', label: 'Share', icon: Share2 },
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
            <span className="text-xs text-gray-400">Progress</span>
            <span className="text-xs font-semibold text-white">{project.progress}%</span>
          </div>
          <ProgressBar value={project.progress} size="md" showLabel={false} />
          <input
            type="range"
            min="0"
            max="100"
            value={project.progress}
            onChange={(e) => updateProjectMutation.mutate({ progress: parseInt(e.target.value) })}
            className="w-full mt-2 accent-indigo-500 cursor-pointer"
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

      {/* Workflow CTAs */}
      <div className="flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          fullWidth
          onClick={() => setShareModalOpen(true)}
          leftIcon={<Share2 size={14} />}
        >
          Share to Community
        </Button>
        {project.status === 'COMPLETED' && !project.portfolioItem && (
          <Button
            variant="primary"
            size="sm"
            fullWidth
            onClick={() => {
              setPortfolioForm({ title: project.title, description: project.description || '', tags: '', isPublic: false });
              setPortfolioModalOpen(true);
            }}
            leftIcon={<LayoutTemplate size={14} />}
          >
            To Portfolio
          </Button>
        )}
        {project.portfolioItem && (
          <Link href="/portfolio" className="flex-1">
            <Button variant="secondary" size="sm" fullWidth leftIcon={<LayoutTemplate size={14} />}>
              View Portfolio
            </Button>
          </Link>
        )}
      </div>

      {/* Community posts from this project */}
      {(project.communityPosts?.length ?? 0) > 0 && (
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-2xl p-3">
          <p className="text-xs font-medium text-gray-400 mb-2">Community posts</p>
          {project.communityPosts!.map((post) => (
            <Link key={post.id} href={`/community/${post.id}`}>
              <div className="flex items-center gap-3 py-2 hover:bg-white/3 rounded-xl px-1 transition-colors">
                <img src={post.imageUrl} alt={post.title} className="w-10 h-10 rounded-lg object-cover" />
                <div>
                  <p className="text-sm text-white">{post.title}</p>
                  <StarDisplay value={post.averageRating} count={post.ratingCount} size="sm" />
                </div>
              </div>
            </Link>
          ))}
        </div>
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
                ? 'bg-indigo-500 text-white'
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
                  Add Task
                </Button>
              </div>

              {project.tasks?.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CheckSquare size={24} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No tasks yet</p>
                </div>
              ) : (
                Object.entries(tasksByStatus).map(([status, tasks]) =>
                  tasks.length > 0 ? (
                    <div key={status}>
                      <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">
                        {status === 'TODO' ? 'To Do' : status === 'IN_PROGRESS' ? 'In Progress' : 'Done'}
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
                                  ? 'border-indigo-500'
                                  : 'border-gray-600 hover:border-gray-400'
                              )}
                            >
                              {task.status === 'DONE' && <Check size={12} className="text-white" strokeWidth={3} />}
                              {task.status === 'IN_PROGRESS' && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />}
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
                              {task.priority.charAt(0) + task.priority.slice(1).toLowerCase()}
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
              <div className="flex justify-end">
                <Link href={`/references?project=${id}`}>
                  <Button variant="secondary" size="sm" leftIcon={<Plus size={14} />}>
                    Link More
                  </Button>
                </Link>
              </div>
              {(project.references?.length ?? 0) === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <BookImage size={24} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No references linked</p>
                  <p className="text-xs mt-1">Go to References tab and link them to this project</p>
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
                placeholder="Upload work in progress..."
                aspectRatio="video"
              />
              {(project.workImages?.length ?? 0) === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  <p className="text-sm">No work images yet</p>
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

          {/* Share tab */}
          {activeTab === 'share' && (
            <div className="space-y-4">
              <div className="bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-2xl p-4 space-y-3">
                <h3 className="text-sm font-semibold text-white">Share to Community</h3>
                <p className="text-xs text-gray-400">
                  Get feedback from the design community. You can share anonymously.
                </p>
                <Button
                  variant="primary"
                  fullWidth
                  onClick={() => setShareModalOpen(true)}
                  leftIcon={<Share2 size={16} />}
                >
                  Share to Community
                </Button>
              </div>

              {project.status === 'COMPLETED' && (
                <div className="bg-gradient-to-r from-indigo-500/10 to-violet-500/10 border border-indigo-500/20 rounded-2xl p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-white">Add to Portfolio</h3>
                  <p className="text-xs text-gray-400">
                    This project is complete! Showcase it in your portfolio.
                  </p>
                  {project.portfolioItem ? (
                    <Link href="/portfolio">
                      <Button variant="secondary" fullWidth leftIcon={<LayoutTemplate size={16} />}>
                        View in Portfolio
                      </Button>
                    </Link>
                  ) : (
                    <Button
                      variant="primary"
                      fullWidth
                      onClick={() => {
                        setPortfolioForm({
                          title: project.title,
                          description: project.description || '',
                          tags: '',
                          isPublic: false,
                        });
                        setPortfolioModalOpen(true);
                      }}
                      leftIcon={<LayoutTemplate size={16} />}
                    >
                      Convert to Portfolio
                    </Button>
                  )}
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
        title="Add Task"
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label="Task title"
            placeholder="e.g. Create wireframes"
            value={taskForm.title}
            onChange={(e) => setTaskForm((p) => ({ ...p, title: e.target.value }))}
            onKeyDown={(e) => e.key === 'Enter' && createTaskMutation.mutate(taskForm)}
            autoFocus
            required
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-300">Priority</label>
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
                  {p.charAt(0) + p.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={() => setAddTaskOpen(false)}>
              Cancel
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
              Add Task
            </Button>
          </div>
        </div>
      </Modal>

      {/* Share to community modal */}
      <Modal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        title="Share to Community"
        size="md"
      >
        <div className="space-y-4">
          <ImageUpload
            value={shareForm.imageUrl}
            onChange={(url) => setShareForm((p) => ({ ...p, imageUrl: url }))}
            onClear={() => setShareForm((p) => ({ ...p, imageUrl: '' }))}
            aspectRatio="video"
            placeholder="Add a preview image of your work"
          />
          <Input
            label="Title"
            placeholder="e.g. Brand Identity Exploration"
            value={shareForm.title}
            onChange={(e) => setShareForm((p) => ({ ...p, title: e.target.value }))}
            required
          />
          <Textarea
            label="Description"
            placeholder="Tell people about your work and what feedback you're looking for..."
            value={shareForm.description}
            onChange={(e) => setShareForm((p) => ({ ...p, description: e.target.value }))}
            rows={3}
          />
          <Input
            label="Tags"
            placeholder="ui, branding, minimal"
            value={shareForm.tags}
            onChange={(e) => setShareForm((p) => ({ ...p, tags: e.target.value }))}
          />
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={shareForm.isAnonymous}
              onChange={(e) => setShareForm((p) => ({ ...p, isAnonymous: e.target.checked }))}
              className="w-4 h-4 rounded accent-indigo-500"
            />
            <div>
              <p className="text-sm text-white">Post anonymously</p>
              <p className="text-xs text-gray-500">Your name won't be shown</p>
            </div>
          </label>
          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={() => setShareModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              fullWidth
              loading={shareToCommMutation.isPending}
              onClick={handleShareSubmit}
            >
              Share Work
            </Button>
          </div>
        </div>
      </Modal>

      {/* Portfolio modal */}
      <Modal
        isOpen={portfolioModalOpen}
        onClose={() => setPortfolioModalOpen(false)}
        title="Add to Portfolio"
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Portfolio Title"
            value={portfolioForm.title}
            onChange={(e) => setPortfolioForm((p) => ({ ...p, title: e.target.value }))}
            required
          />
          <Textarea
            label="Description"
            value={portfolioForm.description}
            onChange={(e) => setPortfolioForm((p) => ({ ...p, description: e.target.value }))}
            rows={3}
          />
          <Input
            label="Tags"
            placeholder="branding, ui, typography"
            value={portfolioForm.tags}
            onChange={(e) => setPortfolioForm((p) => ({ ...p, tags: e.target.value }))}
          />
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={portfolioForm.isPublic}
              onChange={(e) => setPortfolioForm((p) => ({ ...p, isPublic: e.target.checked }))}
              className="w-4 h-4 rounded accent-indigo-500"
            />
            <div>
              <p className="text-sm text-white">Make public</p>
              <p className="text-xs text-gray-500">Anyone can view this portfolio item</p>
            </div>
          </label>
          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={() => setPortfolioModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              fullWidth
              loading={createPortfolioMutation.isPending}
              onClick={handlePortfolioSubmit}
            >
              Add to Portfolio
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
