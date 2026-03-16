'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
  pressed?: boolean;
  variant?: 'default' | 'surface' | 'glass';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const variantStyles = {
  default: 'bg-[var(--bg-secondary)] border border-[var(--border-default)]',
  surface: 'bg-[var(--bg-tertiary)] border border-white/5',
  glass: 'bg-white/5 border border-white/10 backdrop-blur-md',
};

const paddingStyles = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      hoverable = false,
      pressed = false,
      variant = 'default',
      padding = 'none',
      className,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-2xl overflow-hidden',
          variantStyles[variant],
          paddingStyles[padding],
          hoverable && [
            'cursor-pointer transition-all duration-200',
            'hover:-translate-y-0.5 hover:shadow-card-hover hover:border-white/10',
          ],
          pressed && 'active:scale-[0.98]',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => (
  <div className={cn('p-4 pb-0', className)} {...props}>
    {children}
  </div>
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => (
  <div className={cn('p-4', className)} {...props}>
    {children}
  </div>
);

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => (
  <div
    className={cn('p-4 pt-0 flex items-center gap-3', className)}
    {...props}
  >
    {children}
  </div>
);

export default Card;
