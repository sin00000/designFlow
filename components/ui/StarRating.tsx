'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  value?: number;
  maxStars?: number;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onChange?: (value: number) => void;
  showValue?: boolean;
  className?: string;
}

const sizeMap = {
  sm: 12,
  md: 16,
  lg: 22,
};

export default function StarRating({
  value = 0,
  maxStars = 5,
  size = 'md',
  interactive = false,
  onChange,
  showValue = false,
  className,
}: StarRatingProps) {
  const [hovered, setHovered] = useState<number | null>(null);

  const displayValue = hovered !== null ? hovered : value;
  const starSize = sizeMap[size];

  return (
    <div className={cn('flex items-center gap-0.5', className)}>
      {Array.from({ length: maxStars }, (_, i) => {
        const starValue = i + 1;
        const isFilled = starValue <= displayValue;
        const isPartial = !isFilled && starValue - 0.5 <= displayValue;

        return (
          <button
            key={i}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onChange?.(starValue)}
            onMouseEnter={() => interactive && setHovered(starValue)}
            onMouseLeave={() => interactive && setHovered(null)}
            className={cn(
              'transition-all duration-100',
              interactive
                ? 'cursor-pointer hover:scale-125 active:scale-110'
                : 'cursor-default',
              !interactive && 'pointer-events-none'
            )}
          >
            <Star
              size={starSize}
              className={cn(
                'transition-colors duration-100',
                isFilled
                  ? 'fill-amber-400 text-amber-400'
                  : isPartial
                  ? 'fill-amber-400/50 text-amber-400/50'
                  : 'fill-transparent text-gray-600',
                interactive && hovered !== null && starValue <= hovered
                  ? 'fill-amber-400 text-amber-400'
                  : ''
              )}
            />
          </button>
        );
      })}
      {showValue && value > 0 && (
        <span className="ml-1 text-sm text-gray-400 font-medium">
          {value.toFixed(1)}
        </span>
      )}
    </div>
  );
}

export function StarDisplay({
  value,
  count,
  size = 'sm',
  className,
}: {
  value: number;
  count?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  return (
    <div className={cn('flex items-center gap-1', className)}>
      <StarRating value={value} size={size} />
      <span className="text-xs text-gray-400">
        {value > 0 ? value.toFixed(1) : '—'}
        {count !== undefined && count > 0 && (
          <span className="text-gray-600 ml-1">({count})</span>
        )}
      </span>
    </div>
  );
}
