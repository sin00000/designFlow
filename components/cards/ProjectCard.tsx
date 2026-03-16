'use client';

import { motion } from 'framer-motion';
import { Calendar, BookImage, CheckSquare } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { cn, formatDeadline, getStatusLabel } from '@/lib/utils';
import type { Project } from '@/types';

interface ProjectCardProps {
  project: Project;
  onClick?: () => void;
  compact?: boolean;
  className?: string;
}

function CircularProgress({ value, size = 40 }: { value: number; size?: number }) {
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(Math.max(value, 0), 100) / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center flex-shrink-0" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        style={{ transform: 'rotate(-90deg)', position: 'absolute', inset: 0 }}
      >
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--border-subtle)"
          strokeWidth={strokeWidth}
        />
        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--accent-primary)"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      {/* Percentage label */}
      <span className="text-[9px] font-semibold relative z-10 leading-none" style={{ color: 'var(--text-secondary)' }}>
        {value}%
      </span>
    </div>
  );
}

export default function ProjectCard({
  project,
  onClick,
  compact = false,
  className,
}: ProjectCardProps) {
  const isOverdue = project.deadline
    ? new Date(project.deadline) < new Date() && project.status !== 'COMPLETED'
    : false;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        'rounded-2xl overflow-hidden',
        'transition-all duration-200 hover:-translate-y-0.5',
        onClick && 'cursor-pointer',
        className
      )}
      style={{
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border-default)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      {/* Cover image or accent bar */}
      {project.coverImage ? (
        <div className="h-24 overflow-hidden">
          <img
            src={project.coverImage}
            alt={project.title}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div
          className="h-1 w-full opacity-70"
          style={{ background: 'linear-gradient(to right, var(--accent-primary), var(--accent-secondary))' }}
        />
      )}

      <div className="p-4">
        {/* Title row with circular progress */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm leading-snug line-clamp-2" style={{ color: 'var(--text-primary)' }}>
              {project.title}
            </h3>
            {!compact && project.description && (
              <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--text-muted)' }}>
                {project.description}
              </p>
            )}
          </div>
          <CircularProgress value={project.progress} size={compact ? 36 : 40} />
        </div>

        {/* Status badge */}
        <div className="mb-3">
          <Badge variant={project.status.toLowerCase() as any} size="sm">
            {getStatusLabel(project.status)}
          </Badge>
        </div>

        {/* Meta row */}
        <div className="flex items-center justify-between text-2xs" style={{ color: 'var(--text-muted)' }}>
          <div className="flex items-center gap-3">
            {(project._count?.references ?? 0) > 0 && (
              <div className="flex items-center gap-1">
                <BookImage size={11} />
                <span>{project._count?.references}</span>
              </div>
            )}
            {(project._count?.tasks ?? 0) > 0 && (
              <div className="flex items-center gap-1">
                <CheckSquare size={11} />
                <span>{project._count?.tasks}</span>
              </div>
            )}
          </div>

          {project.deadline && (
            <div
              className={cn(
                'flex items-center gap-1',
                isOverdue ? 'text-red-400' : ''
              )}
              style={isOverdue ? {} : { color: 'var(--text-muted)' }}
            >
              <Calendar size={11} />
              <span>{formatDeadline(project.deadline)}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
