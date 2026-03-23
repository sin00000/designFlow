'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  label?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  animated?: boolean;
  className?: string;
}

const sizeMap = {
  sm: 'h-1',
  md: 'h-1.5',
  lg: 'h-2.5',
};

const variantMap = {
  default: 'from-green-600 to-emerald-500',
  success: 'from-green-500 to-emerald-500',
  warning: 'from-amber-500 to-orange-500',
  danger: 'from-red-500 to-rose-500',
};

function getVariantFromValue(value: number): 'default' | 'success' | 'warning' | 'danger' {
  if (value >= 100) return 'success';
  if (value >= 70) return 'default';
  if (value >= 40) return 'warning';
  return 'danger';
}

export default function ProgressBar({
  value,
  max = 100,
  size = 'md',
  showLabel = false,
  label,
  variant,
  animated = true,
  className,
}: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const resolvedVariant = variant || getVariantFromValue(percentage);

  return (
    <div className={cn('w-full', className)}>
      {(showLabel || label) && (
        <div className="flex items-center justify-between mb-1.5">
          {label && <span className="text-xs text-gray-400">{label}</span>}
          {showLabel && (
            <span className="text-xs font-medium text-gray-300 ml-auto">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      <div
        className={cn(
          'w-full bg-white/5 rounded-full overflow-hidden',
          sizeMap[size]
        )}
      >
        <motion.div
          className={cn(
            'h-full rounded-full',
            resolvedVariant !== 'default' && `bg-gradient-to-r ${variantMap[resolvedVariant]}`
          )}
          style={resolvedVariant === 'default' ? {
            background: 'linear-gradient(to right, var(--accent-primary), var(--accent-secondary))'
          } : undefined}
          initial={animated ? { width: 0 } : { width: `${percentage}%` }}
          animate={{ width: `${percentage}%` }}
          transition={{
            duration: 0.8,
            ease: [0.4, 0, 0.2, 1],
            delay: 0.1,
          }}
        />
      </div>
    </div>
  );
}
