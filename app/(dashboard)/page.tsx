'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FolderKanban,
  BookImage,
  Users,
  LayoutTemplate,
  Plus,
  ArrowRight,
  Sparkles,
  Star,
  TrendingUp,
} from 'lucide-react';
import ProjectCard from '@/components/cards/ProjectCard';
import { Button } from '@/components/ui/Button';
import WorkflowBanner from '@/components/workflow/WorkflowBanner';
import { cn, formatDate } from '@/lib/utils';
import Modal from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import useToast from '@/lib/hooks/use-toast';
import { useRouter } from 'next/navigation';
import type { Project } from '@/types';

interface DashboardData {
  stats: {
    projectsCount: number;
    referencesCount: number;
    communityPostsCount: number;
    portfolioItemsCount: number;
  };
  upcomingDeadlines: any[];
  recentProjects: Project[];
  recentReferences: any[];
  recentFeedback: any[];
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const toast = useToast();
  const router = useRouter();

  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [newProjectDeadline, setNewProjectDeadline] = useState('');
  const [creatingProject, setCreatingProject] = useState(false);

  const { data, isLoading, refetch } = useQuery<{ data: DashboardData }>({
    queryKey: ['dashboard'],
    queryFn: () => fetch('/api/dashboard').then((r) => r.json()),
  });

