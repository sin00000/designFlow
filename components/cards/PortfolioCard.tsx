'use client';

import { motion } from 'framer-motion';
import { Globe, Lock, ExternalLink, Pencil } from 'lucide-react';
import { TagList } from '@/components/ui/Badge';
import { cn, truncate } from '@/lib/utils';
import type { Portfolio } from '@/types';

interface PortfolioCardProps {
  item: Portfolio;
  onClick?: () => void;
  onEdit?: () => void;
  onShare?: () => void;
  className?: string;
}

export default function PortfolioCard({
  item,
  onClick,
  onEdit,
  onShare,
  className,
}: PortfolioCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        'group relative rounded-2xl overflow-hidden',
        'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover',
        onClick && 'cursor-pointer',
        className
      )}
      style={{
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border-default)',
      }}
    >
      {/* Cover */}
      {item.imageUrl ? (
        <div className="aspect-video overflow-hidden">
          <img
            src={item.imageUrl}
            alt={item.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      ) : (
        <div
          className="aspect-video flex items-center justify-center"
          style={{
            background: `linear-gradient(135deg, ${item.coverColor}33 0%, ${item.coverColor}22 100%)`,
          }}
        >
          <div
            className="text-3xl font-bold opacity-30"
            style={{ color: item.coverColor }}
          >
            {item.title.charAt(0).toUpperCase()}
          </div>
        </div>
      )}

      <div className="p-4">
        {/* Title + visibility */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-sm leading-snug line-clamp-2 flex-1" style={{ color: 'var(--text-primary)' }}>
            {item.title}
          </h3>
          <div
            className={cn(
              'flex items-center gap-1 text-xs px-2 py-0.5 rounded-full flex-shrink-0',
              item.isPublic
                ? 'bg-green-500/10 text-green-400'
                : 'bg-gray-500/10 text-gray-500'
            )}
          >
            {item.isPublic ? <Globe size={10} /> : <Lock size={10} />}
            <span>{item.isPublic ? 'Public' : 'Private'}</span>
          </div>
        </div>

        {item.description && (
          <p className="text-xs line-clamp-2 mb-2" style={{ color: 'var(--text-secondary)' }}>
            {item.description}
          </p>
        )}

        {item.tags.length > 0 && (
          <TagList tags={item.tags} maxVisible={3} className="mb-3" />
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          {onEdit && (
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              className="flex items-center gap-1.5 text-xs hover:bg-white/5 transition-colors px-2 py-1 rounded-lg"
              style={{ color: 'var(--text-secondary)' }}
            >
              <Pencil size={12} />
              Edit
            </button>
          )}
          {item.isPublic && onShare && (
            <button
              onClick={(e) => { e.stopPropagation(); onShare(); }}
              className="flex items-center gap-1.5 text-xs transition-colors px-2 py-1 rounded-lg ml-auto"
              style={{ color: 'var(--accent-primary)' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = `rgba(var(--accent-primary-rgb),0.1)`; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            >
              <ExternalLink size={12} />
              Share
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
