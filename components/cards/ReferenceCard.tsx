'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Link2, MoreVertical, Trash2, Edit2, FolderKanban } from 'lucide-react';
import { TagList } from '@/components/ui/Badge';
import { cn, formatRelativeDate, truncate } from '@/lib/utils';
import type { Reference } from '@/types';

interface ReferenceCardProps {
  reference: Reference;
  onClick?: () => void;
  onDelete?: (id: string) => void;
  onEdit?: (reference: Reference) => void;
  className?: string;
}

export default function ReferenceCard({
  reference,
  onClick,
  onDelete,
  onEdit,
  className,
}: ReferenceCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        'group relative rounded-xl overflow-hidden',
        'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover',
        onClick && 'cursor-pointer',
        className
      )}
      style={{
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border-default)',
      }}
      onClick={onClick}
    >
      {/* Image */}
      <div className="relative overflow-hidden" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
        {!imageLoaded && (
          <div className="absolute inset-0 animate-pulse" style={{ backgroundColor: 'var(--bg-tertiary)' }} />
        )}
        <img
          src={reference.imageUrl}
          alt={reference.title}
          className={cn(
            'w-full object-cover transition-all duration-300 group-hover:scale-105',
            imageLoaded ? 'opacity-100' : 'opacity-0'
          )}
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageLoaded(true)}
        />

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-200 flex items-start justify-end p-2 gap-1 opacity-0 group-hover:opacity-100">
          {reference.sourceUrl && (
            <a
              href={reference.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="p-1.5 rounded-lg bg-black/50 text-white hover:bg-black/70 transition-colors"
            >
              <ExternalLink size={13} />
            </a>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
            className="p-1.5 rounded-lg bg-black/50 text-white hover:bg-black/70 transition-colors"
          >
            <MoreVertical size={13} />
          </button>
        </div>

        {/* Dropdown menu */}
        {menuOpen && (
          <div
            className="absolute top-8 right-2 rounded-xl shadow-xl z-10 overflow-hidden min-w-[140px]"
            style={{
              backgroundColor: 'var(--bg-overlay)',
              border: '1px solid var(--border-default)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {onEdit && (
              <button
                onClick={() => { onEdit(reference); setMenuOpen(false); }}
                className="flex items-center gap-2 w-full px-3 py-2.5 text-sm hover:bg-white/5 transition-colors"
                style={{ color: 'var(--text-secondary)' }}
              >
                <Edit2 size={14} />
                Edit
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => { onDelete(reference.id); setMenuOpen(false); }}
                className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <Trash2 size={14} />
                Delete
              </button>
            )}
          </div>
        )}

        {/* Click outside to close menu */}
        {menuOpen && (
          <div
            className="fixed inset-0 z-[5]"
            onClick={(e) => { e.stopPropagation(); setMenuOpen(false); }}
          />
        )}
      </div>

      {/* Content */}
      <div className="p-2.5">
        <p className="text-xs font-medium leading-snug line-clamp-2 mb-1.5" style={{ color: 'var(--text-primary)' }}>
          {reference.title}
        </p>

        {reference.tags.length > 0 && (
          <TagList tags={reference.tags} maxVisible={2} size="sm" className="mb-1.5" />
        )}

        <div className="flex items-center justify-between">
          <span className="text-2xs" style={{ color: 'var(--text-muted)' }}>
            {formatRelativeDate(reference.createdAt)}
          </span>
          {reference.linkedProject && (
            <div className="flex items-center gap-1 text-2xs" style={{ color: 'var(--accent-primary)' }}>
              <FolderKanban size={10} />
              <span className="truncate max-w-[80px]">{reference.linkedProject.title}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