  const dashboard = data?.data;
  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const createQuickProject = async () => {
    if (!newProjectTitle.trim()) return;
    setCreatingProject(true);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newProjectTitle,
          ...(newProjectDeadline ? { deadline: newProjectDeadline } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('Project created!');
      setQuickAddOpen(false);
      setNewProjectTitle('');
      setNewProjectDeadline('');
      refetch();
      router.push(`/projects/${data.data.id}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to create project');
    } finally {
      setCreatingProject(false);
    }
  };

  const statCards = [
    {
      label: 'Active Projects',
      value: dashboard?.stats.projectsCount ?? 0,
      icon: FolderKanban,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10',
      href: '/projects',
    },
    {
      label: 'References',
      value: dashboard?.stats.referencesCount ?? 0,
      icon: BookImage,
      color: 'text-violet-400',
      bg: 'bg-violet-500/10',
      href: '/references',
    },
    {
      label: 'Community',
      value: dashboard?.stats.communityPostsCount ?? 0,
      icon: Users,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      href: '/community',
    },
    {
      label: 'Portfolio',
      value: dashboard?.stats.portfolioItemsCount ?? 0,
      icon: LayoutTemplate,
      color: 'text-green-400',
      bg: 'bg-green-500/10',
      href: '/portfolio',
    },
  ];

  return (
    <div className="py-4 space-y-6">
      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="pt-2"
      >
        <p className="text-sm text-gray-400">{greeting()},</p>
        <h1 className="text-2xl font-bold text-white mt-0.5">
          {session?.user?.name?.split(' ')[0] || 'Designer'}
        </h1>
        <p className="text-xs text-gray-500 mt-1">{formatDate(new Date(), 'EEEE, MMMM d')}</p>
      </motion.div>

      {/* D-day strip */}
      <AnimatePresence>
        {(dashboard?.upcomingDeadlines?.length ?? 0) > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 pb-0.5"
          >
            {dashboard!.upcomingDeadlines.map((project) => {
              const diffDays = Math.ceil(
                (new Date(project.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
              );
              const isUrgent = diffDays <= 1;
              const isWarning = diffDays <= 3 && diffDays > 1;
              const label = diffDays === 0 ? 'D-day' : `D-${diffDays}`;
              return (
                <Link key={project.id} href={`/projects/${project.id}`}>
                  <motion.div
                    whileTap={{ scale: 0.96 }}
                    className="flex-shrink-0 flex items-center gap-2 rounded-xl px-3 py-2 border"
                    style={{
                      background: isUrgent
                        ? 'rgba(239,68,68,0.07)'
                        : isWarning
                        ? 'rgba(245,158,11,0.07)'
                        : 'rgba(var(--accent-primary-rgb),0.06)',
                      borderColor: isUrgent
                        ? 'rgba(239,68,68,0.25)'
                        : isWarning
                        ? 'rgba(245,158,11,0.25)'
                        : 'rgba(var(--accent-primary-rgb),0.2)',
                    }}
                  >
                    <span
                      className="text-xs font-bold tabular-nums"
                      style={{
                        color: isUrgent ? '#ef4444' : isWarning ? '#f59e0b' : 'var(--accent-primary)',
                      }}
                    >
                      {label}
                    </span>
                    <span className="text-xs text-gray-400 max-w-[96px] truncate">
                      {project.title}
                    </span>
                  </motion.div>
                </Link>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Workflow banner */}
      <WorkflowBanner
        steps={[
          { status: (dashboard?.stats.referencesCount ?? 0) > 0 ? 'completed' : 'active' },
          { status: (dashboard?.stats.referencesCount ?? 0) > 0 ? ((dashboard?.stats.projectsCount ?? 0) > 0 ? 'completed' : 'active') : 'pending' },
          { status: (dashboard?.stats.projectsCount ?? 0) > 0 ? 'active' : 'pending' },
          { status: (dashboard?.stats.communityPostsCount ?? 0) > 0 ? 'completed' : 'pending' },
          { status: (dashboard?.stats.portfolioItemsCount ?? 0) > 0 ? 'completed' : 'pending' },
        ]}
      />

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Link href={stat.href}>
              <div className="bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-2xl p-4 hover:border-white/10 transition-all hover:-translate-y-0.5 active:scale-[0.98]">
                <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center mb-3', stat.bg)}>
                  <stat.icon size={16} className={stat.color} />
                </div>
                <div className="text-2xl font-bold text-white">
                  {isLoading ? (
                    <div className="h-7 w-10 bg-white/5 animate-pulse rounded-lg" />
                  ) : (
                    stat.value
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>


      {/* Recent Projects */}
      {(dashboard?.recentProjects?.length ?? 0) > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <TrendingUp size={14} className="text-indigo-400" />
              Recent Projects
            </h2>
            <Link href="/projects">
              <button className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                See all <ArrowRight size={12} />
              </button>
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1 -mx-4 px-4">
            {dashboard!.recentProjects.map((project) => (
              <div key={project.id} className="flex-shrink-0 w-[220px]">
                <ProjectCard
                  project={project}
                  compact
                  onClick={() => router.push(`/projects/${project.id}`)}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recent References */}
      {(dashboard?.recentReferences?.length ?? 0) > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <BookImage size={14} className="text-violet-400" />
              Recent References
            </h2>
            <Link href="/references">
              <button className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                See all <ArrowRight size={12} />
              </button>
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {dashboard!.recentReferences.slice(0, 6).map((ref) => (
              <Link key={ref.id} href="/references">
                <div className="aspect-square rounded-xl overflow-hidden bg-[var(--bg-tertiary)]">
                  <img
                    src={ref.imageUrl}
                    alt={ref.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform"
                  />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Recent Feedback */}
      {(dashboard?.recentFeedback?.length ?? 0) > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Star size={14} className="text-amber-400" />
              Recent Feedback
            </h2>
            <Link href="/community">
              <button className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                See all <ArrowRight size={12} />
              </button>
            </Link>
          </div>
          <div className="space-y-2">
            {dashboard!.recentFeedback.map((post) => (
              <Link key={post.id} href={`/community/${post.id}`}>
                <div className="flex items-center gap-3 bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-xl p-3 hover:border-white/10 transition-all">
                  <img
                    src={post.imageUrl}
                    alt={post.title}
                    className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{post.title}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Star size={11} className="text-amber-400 fill-amber-400" />
                      <span className="text-xs text-gray-400">
                        {post.averageRating > 0 ? post.averageRating.toFixed(1) : 'No ratings'}
                        {post.ratingCount > 0 && ` (${post.ratingCount})`}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {!isLoading && dashboard?.stats.projectsCount === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12"
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 flex items-center justify-center mx-auto mb-4">
            <Sparkles size={28} className="text-indigo-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Start your design journey</h3>
          <p className="text-sm text-gray-400 mb-6 max-w-[240px] mx-auto">
            Create your first project or collect some references to get started.
          </p>
          <div className="flex gap-3 justify-center">
            <Button
              variant="primary"
              onClick={() => setQuickAddOpen(true)}
              leftIcon={<Plus size={16} />}
            >
              New Project
            </Button>
            <Link href="/references">
              <Button variant="secondary">
                Add Reference
              </Button>
            </Link>
          </div>
        </motion.div>
      )}

      {/* Floating action button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setQuickAddOpen(true)}
        className="fixed right-4 w-12 h-12 rounded-2xl text-white flex items-center justify-center z-30"
        style={{ bottom: 'calc(64px + env(safe-area-inset-bottom, 0px) + 12px)', background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', boxShadow: '0 0 20px rgba(var(--accent-primary-rgb),0.35)' }}
      >
        <Plus size={22} strokeWidth={2.5} />
      </motion.button>

      {/* Quick add modal */}
      <Modal
        isOpen={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
        title="Quick Add"
        description="Create a new project quickly"
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label="Project name"
            placeholder="e.g. Brand Identity Redesign"
            value={newProjectTitle}
            onChange={(e) => setNewProjectTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && createQuickProject()}
            autoFocus
          />
          <Input
            label="Deadline (optional)"
            type="date"
            value={newProjectDeadline}
            onChange={(e) => setNewProjectDeadline(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
          />
          <div className="flex gap-3">
            <Button
              variant="primary"
              fullWidth
              loading={creatingProject}
              onClick={createQuickProject}
            >
              Create Project
            </Button>
            <Link href="/references" onClick={() => setQuickAddOpen(false)}>
              <Button variant="secondary">
                Add Reference
              </Button>
            </Link>
          </div>
        </div>
      </Modal>
    </div>
  );
}
