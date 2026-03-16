'use client';

import { cn } from '@/lib/utils';

type BadgeVariant =
  | 'default'
  | 'indigo'
  | 'violet'
  | 'green'
  | 'amber'
  | 'red'
  | 'blue'
  | 'gray'
  | 'planning'
  | 'in_progress'
  | 'review'
  | 'completed';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  className?: string;
  onClick?: () => void;
  icon?: React.ReactNode;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-white/10 text-white/70 border-white/10',
  indigo: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/20',
  violet: 'bg-violet-500/15 text-violet-400 border-violet-500/20',
  green: 'bg-green-500/15 text-green-400 border-green-500/20',
  amber: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  red: 'bg-red-500/15 text-red-400 border-red-500/20',
  blue: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  gray: 'bg-gray-500/15 text-gray-400 border-gray-500/20',
  planning: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  in_progress: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/20',
  review: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  completed: 'bg-green-500/15 text-green-400 border-green-500/20',
};

const sizeStyles = {
  sm: 'px-2 py-0.5 text-2xs rounded-md',
  md: 'px-2.5 py-1 text-xs rounded-lg',
};

export function Badge({
  children,
  variant = 'default',
  size = 'md',
  className,
  onClick,
  icon,
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-medium border',
        variantStyles[variant],
        sizeStyles[size],
        onClick && 'cursor-pointer hover:opacity-80 transition-opacity',
        className
      )}
      onClick={onClick}
    >
      {icon && <span className="text-current">{icon}</span>}
      {children}
    </span>
  );
}

export function TagList({
  tags,
  maxVisible = 3,
  size = 'sm',
  className,
}: {
  tags: string[];
  maxVisible?: number;
  size?: 'sm' | 'md';
  className?: string;
}) {
  const visible = tags.slice(0, maxVisible);
  const remaining = tags.length - maxVisible;

  return (
    <div className={cn('flex flex-wrap gap-1', className)}>
      {visible.map((tag) => (
        <Badge key={tag} variant="indigo" size={size}>
          {tag}
        </Badge>
      ))}
      {remaining > 0 && (
        <Badge variant="gray" size={size}>
          +{remaining}
        </Badge>
      )}
    </div>
  );
}

export default Badge;
