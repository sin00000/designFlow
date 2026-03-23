'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  DndContext, closestCenter, PointerSensor, TouchSensor,
  useSensor, useSensors, type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, useSortable, rectSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  LayoutTemplate,
  Share2,
  Link2,
  Globe,
  Lock,
  Pencil,
  Trash2,
  Image as ImageIcon,
  ExternalLink,
  Check,
  X,
  Play,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import ImageUpload from '@/components/ui/ImageUpload';
import useToast from '@/lib/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { Portfolio, Project, PortfolioTemplate, PortfolioMediaItem } from '@/types';
import { useT } from '@/lib/i18n';

/* ─── Fonts ──────────────────────────────────────────────── */
const PORTFOLIO_FONTS: { id: string; name: string; family: string; css: string }[] = [
  { id: 'default',          name: '기본',           family: 'inherit', css: '' },
  { id: 'nanum-myeongjo',   name: '나눔명조',        family: "'Nanum Myeongjo', serif",
    css: "@import url('//fonts.googleapis.com/earlyaccess/nanummyeongjo.css');" },
  { id: 'mona12',           name: 'mona12',          family: "'Mona12', sans-serif",
    css: "@import url('https://cdn.jsdelivr.net/gh/MonadABXY/mona-font/web/mona.css');" },
  { id: 'school-safety',    name: '학교안심 반달',   family: "'SchoolSafetyHalfMoon', sans-serif",
    css: "@font-face{font-family:'SchoolSafetyHalfMoon';src:url('https://cdn.jsdelivr.net/gh/projectnoonnu/2508-2@1.0/HakgyoansimBandalL.woff2') format('woff2');font-weight:normal;font-style:normal;}" },
  { id: 'yoon-cho-woo-san', name: '윤초록우산 만세', family: "'YoonChoWooSan', sans-serif",
    css: "@font-face{font-family:'YoonChoWooSan';src:url('https://cdn.jsdelivr.net/gh/projectnoonnu/2408@1.0/YoonChildfundkoreaManSeh.woff2') format('woff2');font-weight:normal;font-display:swap;}" },
  { id: 'yangjin',          name: '양진체',          family: "'Yangjin', sans-serif",
    css: "@font-face{font-family:'Yangjin';src:url('https://cdn.jsdelivr.net/gh/supernovice-lab/font@0.9/yangjin.woff') format('woff');font-weight:normal;font-display:swap;}" },
];

/* ─── Templates ─────────────────────────────────────────── */
const TEMPLATES: { id: PortfolioTemplate; name: string; description: string; preview: string }[] = [
  { id: 'grid',      name: 'Grid',      description: '핀터레스트 마소너리',      preview: '▦' },
  { id: 'editorial', name: 'Editorial', description: '대형 히어로 + 텍스트',     preview: '▬' },
  { id: 'book',      name: 'Book',      description: '책장 넘기기 방식',         preview: '❐' },
  { id: 'network',   name: 'Network',   description: '3D 시차 연결망',           preview: '⬡' },
];

