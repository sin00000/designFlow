'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, FolderKanban, ChevronLeft, ChevronRight, Circle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import useToast from '@/lib/hooks/use-toast';
import { cn, getStatusLabel, formatDeadline } from '@/lib/utils';
import type { Project, ProjectStatus } from '@/types';
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  isSameDay, addMonths, subMonths, isToday as dateFnsIsToday,
} from 'date-fns';
import { useT } from '@/lib/i18n';

const STATUS_META: Record<ProjectStatus, { color: string; dot: string }> = {
  PLANNING:    { color: '#3b82f6', dot: 'bg-blue-500' },
  IN_PROGRESS: { color: 'var(--accent-primary)', dot: 'bg-green-600' },
  REVIEW:      { color: '#f59e0b', dot: 'bg-amber-500' },
  COMPLETED:   { color: '#22c55e', dot: 'bg-green-400' },
};

/* ─── Circular progress ─────────────────────────────────── */
function CircularProgress({ value, size = 44 }: { value: number; size?: number }) {
  const sw = 3.5;
  const r = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(Math.max(value, 0), 100) / 100) * circ;
  return (
    <div className="relative flex items-center justify-center flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', position: 'absolute' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border-default)" strokeWidth={sw} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--accent-primary)" strokeWidth={sw}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <span className="text-[9px] font-bold relative z-10" style={{ color: 'var(--text-secondary)' }}>{value}%</span>
    </div>
  );
}

/* ─── Project row ────────────────────────────────────────── */
function ProjectRow({ project, onClick }: { project: Project; onClick: () => void }) {
  const meta = STATUS_META[project.status];
  const isOverdue = project.deadline && new Date(project.deadline) < new Date() && project.status !== 'COMPLETED';

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-3 rounded-2xl cursor-pointer hover:-translate-y-0.5 transition-transform duration-200"
      style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-default)' }}
    >
      {/* Status dot */}
      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: meta.color }} />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{project.title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full" style={{ background: `${meta.color}18`, color: meta.color }}>
            {getStatusLabel(project.status)}
          </span>
          {project.deadline && (
            <span className="text-[10px]" style={{ color: isOverdue ? '#f87171' : 'var(--text-muted)' }}>
              {formatDeadline(project.deadline)}
            </span>
          )}
        </div>
      </div>

      {/* Circular progress */}
      <CircularProgress value={project.progress} />
    </motion.div>
  );
}

