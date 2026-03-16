'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Eye } from 'lucide-react';
import { StarDisplay } from '@/components/ui/StarRating';
import { TagList } from '@/components/ui/Badge';
import { cn, getInitials, truncate } from '@/lib/utils';
import type { CommunityPost } from '@/types';

interface CommunityCardProps {
  post: CommunityPost;
  onClick?: () => void;
  className?: string;
}

export default function CommunityCard({ post, onClick, className }: CommunityCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [hovered, setHovered] = useState(false);

  const authorName = post.isAnonymous ? 'Anonymous' : post.user?.name || 'Unknown';
  const authorAvatar = post.isAnonymous ? null : (post.user?.avatar || post.user?.image);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
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
      {/* Image */}
      <div className="relative overflow-hidden" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
        {!imageLoaded && (
          <div className="absolute inset-0 animate-pulse aspect-[4/3]" style={{ backgroundColor: 'var(--bg-tertiary)' }} />
        )}
        <img
          src={post.imageUrl}
          alt={post.title}
          className={cn(
            'w-full object-cover transition-transform duration-300 group-hover:scale-105',
            imageLoaded ? 'opacity-100' : 'opacity-0'
          )}
          style={{ aspectRatio: '4/3' }}
          onLoad={() => setImageLoaded(true)}
        />

        {/* Hover overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: hovered ? 1 : 0 }}
          className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-3"
        >
          <div className="flex items-center gap-2 text-white/80 text-xs">
            <div className="flex items-center gap-1">
              <MessageCircle size={12} />
              <span>{post._count?.comments || 0}</span>
            </div>
            <div className="flex items-center gap-1">
              <Eye size={12} />
              <span>View</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Content */}
      <div className="p-3">
        <p className="text-sm font-medium line-clamp-1 mb-1" style={{ color: 'var(--text-primary)' }}>
          {post.title}
        </p>

        {/* Rating */}
        <StarDisplay
          value={post.averageRating}
          count={post.ratingCount}
          size="sm"
          className="mb-2"
        />

        {post.tags.length > 0 && (
          <TagList tags={post.tags} maxVisible={3} className="mb-2" />
        )}

        {/* Author */}
        <div className="flex items-center gap-2 pt-2" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          {authorAvatar ? (
            <img
              src={authorAvatar}
              alt={authorName}
              className="w-5 h-5 rounded-full object-cover"
            />
          ) : (
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center text-white text-2xs font-bold"
              style={{ background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))' }}
            >
              {getInitials(authorName)}
            </div>
          )}
          <span className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>{authorName}</span>
        </div>
      </div>
    </motion.div>
  );
}