/* ─── PortfolioItemCard ──────────────────────────────────── */
function PortfolioItemCard({
  item, onEdit, onDelete, onShare, onExpand, template,
}: {
  item: Portfolio; onEdit: () => void; onDelete: () => void; onShare: () => void; onExpand?: () => void; template?: PortfolioTemplate;
}) {
  const [bubbleOpen, setBubbleOpen] = useState(false);
  const [imgExpanded, setImgExpanded] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const t = useT();
  const isEditorial = template === 'editorial';
  const isBook = template === 'book';
  const isNetwork = template === 'network';
  const isMagazineSub = false;

  return (
    <div ref={cardRef} className={cn('relative', isBook ? 'h-full' : '', isNetwork ? 'flex flex-col items-center gap-1.5' : '')}>
      {/* Book: fullscreen overlay (not inside CSS transform) */}
      <AnimatePresence>
        {isBook && imgExpanded && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center p-4 pb-8"
            style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
            onClick={() => setImgExpanded(false)}>
            <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
              transition={{ type: 'spring', damping: 24, stiffness: 260 }}
              className="relative w-full max-w-sm rounded-2xl p-5"
              style={{ backgroundColor: '#ffffff', boxShadow: '0 -4px 40px rgba(0,0,0,0.15)' }}
              onClick={(e) => e.stopPropagation()}>
              <div className="w-8 h-1 rounded-full mb-4 mx-auto" style={{ backgroundColor: item.coverColor }} />
              <div className="flex items-center gap-3 mb-3">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.title} className="w-10 h-10 rounded-xl object-cover flex-shrink-0" style={{ border: `1px solid ${item.coverColor}30` }} />
                ) : (
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `linear-gradient(135deg, ${item.coverColor}55, ${item.coverColor}22)` }}>
                    <span className="text-sm font-bold" style={{ color: item.coverColor }}>{item.title.charAt(0).toUpperCase()}</span>
                  </div>
                )}
                <p className="font-bold text-base leading-snug" style={{ color: '#111827' }}>{item.title}</p>
              </div>
              {item.description && <p className="text-sm leading-relaxed mb-3" style={{ color: '#6b7280' }}>{item.description}</p>}
              {item.tags.length > 0 && (
                <div className="flex gap-1 flex-wrap mb-3">
                  {item.tags.map((tag) => <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: `${item.coverColor}18`, color: item.coverColor, border: `1px solid ${item.coverColor}30` }}>{tag}</span>)}
                </div>
              )}
              {item.linkUrl && (
                <a href={item.linkUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="flex items-center gap-1.5 text-xs text-blue-500 hover:text-blue-600 transition-colors min-w-0">
                  <ExternalLink size={11} className="flex-shrink-0" /><span className="truncate">{item.linkUrl}</span>
                </a>
              )}
              <button onClick={() => setImgExpanded(false)} className="absolute top-4 right-4 w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: '#f3f4f6' }}>
                <X size={12} style={{ color: '#6b7280' }} />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Network: circle node */}
      {isNetwork ? (
        <>
          <motion.div
            whileTap={{ scale: 0.95 }}
            onClick={() => onExpand?.()}
            className="group relative overflow-hidden cursor-pointer select-none rounded-full aspect-square w-full"
            style={{
              border: '1px solid var(--border-default)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
              backgroundColor: 'var(--bg-secondary)',
            }}
          >
            {item.imageUrl ? (
              <img src={item.imageUrl} alt={item.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${item.coverColor}55, ${item.coverColor}22)` }}>
                <span className="text-2xl font-bold" style={{ color: item.coverColor }}>
                  {item.title.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
              <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="p-1.5 rounded-lg bg-black/50 backdrop-blur text-gray-300 hover:text-white transition-colors">
                <Pencil size={11} />
              </button>
              <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-1.5 rounded-lg bg-red-500/20 backdrop-blur text-red-400 hover:text-red-300 transition-colors">
                <Trash2 size={11} />
              </button>
            </div>
          </motion.div>
          <p className="text-[11px] font-medium text-center w-full truncate px-1 leading-tight" style={{ color: 'var(--text-primary)' }}>
            {item.title}
          </p>
          {item.description && (
            <p className="text-[10px] text-center w-full truncate px-1 leading-tight" style={{ color: 'var(--text-muted)' }}>
              {item.description}
            </p>
          )}
        </>
      ) : (
      <motion.div
        whileTap={{ scale: 0.97 }}
        onClick={() => isBook ? setImgExpanded(true) : setBubbleOpen((v) => !v)}
        className={cn(
          'group relative overflow-hidden cursor-pointer select-none',
          'hover:-translate-y-0.5 transition-transform duration-200',
          isBook ? 'h-full' : 'rounded-2xl',
          isEditorial ? 'rounded-3xl' : '',
        )}
        style={{
          backgroundColor: 'var(--bg-secondary)',
          border: isBook ? 'none' : '1px solid var(--border-default)',
          boxShadow: bubbleOpen && !isBook ? '0 0 0 2px var(--accent-primary)' : undefined,
        }}
      >
        {item.imageUrl ? (
          <div className={cn('overflow-hidden', isBook ? 'aspect-[3/4]' : !isEditorial ? 'aspect-square' : '')}>
            <img src={item.imageUrl} alt={item.title} className={cn('w-full transition-transform duration-500 group-hover:scale-105', isEditorial ? 'h-auto object-contain' : 'h-full object-cover')} />
          </div>
        ) : item.videoUrl ? (
          <div className={cn('overflow-hidden relative', isEditorial ? 'aspect-[16/9]' : isBook ? 'aspect-[3/4]' : 'aspect-square')} style={{ background: `linear-gradient(135deg, ${item.coverColor}33, ${item.coverColor}11)` }}>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur flex items-center justify-center">
                <Play size={20} className="text-white ml-1" />
              </div>
            </div>
          </div>
        ) : (
          <div className={cn(
            'flex flex-col items-center justify-center px-4 py-8 gap-2',
            isBook ? 'h-full' : ''
          )} style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <p className="font-semibold text-center leading-snug text-sm" style={{ color: 'var(--text-primary)' }}>
              {item.title}
            </p>
            {item.description && (
              <p className="text-xs text-center leading-relaxed line-clamp-6" style={{ color: 'var(--text-muted)' }}>
                {item.description}
              </p>
            )}
          </div>
        )}

        <div className="absolute bottom-2 left-2">
          <span className={cn('flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full backdrop-blur', item.isPublic ? 'bg-black/30 text-green-300' : 'bg-black/30 text-gray-400')}>
            {item.isPublic ? <Globe size={8} /> : <Lock size={8} />}
          </span>
        </div>

        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="p-1.5 rounded-lg bg-black/50 backdrop-blur text-gray-300 hover:text-white transition-colors">
            <Pencil size={11} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-1.5 rounded-lg bg-red-500/20 backdrop-blur text-red-400 hover:text-red-300 transition-colors">
            <Trash2 size={11} />
          </button>
        </div>
      </motion.div>
      )}

      <AnimatePresence>
        {bubbleOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setBubbleOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 8 }}
              transition={{ type: 'spring', damping: 20, stiffness: 400 }}
              className="absolute left-0 right-0 z-50 mt-2 rounded-2xl p-4 shadow-2xl"
              style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-default)', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}
            >
              <div className="absolute -top-2 left-6 w-4 h-4 rotate-45" style={{ background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-default)', borderLeft: '1px solid var(--border-default)' }} />
              <button onClick={() => setBubbleOpen(false)} className="absolute top-3 right-3 p-1 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-colors">
                <X size={13} />
              </button>
              <h3 className="text-sm font-bold pr-6 mb-1" style={{ color: 'var(--text-primary)' }}>{item.title}</h3>
              {item.description && <p className="text-xs leading-relaxed mb-3" style={{ color: 'var(--text-secondary)' }}>{item.description}</p>}
              {(item.linkUrl || (item.mediaItems?.length > 0)) && (
                <div className="flex gap-2 mb-3 flex-wrap">
                  {item.linkUrl && (
                    <a href={item.linkUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors">
                      <ExternalLink size={9} /> {t.portfolio.openLink}
                    </a>
                  )}
                  {item.mediaItems?.length > 0 && <span className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-white/5 text-gray-400"><ImageIcon size={9} /> {t.portfolio.mediaCount(item.mediaItems.length)}</span>}
                </div>
              )}
              {item.tags.length > 0 && (
                <div className="flex gap-1 flex-wrap mb-3">
                  {item.tags.map((tag) => <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-gray-500">{tag}</span>)}
                </div>
              )}
              <div className="flex gap-2">
                <button onClick={(e) => { e.stopPropagation(); setBubbleOpen(false); onEdit(); }} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium bg-white/5 transition-colors" style={{ color: 'var(--text-secondary)' }}>
                  <Pencil size={11} /> {t.portfolio.edit}
                </button>
                {item.isPublic && (
                  <button onClick={(e) => { e.stopPropagation(); onShare(); setBubbleOpen(false); }} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium transition-colors" style={{ background: 'rgba(var(--accent-primary-rgb),0.12)', color: 'var(--accent-primary)' }}>
                    <Share2 size={11} /> {t.portfolio.share}
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── PortfolioBookView ──────────────────────────────────── */
function PortfolioBookView({ items, onEdit, onDelete, onShare }: {
  items: Portfolio[]; onEdit: (item: Portfolio) => void; onDelete: (id: string) => void; onShare: (item: Portfolio) => void;
}) {
  const [spreadIdx, setSpreadIdx] = useState(0);
  const [flipDir, setFlipDir] = useState<'next' | 'prev'>('next');
  const totalSpreads = Math.ceil(items.length / 2);

  const go = (dir: 'next' | 'prev') => {
    const next = dir === 'next' ? spreadIdx + 1 : spreadIdx - 1;
    if (next < 0 || next >= totalSpreads) return;
    setFlipDir(dir);
    setSpreadIdx(next);
  };

  const left  = items[spreadIdx * 2];
  const right = items[spreadIdx * 2 + 1];

  const Blank = () => (
    <div className="flex items-center justify-center aspect-[3/4] opacity-20" style={{ color: 'var(--text-muted)' }}>끝</div>
  );

  return (
    <div className="flex flex-col items-center gap-3">
      <AnimatePresence mode="wait" custom={flipDir}>
        <motion.div
          key={spreadIdx}
          custom={flipDir}
          variants={{
            enter: (dir: string) => ({ rotateY: dir === 'next' ? 14 : -14, opacity: 0.6, scale: 0.97 }),
            center: { rotateY: 0, opacity: 1, scale: 1 },
            exit:  (dir: string) => ({ rotateY: dir === 'next' ? -14 : 14, opacity: 0.6, scale: 0.97 }),
          }}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.42, ease: [0.4, 0, 0.2, 1] }}
          className="w-full"
          style={{ perspective: '1200px', transformOrigin: 'center' }}
        >
          <div className="grid grid-cols-2 gap-0 rounded-2xl overflow-hidden"
            style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.12)', border: '1px solid var(--border-default)' }}>
            <div className="h-full" style={{ borderRight: '2px solid var(--border-default)' }}>
              {left ? <PortfolioItemCard item={left}  template="book" onEdit={() => onEdit(left)}  onDelete={() => onDelete(left.id)}  onShare={() => onShare(left)} /> : <Blank />}
            </div>
            <div className="h-full">
              {right ? <PortfolioItemCard item={right} template="book" onEdit={() => onEdit(right)} onDelete={() => onDelete(right.id)} onShare={() => onShare(right)} /> : <Blank />}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="flex items-center gap-4">
        <button onClick={() => go('prev')} disabled={spreadIdx === 0}
          className="p-2 rounded-xl disabled:opacity-30 transition-colors" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
          <ChevronLeft size={16} style={{ color: 'var(--text-secondary)' }} />
        </button>
        <span className="text-xs tabular-nums" style={{ color: 'var(--text-muted)' }}>{spreadIdx + 1} / {totalSpreads}</span>
        <button onClick={() => go('next')} disabled={spreadIdx >= totalSpreads - 1}
          className="p-2 rounded-xl disabled:opacity-30 transition-colors" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
          <ChevronRight size={16} style={{ color: 'var(--text-secondary)' }} />
        </button>
      </div>
    </div>
  );
}

/* ─── PortfolioNetworkView ───────────────────────────────── */
// Deterministic pseudo-random positions — seeded by index so they're stable
function seededPos(i: number, total: number): { left: number; top: number } {
  // Divide canvas into a loose grid of zones, then offset randomly within each zone
  const cols = Math.ceil(Math.sqrt(total * 1.4));
  const rows = Math.ceil(total / cols);
  const col = i % cols;
  const row = Math.floor(i / cols);
  const sin = Math.sin(i * 127.1 + 311.7);
  const cos = Math.cos(i * 269.5 + 183.3);
  const jx = (sin * 0.5 + 0.5) * 0.55 - 0.275; // ±27.5% of cell
  const jy = (cos * 0.5 + 0.5) * 0.55 - 0.275;
  const leftPct  = ((col + 0.5 + jx) / cols) * 80 + 5; // 5–85%
  const topPct   = ((row + 0.5 + jy) / rows) * 76 + 5; // 5–81%
  return { left: leftPct, top: topPct };
}

function PortfolioNetworkView({ items, onEdit, onDelete, onShare }: {
  items: Portfolio[]; onEdit: (item: Portfolio) => void; onDelete: (id: string) => void; onShare: (item: Portfolio) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [expandedItem, setExpandedItem] = useState<Portfolio | null>(null);
  const depthFactors = [0.5, 1.2, 0.3, 1.5, 0.8, 1.0, 0.4, 1.3, 0.7, 1.1, 0.6, 0.9];
  const STRENGTH = 18;
  const CARD_W = 90;

  const positions = useMemo(() => items.map((_, i) => seededPos(i, items.length)), [items.length]);

  // Lines computed from percentage positions — no DOM measurement needed
  const lines = useMemo(() => {
    if (items.length < 2) return [];
    const result: { x1: number; y1: number; x2: number; y2: number }[] = [];
    const connected = new Set<string>();
    positions.forEach((c, i) => {
      const dists = positions
        .map((n, j) => ({ j, d: j !== i ? Math.hypot(n.left - c.left, n.top - c.top) : Infinity }))
        .sort((a, b) => a.d - b.d)
        .slice(0, 2);
      dists.forEach(({ j }) => {
        if (j === i || j >= positions.length) return;
        const key = [Math.min(i, j), Math.max(i, j)].join('-');
        if (!connected.has(key)) {
          connected.add(key);
          result.push({ x1: c.left, y1: c.top, x2: positions[j].left, y2: positions[j].top });
        }
      });
    });
    return result;
  }, [positions]);

  const getRelative = useCallback((clientX: number, clientY: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setMouse({
      x: (clientX - rect.left) / rect.width  - 0.5,
      y: (clientY - rect.top)  / rect.height - 0.5,
    });
  }, []);

  const containerH = Math.max(420, Math.ceil(items.length / 3) * 160);

  return (
    <div
      ref={containerRef}
      onMouseMove={(e) => getRelative(e.clientX, e.clientY)}
      onMouseLeave={() => setMouse({ x: 0, y: 0 })}
      onTouchMove={(e) => { const t = e.touches[0]; if (t) getRelative(t.clientX, t.clientY); }}
      onTouchEnd={() => setMouse({ x: 0, y: 0 })}
      className="relative w-full"
      style={{ height: containerH }}
    >
      {/* SVG connecting lines — percentage coordinates match item positions */}
      <svg className="absolute inset-0 pointer-events-none" width="100%" height="100%"
        style={{ zIndex: 0 }}>
        {lines.map((l, i) => (
          <line key={i}
            x1={`${l.x1}%`} y1={`${l.y1}%`}
            x2={`${l.x2}%`} y2={`${l.y2}%`}
            stroke="white" strokeWidth="2" opacity="0.7" />
        ))}
      </svg>
      {/* Network overlay — rendered here, outside transform context */}
      <AnimatePresence>
        {expandedItem && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center p-4 pb-8"
            style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
            onClick={() => setExpandedItem(null)}>
            <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
              transition={{ type: 'spring', damping: 24, stiffness: 260 }}
              className="relative w-full max-w-sm rounded-2xl p-5"
              style={{ backgroundColor: '#ffffff', boxShadow: '0 -4px 40px rgba(0,0,0,0.15)' }}
              onClick={(e) => e.stopPropagation()}>
              <div className="w-8 h-1 rounded-full mb-4 mx-auto" style={{ backgroundColor: expandedItem.coverColor }} />
              <div className="flex items-center gap-3 mb-3">
                {expandedItem.imageUrl ? (
                  <img src={expandedItem.imageUrl} alt={expandedItem.title} className="w-10 h-10 rounded-xl object-cover flex-shrink-0" style={{ border: `1px solid ${expandedItem.coverColor}30` }} />
                ) : (
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `linear-gradient(135deg, ${expandedItem.coverColor}55, ${expandedItem.coverColor}22)` }}>
                    <span className="text-sm font-bold" style={{ color: expandedItem.coverColor }}>{expandedItem.title.charAt(0).toUpperCase()}</span>
                  </div>
                )}
                <p className="font-bold text-base leading-snug" style={{ color: '#111827' }}>{expandedItem.title}</p>
              </div>
              {expandedItem.description && <p className="text-sm leading-relaxed mb-3" style={{ color: '#6b7280' }}>{expandedItem.description}</p>}
              {expandedItem.tags.length > 0 && (
                <div className="flex gap-1 flex-wrap mb-3">
                  {expandedItem.tags.map((tag) => <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: `${expandedItem.coverColor}18`, color: expandedItem.coverColor, border: `1px solid ${expandedItem.coverColor}30` }}>{tag}</span>)}
                </div>
              )}
              {expandedItem.linkUrl && (
                <a href={expandedItem.linkUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="flex items-center gap-1.5 text-xs text-blue-500 hover:text-blue-600 transition-colors min-w-0">
                  <ExternalLink size={11} className="flex-shrink-0" /><span className="truncate">{expandedItem.linkUrl}</span>
                </a>
              )}
              <button onClick={() => setExpandedItem(null)} className="absolute top-4 right-4 w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: '#f3f4f6' }}>
                <X size={12} style={{ color: '#6b7280' }} />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Items */}
      {items.map((item, i) => {
        const depth = depthFactors[i % depthFactors.length];
        const tx = mouse.x * depth * STRENGTH;
        const ty = mouse.y * depth * STRENGTH;
        const pos = positions[i];
        return (
          <motion.div
            key={item.id}
            animate={{ x: tx, y: ty }}
            transition={{ type: 'spring', damping: 28, stiffness: 180 }}
            style={{
              position: 'absolute',
              left: `${pos.left}%`,
              top:  `${pos.top}%`,
              width: CARD_W,
              zIndex: 1,
              translateX: '-50%',
              translateY: '-50%',
            }}
          >
            <PortfolioItemCard item={item} template="network"
              onEdit={() => onEdit(item)} onDelete={() => onDelete(item.id)} onShare={() => onShare(item)}
              onExpand={() => setExpandedItem(item)} />
          </motion.div>
        );
      })}
    </div>
  );
}

/* ─── SortablePortfolioItem ──────────────────────────────── */
function SortablePortfolioItem({ item, template, onEdit, onDelete, onShare, style }: {
  item: Portfolio; template: PortfolioTemplate;
  onEdit: () => void; onDelete: () => void; onShare: () => void;
  style?: React.CSSProperties;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const dragStyle: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
    cursor: isDragging ? 'grabbing' : 'grab',
    ...style,
  };
  return (
    <div ref={setNodeRef} style={dragStyle} {...attributes} {...listeners}>
      <PortfolioItemCard item={item} template={template} onEdit={onEdit} onDelete={onDelete} onShare={onShare} />
    </div>
  );
}

/* ─── PortfolioGrid ──────────────────────────────────────── */
function PortfolioGrid({ items, template, masonryCols, onEdit, onDelete, onShare, onReorder }: {
  items: Portfolio[]; template: PortfolioTemplate; masonryCols: 2 | 3;
  onEdit: (item: Portfolio) => void; onDelete: (id: string) => void; onShare: (item: Portfolio) => void;
  onReorder: (ids: string[]) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = items.findIndex((i) => i.id === active.id);
    const newIdx = items.findIndex((i) => i.id === over.id);
    const reordered = arrayMove(items, oldIdx, newIdx);
    onReorder(reordered.map((i) => i.id));
  };

  /* ── B. Book layout ── */
  if (template === 'book') {
    return <PortfolioBookView items={items} onEdit={onEdit} onDelete={onDelete} onShare={onShare} />;
  }
  /* ── D. Network layout ── */
  if (template === 'network') {
    return <PortfolioNetworkView items={items} onEdit={onEdit} onDelete={onDelete} onShare={onShare} />;
  }

  /* ── Sortable layouts: editorial, magazine, grid ── */
  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map((i) => i.id)} strategy={rectSortingStrategy}>
        {template === 'editorial' && (
          <div className="flex flex-col gap-3">
            {items.map((item) => (
              <SortablePortfolioItem key={item.id} item={item} template={template}
                onEdit={() => onEdit(item)} onDelete={() => onDelete(item.id)} onShare={() => onShare(item)} />
            ))}
          </div>
        )}
        {template === 'grid' && (
          <div style={{ columns: masonryCols, columnGap: '12px' }}>
            {items.map((item) => (
              <SortablePortfolioItem key={item.id} item={item} template={template}
                onEdit={() => onEdit(item)} onDelete={() => onDelete(item.id)} onShare={() => onShare(item)}
                style={{ breakInside: 'avoid', marginBottom: '12px', display: 'block' }} />
            ))}
          </div>
        )}
      </SortableContext>
    </DndContext>
  );
}

/* ─── Main page ──────────────────────────────────────────── */
export default function HomePage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const toast = useToast();
  const t = useT();

  const [activeTemplate, setActiveTemplate] = useState<PortfolioTemplate>('grid');
  const [masonryCols, setMasonryCols] = useState<2 | 3>(2);
  const [portfolioBg, setPortfolioBg] = useState('#f9fafb');
  const [portfolioFont, setPortfolioFont] = useState('default');
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Load saved layout + bg from server on mount
  useEffect(() => {
    fetch('/api/user/profile').then((r) => r.json()).then((d) => {
      if (d.data?.portfolioLayout) setActiveTemplate(d.data.portfolioLayout as PortfolioTemplate);
      if (d.data?.portfolioBgColor) setPortfolioBg(d.data.portfolioBgColor);
      if (d.data?.portfolioFont) setPortfolioFont(d.data.portfolioFont);
    });
  }, []);

  const handleTemplateChange = (tmpl: PortfolioTemplate) => {
    setActiveTemplate(tmpl);
  };

  const handleSaveLayout = () => {
    fetch('/api/user/portfolio-layout', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ layout: activeTemplate, bgColor: portfolioBg, font: portfolioFont }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.error) { toast.error(d.error); return; }
        toast.success('저장되었습니다.');
      })
      .catch(() => toast.error('저장에 실패했습니다.'));
  };
  const [editItem, setEditItem] = useState<Portfolio | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  const defaultForm = {
    title: '', description: '', tags: '', isPublic: true,
    coverColor: '#16a34a', template: 'grid' as PortfolioTemplate,
    projectId: '', imageUrl: '', videoUrl: '', linkUrl: '',
    mediaItems: [] as PortfolioMediaItem[],
  };
  const [form, setForm] = useState(defaultForm);

  const { data, isLoading } = useQuery({
    queryKey: ['portfolio'],
    queryFn: async () => {
      const r = await fetch('/api/portfolio');
      const json = await r.json();
      return {
        ...json,
        data: (json.data || []).map((item: any) => ({
          ...item,
          tags: typeof item.tags === 'string' ? JSON.parse(item.tags) : item.tags,
          mediaItems: typeof item.mediaItems === 'string' ? JSON.parse(item.mediaItems) : (item.mediaItems || []),
        })),
      };
    },
  });

  const { data: projectsData } = useQuery({
    queryKey: ['completed-projects'],
    queryFn: () => fetch('/api/projects?status=COMPLETED').then((r) => r.json()),
  });

  const serverItems: Portfolio[] = data?.data || [];
  const [localOrder, setLocalOrder] = useState<string[]>([]);
  const completedProjects: Project[] = projectsData?.data || [];

  // Sync local order when server data arrives
  useEffect(() => {
    setLocalOrder(serverItems.map((i) => i.id));
  }, [serverItems.map((i) => i.id).join(',')]);

  const portfolioItems = useMemo(() => {
    if (localOrder.length === 0) return serverItems;
    return localOrder.map((id) => serverItems.find((i) => i.id === id)).filter(Boolean) as Portfolio[];
  }, [localOrder, serverItems]);

  const handleReorder = useCallback((ids: string[]) => {
    setLocalOrder(ids);
    fetch('/api/portfolio/reorder', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    });
  }, []);

  const createMutation = useMutation({
    mutationFn: (body: any) => fetch('/api/portfolio', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then((r) => r.json()),
    onSuccess: (data) => {
      if (data.error) { toast.error(data.error); return; }
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
      toast.success(t.portfolio.added);
      setCreateModalOpen(false);
      setForm(defaultForm);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: any }) => fetch(`/api/portfolio/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
      toast.success(t.portfolio.saved);
      setEditItem(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fetch(`/api/portfolio/${id}`, { method: 'DELETE' }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
      toast.success(t.portfolio.deleted);
    },
  });

  const openEditModal = (item: Portfolio) => {
    setEditItem(item);
    setForm({
      title: item.title, description: item.description || '', tags: item.tags.join(', '),
      isPublic: item.isPublic, coverColor: item.coverColor, template: item.template || 'grid',
      projectId: item.projectId || '', imageUrl: item.imageUrl || '',
      videoUrl: item.videoUrl || '', linkUrl: item.linkUrl || '', mediaItems: item.mediaItems || [],
    });
  };

  const handleSubmit = () => {
    if (!form.title.trim()) { toast.error(t.portfolio.titleRequired); return; }
    const body = {
      title: form.title, description: form.description || undefined,
      tags: form.tags.split(',').map((s) => s.trim()).filter(Boolean),
      isPublic: form.isPublic, coverColor: form.coverColor, template: form.template, layout: form.template,
      projectId: form.projectId || undefined, imageUrl: form.imageUrl || undefined,
      videoUrl: form.videoUrl || undefined, linkUrl: form.linkUrl || undefined, mediaItems: form.mediaItems,
    };
    if (editItem) { updateMutation.mutate({ id: editItem.id, body }); }
    else { createMutation.mutate(body); }
  };

  const handleShare = async (item: Portfolio) => {
    if (!session?.user?.username) return;
    const url = `${window.location.origin}/p/${session.user.username}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedSlug(item.id);
      toast.success(t.portfolio.copySuccess);
      setTimeout(() => setCopiedSlug(null), 2000);
    } catch {
      toast.error(t.portfolio.copyFailed);
    }
  };

  const publicPortfolioUrl = session?.user?.username
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/p/${session.user.username}`
    : null;

  const isModalOpen = createModalOpen || !!editItem;

  return (
    <div className="py-4 space-y-5">
      {/* ── 멘트 ───────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="text-center pt-2 pb-1"
      >
        <p className="text-[10px] font-bold tracking-widest uppercase mb-1.5" style={{ color: 'var(--accent-primary)' }}>
          ✦ DesignFlow ✦
        </p>
        <h2
          className="text-xl font-extrabold leading-snug"
          style={{
            background: 'linear-gradient(135deg, var(--text-primary) 0%, var(--accent-primary) 55%, #22c55e 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          마법처럼 만들어지는<br />당신의 디자인 포트폴리오
        </h2>
        {/* ── Public portfolio link ── */}
        {publicPortfolioUrl && portfolioItems.some((i) => i.isPublic) && (
          <div className="mt-3 rounded-2xl p-3" style={{ background: 'rgba(var(--accent-primary-rgb),0.08)', border: '1px solid rgba(var(--accent-primary-rgb),0.2)' }}>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs px-2 py-1.5 rounded-lg truncate text-left" style={{ color: 'var(--text-secondary)', background: 'var(--bg-tertiary)' }}>
                {publicPortfolioUrl}
              </code>
              <Button variant="secondary" size="sm" onClick={async () => { await navigator.clipboard.writeText(publicPortfolioUrl); toast.success(t.portfolio.copied); }} leftIcon={<Link2 size={13} />}>
                {t.portfolio.copyLink}
              </Button>
            </div>
          </div>
        )}
      </motion.div>

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{t.portfolio.title}</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{t.portfolio.count(portfolioItems.length)}</p>
        </div>
        <Button variant="primary" size="sm" onClick={handleSaveLayout} leftIcon={<CheckCheck size={14} />}>
          저장
        </Button>
      </div>

      {/* ── Template switcher + bg color picker ────────────── */}
      {portfolioItems.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-0.5">
            {TEMPLATES.map((tmpl) => (
              <button key={tmpl.id} onClick={() => handleTemplateChange(tmpl.id)}
                className={cn('flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                  activeTemplate === tmpl.id ? 'bg-green-500/15 border-green-600/40 text-green-300' : 'border-white/5 text-gray-500 hover:text-gray-300 hover:border-white/10'
                )}
              >
                <span>{tmpl.preview}</span>
                <span>{tmpl.name}</span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>배경색</span>
            <input
              type="color"
              value={portfolioBg}
              onChange={(e) => setPortfolioBg(e.target.value)}
              className="w-6 h-6 rounded-md cursor-pointer border-0 bg-transparent flex-shrink-0"
            />
            <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>{portfolioBg}</span>
          </div>
          {/* Font picker */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>글꼴</span>
            <div className="flex flex-wrap gap-1.5">
              {PORTFOLIO_FONTS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setPortfolioFont(f.id)}
                  className={cn('px-2.5 py-1 rounded-full text-xs border transition-all',
                    portfolioFont === f.id
                      ? 'bg-green-500/15 border-green-600/40 text-green-300'
                      : 'border-white/5 text-gray-500 hover:text-gray-300'
                  )}
                  style={{ fontFamily: f.family !== 'inherit' ? f.family : undefined }}
                >
                  {f.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Divider + full-width bg (starts right here) ─────── */}
      {(() => { const fontDef = PORTFOLIO_FONTS.find(f => f.id === portfolioFont); return fontDef?.css ? <style>{fontDef.css}</style> : null; })()}
      <div style={{
        backgroundColor: portfolioBg,
        fontFamily: PORTFOLIO_FONTS.find(f => f.id === portfolioFont)?.family || 'inherit',
        width: '100vw',
        marginLeft: 'calc(-50vw + 50%)',
        paddingLeft: 'calc(50vw - 50%)',
        paddingRight: 'calc(50vw - 50%)',
        paddingTop: '12px',
        paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px) + 60px)',
        marginBottom: 'calc(-80px - env(safe-area-inset-bottom, 0px) - 60px)',
        borderTop: '1px solid var(--border-default)',
      }}>
        {/* Column toggle — inside bg area */}
        {portfolioItems.length > 0 && activeTemplate === 'grid' && (
          <div className="flex items-center gap-1.5 mb-3">
            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>열</span>
            {([2, 3] as const).map((n) => (
              <button key={n} onClick={() => setMasonryCols(n)}
                className={cn('px-2.5 py-1 rounded-full text-xs font-medium border transition-all',
                  masonryCols === n ? 'bg-green-500/15 border-green-600/40 text-green-300' : 'border-white/5 text-gray-500 hover:text-gray-300'
                )}>{n}</button>
            ))}
          </div>
        )}
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton rounded-2xl aspect-[4/5]" />)}
          </div>
        ) : portfolioItems.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center mb-4">
              <LayoutTemplate size={28} className="text-green-500" />
            </div>
            <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>{t.portfolio.emptyTitle}</h3>
            <p className="text-sm mb-5 max-w-[240px]" style={{ color: 'var(--text-muted)' }}>{t.portfolio.emptyDesc}</p>
            <Button variant="primary" onClick={() => setCreateModalOpen(true)} leftIcon={<Plus size={16} />}>{t.portfolio.emptyCta}</Button>
          </motion.div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div key={activeTemplate} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
              <PortfolioGrid items={portfolioItems} template={activeTemplate} masonryCols={masonryCols} onEdit={openEditModal} onDelete={(id) => setDeleteTargetId(id)} onShare={handleShare} onReorder={handleReorder} />
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* ── FAB ────────────────────────────────────────────── */}
      <motion.button
        initial={{ scale: 0 }} animate={{ scale: 1 }} whileTap={{ scale: 0.9 }}
        onClick={() => { setForm(defaultForm); setEditItem(null); setCreateModalOpen(true); }}
        className="fixed right-4 w-12 h-12 rounded-2xl text-white flex items-center justify-center z-30"
        style={{
          bottom: 'calc(64px + env(safe-area-inset-bottom, 0px) + 12px)',
          background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
          boxShadow: '0 0 20px rgba(var(--accent-primary-rgb),0.35)',
        }}
      >
        <Plus size={22} strokeWidth={2.5} />
      </motion.button>

      {/* ── Delete Confirm Modal ────────────────────────────── */}
      <Modal isOpen={!!deleteTargetId} onClose={() => setDeleteTargetId(null)} title="포트폴리오 삭제" size="sm">
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 rounded-xl" style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <Trash2 size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              한 번 삭제한 포트폴리오는 복구가 불가능합니다.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={() => setDeleteTargetId(null)}>취소</Button>
            <Button
              variant="danger"
              fullWidth
              loading={deleteMutation.isPending}
              leftIcon={<Trash2 size={15} />}
              onClick={() => { if (deleteTargetId) { deleteMutation.mutate(deleteTargetId); setDeleteTargetId(null); } }}
            >
              삭제
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Create / Edit Modal ─────────────────────────────── */}
      <Modal isOpen={isModalOpen} onClose={() => { setCreateModalOpen(false); setEditItem(null); }} title={editItem ? t.portfolio.editModal : t.portfolio.addModal} size="md">
        <div className="space-y-4">
          {!editItem && completedProjects.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{t.portfolio.fromProject}</label>
              <select
                value={form.projectId}
                onChange={(e) => {
                  const p = completedProjects.find((p) => p.id === e.target.value);
                  setForm((prev) => ({ ...prev, projectId: e.target.value, title: p?.title || prev.title, description: p?.description || prev.description, imageUrl: p?.coverImage || prev.imageUrl }));
                }}
                className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none"
                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
              >
                <option value="">{t.portfolio.createManual}</option>
                {completedProjects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
            </div>
          )}


          <Input label={t.portfolio.titleLabel} placeholder={t.portfolio.titlePlaceholder} value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} required />
          <Textarea label={t.portfolio.descLabel} placeholder={t.portfolio.descPlaceholder} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={3} />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{t.portfolio.coverImage}</label>
            <ImageUpload value={form.imageUrl} onChange={(url) => setForm((p) => ({ ...p, imageUrl: url }))} onClear={() => setForm((p) => ({ ...p, imageUrl: '' }))} aspectRatio="video" placeholder={t.portfolio.coverImagePlaceholder} />
          </div>

          <Input label={t.portfolio.linkUrlLabel} placeholder={t.portfolio.linkPlaceholder} value={form.linkUrl} onChange={(e) => setForm((p) => ({ ...p, linkUrl: e.target.value }))} />
          <Input label={t.portfolio.tagsLabel} placeholder={t.portfolio.tagsPlaceholder} value={form.tags} onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value }))} />

          {/* Cover color */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{t.portfolio.coverColor}</label>
            <div className="flex items-center gap-3">
              <input type="color" value={form.coverColor} onChange={(e) => setForm((p) => ({ ...p, coverColor: e.target.value }))} className="w-10 h-10 rounded-xl border-0 cursor-pointer bg-transparent" />
              <div className="flex-1 h-10 rounded-xl" style={{ background: `linear-gradient(135deg, ${form.coverColor}66, ${form.coverColor}33)`, border: `1px solid ${form.coverColor}44` }} />
            </div>
          </div>

          {/* Visibility */}
          <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl" style={{ background: 'var(--bg-tertiary)' }}>
            <input type="checkbox" checked={form.isPublic} onChange={(e) => setForm((p) => ({ ...p, isPublic: e.target.checked }))} className="w-4 h-4 rounded accent-green-600" />
            <div className="flex items-center gap-2">
              {form.isPublic ? <Globe size={14} className="text-green-400" /> : <Lock size={14} className="text-gray-400" />}
              <div>
                <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{form.isPublic ? t.portfolio.publicLabel : t.portfolio.privateLabel}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{form.isPublic ? t.portfolio.publicDesc : t.portfolio.privateDesc}</p>
              </div>
            </div>
          </label>

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" fullWidth onClick={() => { setCreateModalOpen(false); setEditItem(null); }}>{t.portfolio.cancel}</Button>
            <Button variant="primary" fullWidth loading={createMutation.isPending || updateMutation.isPending} onClick={handleSubmit}>
              {editItem ? t.portfolio.save : t.portfolio.addItem}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
