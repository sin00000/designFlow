'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Lock, ExternalLink, Pencil, Share2, X, Video, Image as ImageIcon, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Portfolio } from '@/types';

interface PortfolioCardProps {
  item: Portfolio;
  onClick?: () => void;
  onEdit?: () => void;
  onShare?: () => void;
  className?: string;
  showBubble?: boolean;
}

export default function PortfolioCard({
  item,
  onClick,
  onEdit,
  onShare,
  className,
  showBubble = true,
}: PortfolioCardProps) {
  const [bubbleOpen, setBubbleOpen] = useState(false);

  const handleCardClick = () => {
    if (showBubble) {
      setBubbleOpen((v) => !v);
    }
    onClick?.();
  };

  return (
    <div className="relative">
      <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleCardClick}
        className={cn(
          'group relative rounded-2xl overflow-hidden',
          'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover',
          (onClick || showBubble) && 'cursor-pointer',
          bubbleOpen ? 'ring-2 ring-green-500/60' : '',
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
        ) : item.videoUrl ? (
          <div
            className="aspect-video flex items-center justify-center relative"
            style={{ background: `linear-gradient(135deg, ${item.coverColor}33, ${item.coverColor}11)` }}
          >
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
              <Play size={18} className="text-white ml-0.5" />
            </div>
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

        <div className="p-3">
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <h3 className="font-semibold text-xs leading-snug line-clamp-2 flex-1" style={{ color: 'var(--text-primary)' }}>
              {item.title}
            </h3>
            <div
              className={cn(
                'flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0',
                item.isPublic
                  ? 'bg-green-500/10 text-green-400'
                  : 'bg-gray-500/10 text-gray-500'
              )}
            >
              {item.isPublic ? <Globe size={9} /> : <Lock size={9} />}
            </div>
          </div>

          {item.tags.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {item.tags.slice(0, 2).map((tag) => (
                <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/5 text-gray-500">{tag}</span>
              ))}
            </div>
          )}

          {(onEdit || onShare) && (
            <div className="flex items-center gap-2 mt-2 pt-2" style={{ borderTop: '1px solid var(--border-subtle)' }}>
              {onEdit && (
                <button
                  onClick={(e) => { e.stopPropagation(); onEdit(); }}
                  className="flex items-center gap-1.5 text-xs hover:bg-white/5 transition-colors px-2 py-1 rounded-lg"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <Pencil size={11} />
                  편집
                </button>
              )}
              {item.isPublic && onShare && (
                <button
                  onClick={(e) => { e.stopPropagation(); onShare(); }}
                  className="flex items-center gap-1.5 text-xs transition-colors px-2 py-1 rounded-lg ml-auto"
                  style={{ color: 'var(--accent-primary)' }}
                >
                  <ExternalLink size={11} />
                  공유
                </button>
              )}
            </div>
          )}
        </div>
      </motion.div>

      {/* Speech bubble */}
      <AnimatePresence>
        {bubbleOpen && showBubble && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setBubbleOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 8 }}
              transition={{ type: 'spring', damping: 20, stiffness: 400 }}
              className="absolute left-0 right-0 z-50 mt-2 rounded-2xl p-4 shadow-2xl"
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-default)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
              }}
            >
              <div
                className="absolute -top-2 left-6 w-4 h-4 rotate-45"
                style={{ background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-default)', borderLeft: '1px solid var(--border-default)' }}
              />
              <button
                onClick={() => setBubbleOpen(false)}
                className="absolute top-3 right-3 p-1 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-white/5"
              >
                <X size={12} />
              </button>
              <h3 className="text-sm font-bold text-white pr-6 mb-1">{item.title}</h3>
              {item.description && (
                <p className="text-xs text-gray-400 leading-relaxed mb-3">{item.description}</p>
              )}
              {(item.videoUrl || item.linkUrl) && (
                <div className="flex gap-2 mb-3">
                  {item.videoUrl && (
                    <span className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400">
                      <Video size={9} /> 동영상
                    </span>
                  )}
                  {item.linkUrl && (
                    <a
                      href={item.linkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-blue-500/10 text-blue-400"
                    >
                      <ExternalLink size={9} /> 링크
                    </a>
                  )}
                </div>
              )}
              {item.tags.length > 0 && (
                <div className="flex gap-1 flex-wrap">
                  {item.tags.map((tag) => (
                    <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-gray-500">{tag}</span>
                  ))}
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