/* ─── Main page ──────────────────────────────────────────── */
export default function ProjectsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const toast = useToast();
  const t = useT();

  const [calendarDate, setCalendarDate] = useState(new Date());
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', deadline: '' });
  const [errors, setErrors] = useState<{ title?: string }>({});

  const { data, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => fetch('/api/projects').then((r) => r.json()),
  });

  const projects: Project[] = data?.data || [];

  const createMutation = useMutation({
    mutationFn: (body: any) =>
      fetch('/api/projects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then((r) => r.json()),
    onSuccess: (data) => {
      if (data.error) { toast.error(data.error); return; }
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success(t.projects.created);
      setAddModalOpen(false);
      setForm({ title: '', description: '', deadline: '' });
      router.push(`/projects/${data.data.id}`);
    },
    onError: () => toast.error(t.projects.createFailed),
  });

  const handleCreate = () => {
    if (!form.title.trim()) { setErrors({ title: t.projects.titleRequired }); return; }
    createMutation.mutate({ title: form.title, description: form.description || undefined, deadline: form.deadline || undefined });
  };

  // Calendar
  const daysInMonth = eachDayOfInterval({ start: startOfMonth(calendarDate), end: endOfMonth(calendarDate) });
  const startDayOfWeek = startOfMonth(calendarDate).getDay();
  const projectsWithDeadline = projects.filter((p) => p.deadline);
  const getProjectsForDay = (day: Date) => projectsWithDeadline.filter((p) => isSameDay(new Date(p.deadline!), day));

  // Project groups
  const active = projects.filter((p) => p.status !== 'COMPLETED');
  const completed = projects.filter((p) => p.status === 'COMPLETED');

  return (
    <div className="py-4 space-y-4">
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{t.projects.title}</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{t.projects.count(projects.length)}</p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setAddModalOpen(true)} leftIcon={<Plus size={14} />}>
          {t.projects.newBtn}
        </Button>
      </div>

      {/* ── Calendar ────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl overflow-hidden"
        style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-default)' }}
      >
        {/* Month nav */}
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--border-default)' }}>
          <button onClick={() => setCalendarDate(subMonths(calendarDate, 1))} className="p-1.5 rounded-lg transition-colors hover:bg-white/5" style={{ color: 'var(--text-muted)' }}>
            <ChevronLeft size={15} />
          </button>
          <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            {format(calendarDate, 'yyyy년 M월')}
          </span>
          <button onClick={() => setCalendarDate(addMonths(calendarDate, 1))} className="p-1.5 rounded-lg transition-colors hover:bg-white/5" style={{ color: 'var(--text-muted)' }}>
            <ChevronRight size={15} />
          </button>
        </div>

        {/* Day names */}
        <div className="grid grid-cols-7">
          {['일', '월', '화', '수', '목', '금', '토'].map((d) => (
            <div key={d} className="py-2 text-center text-[10px] font-semibold" style={{ color: 'var(--text-muted)' }}>{d}</div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7">
          {Array.from({ length: startDayOfWeek }).map((_, i) => (
            <div key={`e-${i}`} className="h-11" style={{ borderRight: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }} />
          ))}
          {daysInMonth.map((day) => {
            const dayProjects = getProjectsForDay(day);
            const isToday = dateFnsIsToday(day);
            return (
              <div
                key={day.toISOString()}
                className="h-11 p-1 relative"
                style={{ borderRight: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }}
              >
                <span
                  className="text-[11px] font-medium flex items-center justify-center w-5 h-5 rounded-full mx-auto"
                  style={isToday
                    ? { background: 'var(--accent-primary)', color: '#fff' }
                    : { color: 'var(--text-muted)' }
                  }
                >
                  {format(day, 'd')}
                </span>
                {dayProjects.length > 0 && (
                  <div className="absolute bottom-1 left-1 right-1 flex gap-0.5 justify-center">
                    {dayProjects.slice(0, 3).map((p) => (
                      <button
                        key={p.id}
                        onClick={() => router.push(`/projects/${p.id}`)}
                        className="h-1 flex-1 rounded-full max-w-[12px]"
                        style={{ backgroundColor: STATUS_META[p.status].color }}
                        title={p.title}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Status legend */}
        <div className="flex items-center gap-3 px-4 py-2 flex-wrap" style={{ borderTop: '1px solid var(--border-default)' }}>
          {(Object.entries(STATUS_META) as [ProjectStatus, typeof STATUS_META[ProjectStatus]][]).map(([status, meta]) => (
            <div key={status} className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: meta.color }} />
              <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{getStatusLabel(status)}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Project list ─────────────────────────────────────── */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-16 rounded-2xl" />)}
        </div>
      ) : projects.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-green-500/10 flex items-center justify-center mb-3">
            <FolderKanban size={24} className="text-green-500" />
          </div>
          <h3 className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{t.projects.emptyTitle}</h3>
          <p className="text-sm mb-4 max-w-[200px]" style={{ color: 'var(--text-muted)' }}>{t.projects.emptyDesc}</p>
          <Button variant="primary" size="sm" onClick={() => setAddModalOpen(true)} leftIcon={<Plus size={14} />}>{t.projects.emptyCta}</Button>
        </motion.div>
      ) : (
        <div className="space-y-5">
          {/* Active */}
          {active.length > 0 && (
            <div>
              <p className="text-xs font-semibold mb-2 px-1" style={{ color: 'var(--text-muted)' }}>진행 중 · {active.length}</p>
              <div className="space-y-2">
                <AnimatePresence>
                  {active.map((p) => <ProjectRow key={p.id} project={p} onClick={() => router.push(`/projects/${p.id}`)} />)}
                </AnimatePresence>
              </div>
            </div>
          )}
          {/* Completed */}
          {completed.length > 0 && (
            <div>
              <p className="text-xs font-semibold mb-2 px-1" style={{ color: 'var(--text-muted)' }}>완료 · {completed.length}</p>
              <div className="space-y-2">
                <AnimatePresence>
                  {completed.map((p) => <ProjectRow key={p.id} project={p} onClick={() => router.push(`/projects/${p.id}`)} />)}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Create modal ─────────────────────────────────────── */}
      <Modal isOpen={addModalOpen} onClose={() => { setAddModalOpen(false); setErrors({}); }} title={t.projects.modalTitle} size="md">
        <div className="space-y-4">
          <Input label={t.projects.titleLabel} placeholder={t.projects.titlePlaceholder} value={form.title}
            onChange={(e) => { setForm((p) => ({ ...p, title: e.target.value })); setErrors({}); }}
            error={errors.title} required autoFocus
          />
          <Textarea label={t.projects.descLabel} placeholder={t.projects.descPlaceholder} value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={3}
          />
          <Input label={t.projects.deadlineLabel} type="date" value={form.deadline}
            onChange={(e) => setForm((p) => ({ ...p, deadline: e.target.value }))}
            className="[color-scheme:light]"
          />
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" fullWidth onClick={() => { setAddModalOpen(false); setErrors({}); }}>{t.projects.cancel}</Button>
            <Button variant="primary" fullWidth loading={createMutation.isPending} onClick={handleCreate}>{t.projects.createBtn}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
