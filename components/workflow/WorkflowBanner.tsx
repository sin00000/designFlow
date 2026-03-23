'use client';

import { motion } from 'framer-motion';
import { BookImage, Lightbulb, PenTool, LayoutTemplate } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/i18n';

export type WorkflowStepStatus = 'completed' | 'active' | 'pending';

export interface WorkflowStep {
  id: string;
  label: string;
  icon: React.ElementType;
  status: WorkflowStepStatus;
}

interface WorkflowBannerProps {
  steps?: { status: WorkflowStepStatus }[];
  className?: string;
}

export default function WorkflowBanner({ steps, className }: WorkflowBannerProps) {
  const t = useT();

  const defaultSteps: WorkflowStep[] = [
    { id: 'reference', label: t.workflow.reference, icon: BookImage,      status: 'pending' },
    { id: 'concept',   label: t.workflow.concept,   icon: Lightbulb,     status: 'pending' },
    { id: 'design',    label: t.workflow.design,    icon: PenTool,       status: 'pending' },
    { id: 'portfolio', label: t.workflow.portfolio, icon: LayoutTemplate, status: 'pending' },
  ];

  const mergedSteps: WorkflowStep[] = defaultSteps.map((s, i) => ({
    ...s,
    status: steps?.[i]?.status ?? s.status,
  }));

  const completedCount = mergedSteps.filter((s) => s.status === 'completed').length;
  const overallProgress = Math.round((completedCount / mergedSteps.length) * 100);

  return (
    <div className={cn('bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-2xl p-4', className)}>
      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          {t.workflow.title}
        </h3>
        <span className="text-xs font-medium" style={{ color: 'var(--accent-primary)' }}>
          {overallProgress}% {t.workflow.complete}
        </span>
      </div>

      {/* Steps */}
      <div className="flex items-start">
        {mergedSteps.map((step, index) => {
          const Icon = step.icon;
          const isCompleted = step.status === 'completed';
          const isActive = step.status === 'active';
          const isLast = index === mergedSteps.length - 1;

          return (
            <div key={step.id} className="flex items-center flex-1 min-w-0">
              {/* Step node */}
              <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                <motion.div
                  animate={{ scale: isActive ? 1.1 : 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  className="relative w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300"
                  style={
                    isCompleted
                      ? { background: 'rgba(34,197,94,0.15)', border: '1.5px solid rgba(34,197,94,0.4)' }
                      : isActive
                      ? {
                          background: 'rgba(var(--accent-primary-rgb), 0.15)',
                          border: '1.5px solid rgba(var(--accent-primary-rgb), 0.5)',
                          boxShadow: '0 0 12px rgba(var(--accent-primary-rgb), 0.25)',
                        }
                      : { background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(255,255,255,0.06)' }
                  }
                >
                  <Icon
                    size={14}
                    className={cn(
                      isCompleted ? 'text-green-400' : isActive ? '' : 'text-gray-600'
                    )}
                    style={isActive ? { color: 'var(--accent-primary)' } : undefined}
                  />
                </motion.div>

                {/* Label */}
                <p
                  className={cn(
                    'text-[9px] font-medium leading-none text-center',
                    isCompleted ? 'text-green-400' : isActive ? 'text-white' : 'text-gray-600'
                  )}
                >
                  {step.label}
                </p>
              </div>

              {/* Connector line */}
              {!isLast && (
                <div className="flex-1 mx-1 mt-[-14px]">
                  <div
                    className="h-px w-full rounded-full transition-all duration-500"
                    style={
                      isCompleted
                        ? { background: 'rgba(34,197,94,0.35)' }
                        : { background: 'rgba(255,255,255,0.06)' }
                    }
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
