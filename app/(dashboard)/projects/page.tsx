'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  LayoutGrid,
  Calendar,
  FolderKanban,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import ProjectCard from '@/components/cards/ProjectCard';
import { Badge } from '@/components/ui/Badge';
import useToast from '@/lib/hooks/use-toast';
import { cn, getStatusLabel, formatDate } from '@/lib/utils';
import type { Project, ProjectStatus } from '@/types';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';

const STATUSES: ProjectStatus[] = ['PLANNING', 'IN_PROGRESS', 'REVIEW', 'COMPLETED'];

const statusColors: Record<ProjectStatus, string> = {
  PLANNING: 'border-blue-500/30',
  IN_PROGRESS: 'border-indigo-500/30',
  REVIEW: 'border-amber-500/30',
  COMPLETED: 'border-green-500/30',
};

export default function ProjectsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const toast = useToast();

  const [view, setView] = useState<'kanban' | 'calendar'>('kanban');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [form, setForm] = useState({ title: '', description: '', deadline: '' });
  const [errors, setErrors] = useState<{ title?: string }>({});

  const { data, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => fetch('/api/projects').then((r) => r.json()),
  });

  const projects: Project[] = data?.data || [];

  const createMutation = useMutation({
    mutationFn: (body: any) =>
      fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).then((r) => r.json()),
    onSuccess: (data) => {
      if (data.error) { toast.error(data.error); return; }
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project created!');
      setAddModalOpen(false);
      setForm({ title: '', description: '', deadline: '' });
      router.push(`/projects/${data.data.id}`);
    },
    onError: () => toast.error('Failed to create project'),
  });

  const handleCreate = () => {
    if (!form.title.trim()) { setErrors({ title: 'Title is required' }); return; }
    createMutation.mutate({
      title: form.title,
      description: form.description || undefined,
      deadline: form.deadline || undefined,
    });
  };

  // Kanban columns
  const projectsByStatus = STATUSES.reduce((acc, status) => {
    acc[status] = projects.filter((p) => p.status === status);
    return acc;
  }, {} as Record<ProjectStatus, Project[]>);

  // Calendar data
  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(calendarDate),
    end: endOfMonth(calendarDate),
  });

  const projectsWithDeadline = projects.filter((p) => p.deadline);

  const getProjectsForDay = (day: Date) =>
    projectsWithDeadline.filter((p) => isSameDay(new Date(p.deadline!), day));

  const startDayOfWeek = startOfMonth(calendarDate).getDay();

  return (
    <div className="py-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Projects</h1>
          <p className="text-xs text-gray-500 mt-0.5">{projects.length} total projects</p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-xl p-1 gap-1">
            <button
              onClick={() => setView('kanban')}
              className={cn('p-1.5 rounded-lg transition-colors', view !== 'kanban' && 'text-gray-400')}
              style={view === 'kanban' ? { background: 'var(--accent-primary)', color: '#fff' } : undefined}
            >
              <LayoutGrid size={14} />
            </button>
            <button
              onClick={() => setView('calendar')}
              className={cn('p-1.5 rounded-lg transition-colors', view !== 'calendar' && 'text-gray-400')}
              style={view === 'calendar' ? { background: 'var(--accent-primary)', color: '#fff' } : undefined}
            >
              <Calendar size={14} />
            </button>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setAddModalOpen(true)}
            leftIcon={<Plus size={14} />}
          >
            New
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton h-32 rounded-2xl" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-4">
            <FolderKanban size={28} className="text-indigo-400" />
          </div>
          <h3 className="font-semibold text-white mb-2">No projects yet</h3>
          <p className="text-sm text-gray-500 mb-5 max-w-[220px]">
            Create your first project to start managing your design work.
          </p>
          <Button variant="primary" onClick={() => setAddModalOpen(true)} leftIcon={<Plus size={16} />}>
            Create Project
          </Button>
        </motion.div>
      ) : view === 'kanban' ? (
        // Kanban view
        <div className="space-y-6">
          {STATUSES.map((status) => {
            const statusProjects = projectsByStatus[status];
            if (statusProjects.length === 0 && status === 'COMPLETED') return null;

            return (
              <div key={status}>
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className={cn('w-2 h-2 rounded-full', {
                      'bg-blue-500': status === 'PLANNING',
                      'bg-amber-500': status === 'REVIEW',
                      'bg-green-500': status === 'COMPLETED',
                    })}
                    style={status === 'IN_PROGRESS' ? { background: 'var(--accent-primary)' } : undefined}
                  />
                  <h2 className="text-sm font-semibold text-gray-300">{getStatusLabel(status)}</h2>
                  <span className="text-xs text-gray-600 ml-1">
                    {statusProjects.length}
                  </span>
                </div>
                {statusProjects.length === 0 ? (
                  <div
                    className={cn(
                      'rounded-2xl border-2 border-dashed h-16 flex items-center justify-center',
                      statusColors[status].replace('border-', 'border-')
                    )}
                    style={{ borderColor: 'rgba(255,255,255,0.04)' }}
                  >
                    <span className="text-xs text-gray-600">No projects</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <AnimatePresence>
                      {statusProjects.map((project) => (
                        <ProjectCard
                          key={project.id}
                          project={project}
                          onClick={() => router.push(`/projects/${project.id}`)}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        // Calendar view
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-2xl overflow-hidden">
          {/* Calendar header */}
          <div className="flex items-center justify-between p-4 border-b border-[var(--border-default)]">
            <button
              onClick={() => setCalendarDate(subMonths(calendarDate, 1))}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <h2 className="text-sm font-semibold text-white">
              {format(calendarDate, 'MMMM yyyy')}
            </h2>
            <button
              onClick={() => setCalendarDate(addMonths(calendarDate, 1))}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Day names */}
          <div className="grid grid-cols-7 border-b border-[var(--border-default)]">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="p-2 text-center text-2xs font-medium text-gray-600">
                {day}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7">
            {/* Empty cells for start of month */}
            {Array.from({ length: startDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="h-12 border-r border-b border-[var(--border-default)]" />
            ))}

            {daysInMonth.map((day) => {
              const dayProjects = getProjectsForDay(day);
              const isToday = isSameDay(day, new Date());

              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    'h-12 p-1 border-r border-b border-[var(--border-default)] relative',
                    !isSameMonth(day, calendarDate) && 'opacity-30'
                  )}
                >
                  <span
                    className={cn(
                      'text-xs font-medium flex items-center justify-center w-6 h-6 rounded-full',
                      !isToday && 'text-gray-400'
                    )}
                    style={isToday ? { background: 'var(--accent-primary)', color: '#fff' } : undefined}
                  >
                    {format(day, 'd')}
                  </span>
                  {dayProjects.length > 0 && (
                    <div className="absolute bottom-1 left-1 right-1 flex gap-0.5">
                      {dayProjects.slice(0, 3).map((p) => (
                        <div
                          key={p.id}
                          onClick={() => router.push(`/projects/${p.id}`)}
                          className="h-1 flex-1 rounded-full cursor-pointer"
                          style={{
                            background: p.status === 'COMPLETED' ? '#22c55e' :
                              p.status === 'REVIEW' ? '#f59e0b' :
                              p.status === 'IN_PROGRESS' ? 'var(--accent-primary)' : '#3b82f6'
                          }}
                          title={p.title}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="p-3 border-t border-[var(--border-default)] flex items-center gap-4 flex-wrap">
            {STATUSES.map((status) => (
              <div key={status} className="flex items-center gap-1.5">
                <div
                  className={cn('w-2 h-2 rounded-full', {
                    'bg-blue-500': status === 'PLANNING',
                    'bg-amber-500': status === 'REVIEW',
                    'bg-green-500': status === 'COMPLETED',
                  })}
                  style={status === 'IN_PROGRESS' ? { background: 'var(--accent-primary)' } : undefined}
                />
                <span className="text-2xs text-gray-500">{getStatusLabel(status)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create modal */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="New Project"
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Project Title"
            placeholder="e.g. Brand Identity Redesign"
            value={form.title}
            onChange={(e) => { setForm((p) => ({ ...p, title: e.target.value })); setErrors({}); }}
            error={errors.title}
            required
            autoFocus
          />
          <Textarea
            label="Description"
            placeholder="What's this project about?"
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            rows={3}
          />
          <Input
            label="Deadline"
            type="date"
            value={form.deadline}
            onChange={(e) => setForm((p) => ({ ...p, deadline: e.target.value }))}
            className="[color-scheme:dark]"
          />
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" fullWidth onClick={() => setAddModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              fullWidth
              loading={createMutation.isPending}
              onClick={handleCreate}
            >
              Create Project
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
