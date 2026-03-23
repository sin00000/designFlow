'use client';

import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, ExternalLink, X, Lock, Globe, Share2, Download, ImagePlus, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useGuestPortfolio } from '@/lib/hooks/useGuestPortfolio';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import {
  DndContext, closestCenter, PointerSensor, TouchSensor,
  useSensor, useSensors, type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, useSortable, rectSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Portfolio, PortfolioTemplate } from '@/types';
import { cn } from '@/lib/utils';

/* ─── Constants ─────────────────────────────────────────── */
const PORTFOLIO_FONTS = [
  { id: 'default',          name: '기본',           family: 'inherit', css: '' },
  { id: 'nanum-myeongjo',   name: '나눔명조',        family: "'Nanum Myeongjo', serif",
    css: "@import url('//fonts.googleapis.com/earlyaccess/nanummyeongjo.css');" },
  { id: 'mona12',           name: 'mona12',          family: "'Mona12', sans-serif",
    css: "@import url('https://cdn.jsdelivr.net/gh/MonadABXY/mona-font/web/mona.css');" },
  { id: 'school-safety',    name: '학교안심 반달',   family: "'SchoolSafetyHalfMoon', sans-serif",
    css: "@font-face{font-family:'SchoolSafetyHalfMoon';src:url('https://cdn.jsdelivr.net/gh/projectnoonnu/2508-2@1.0/HakgyoansimBandalL.woff2') format('woff2');font-weight:normal;}" },
  { id: 'yoon-cho-woo-san', name: '윤초록우산 만세', family: "'YoonChoWooSan', sans-serif",
    css: "@font-face{font-family:'YoonChoWooSan';src:url('https://cdn.jsdelivr.net/gh/projectnoonnu/2408@1.0/YoonChildfundkoreaManSeh.woff2') format('woff2');font-weight:normal;font-display:swap;}" },
  { id: 'yangjin',          name: '양진체',          family: "'Yangjin', sans-serif",
    css: "@font-face{font-family:'Yangjin';src:url('https://cdn.jsdelivr.net/gh/supernovice-lab/font@0.9/yangjin.woff') format('woff');font-weight:normal;font-display:swap;}" },
];

const TEMPLATES: { id: PortfolioTemplate; name: string; preview: string }[] = [
  { id: 'grid',      name: 'Grid',      preview: '▦' },
  { id: 'editorial', name: 'Editorial', preview: '▬' },
  { id: 'book',      name: 'Book',      preview: '❐' },
  { id: 'network',   name: 'Network',   preview: '⬡' },
];

/* ─── Login Gate Modal ─────────────────────────────────── */
function LoginGateModal({ open, onClose, reason }: { open: boolean; onClose: () => void; reason: string }) {
  return (
    <Modal isOpen={open} onClose={onClose} title="로그인이 필요해요" size="sm">
      <div className="space-y-4">
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          {reason}을(를) 사용하려면 로그인이 필요해요.<br />
          지금까지 만든 포트폴리오는 로그인 후에도 그대로 유지돼요.
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={onClose}>계속 작성</Button>
          <Link href="/login?from=guest" className="flex-1">
            <Button variant="primary" className="w-full">로그인</Button>
          </Link>
        </div>
        <div className="text-center">
          <Link href="/register?from=guest" className="text-xs" style={{ color: 'var(--text-muted)' }}>
            계정이 없으신가요? 회원가입
          </Link>
        </div>
      </div>
    </Modal>
  );
}

/* ─── Card ─────────────────────────────────────────────── */
/* ─── GuestCard (= PortfolioItemCard without share) ─────── */
function GuestCard({ item, onEdit, onDelete, onExpand, template }: {
  item: Portfolio; onEdit: () => void; onDelete: () => void; onExpand?: () => void; template?: PortfolioTemplate;
}) {
  const [bubbleOpen, setBubbleOpen] = useState(false);
  const [imgExpanded, setImgExpanded] = useState(false);
  const isEditorial = template === 'editorial';
  const isBook = template === 'book';
  const isNetwork = template === 'network';

  return (
    <div className={cn('relative', isBook ? 'h-full' : '', isNetwork ? 'flex flex-col items-center gap-1.5' : '')}>
      {/* Book overlay */}
      <AnimatePresence>
        {isBook && imgExpanded && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center p-4 pb-8"
            style={{ backgroundColor: 'rgba(0,0,0,0.82)' }}
            onClick={() => setImgExpanded(false)}>
            <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
              transition={{ type: 'spring', damping: 24, stiffness: 260 }}
              className="relative w-full max-w-sm rounded-2xl p-5"
              style={{ backgroundColor: '#ffffff', boxShadow: '0 -4px 40px rgba(0,0,0,0.15)' }}
              onClick={(e) => e.stopPropagation()}>
              <div className="w-8 h-1 rounded-full mb-4 mx-auto" style={{ backgroundColor: item.coverColor }} />
              <div className="flex items-center gap-3 mb-3">
                {item.imageUrl
                  ? <img src={item.imageUrl} alt={item.title} className="w-10 h-10 rounded-xl object-cover flex-shrink-0" style={{ border: `1px solid ${item.coverColor}30` }} />
                  : <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `linear-gradient(135deg, ${item.coverColor}55, ${item.coverColor}22)` }}>
                      <span className="text-sm font-bold" style={{ color: item.coverColor }}>{item.title.charAt(0).toUpperCase()}</span>
                    </div>}
                <p className="font-bold text-base leading-snug" style={{ color: '#111827' }}>{item.title}</p>
              </div>
              {item.description && <p className="text-sm leading-relaxed mb-3" style={{ color: '#6b7280' }}>{item.description}</p>}
              {item.tags.length > 0 && (
                <div className="flex gap-1 flex-wrap mb-3">
                  {item.tags.map((tag) => <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: `${item.coverColor}18`, color: item.coverColor, border: `1px solid ${item.coverColor}30` }}>{tag}</span>)}
                </div>
              )}
              {item.linkUrl && (
                <a href={item.linkUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="flex items-center gap-1.5 text-xs text-blue-500 min-w-0">
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

      {/* Network node */}
      {isNetwork ? (
        <>
          <motion.div whileTap={{ scale: 0.95 }} onClick={() => onExpand?.()}
            className="group relative overflow-hidden cursor-pointer select-none rounded-full aspect-square w-full"
            style={{ border: '1px solid var(--border-default)', boxShadow: '0 4px 20px rgba(0,0,0,0.25)', backgroundColor: 'var(--bg-secondary)' }}>
            {item.imageUrl
              ? <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              : <div className="absolute inset-0 flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${item.coverColor}55, ${item.coverColor}22)` }}>
                  <span className="text-2xl font-bold" style={{ color: item.coverColor }}>{item.title.charAt(0).toUpperCase()}</span>
                </div>}
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
              <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="p-1.5 rounded-lg bg-black/50 backdrop-blur text-gray-300 hover:text-white"><Pencil size={11} /></button>
              <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-1.5 rounded-lg bg-red-500/20 backdrop-blur text-red-400 hover:text-red-300"><Trash2 size={11} /></button>
            </div>
          </motion.div>
          <p className="text-[11px] font-medium text-center w-full truncate px-1 leading-tight" style={{ color: 'var(--text-primary)' }}>{item.title}</p>
          {item.description && <p className="text-[10px] text-center w-full truncate px-1 leading-tight" style={{ color: 'var(--text-muted)' }}>{item.description}</p>}
        </>
      ) : (
        <motion.div whileTap={{ scale: 0.97 }}
          onClick={() => isBook ? setImgExpanded(true) : setBubbleOpen((v) => !v)}
          className={cn('group relative overflow-hidden cursor-pointer select-none hover:-translate-y-0.5 transition-transform duration-200',
            isBook ? 'h-full' : 'rounded-2xl', isEditorial ? 'rounded-3xl' : '')}
          style={{ backgroundColor: 'var(--bg-secondary)', border: isBook ? 'none' : '1px solid var(--border-default)', boxShadow: bubbleOpen && !isBook ? '0 0 0 2px var(--accent-primary)' : undefined }}>
          {item.imageUrl ? (
            <div className={cn('overflow-hidden', isBook ? 'aspect-[3/4]' : !isEditorial ? 'aspect-square' : '')}>
              <img src={item.imageUrl} alt={item.title} className={cn('w-full transition-transform duration-500 group-hover:scale-105', isEditorial ? 'h-auto object-contain' : 'h-full object-cover')} />
            </div>
          ) : isBook ? (
            <div className="h-full flex items-center justify-center" style={{ backgroundColor: 'var(--bg-secondary)', background: `linear-gradient(135deg, ${item.coverColor}33, ${item.coverColor}11)` }}>
              <span className="text-4xl font-bold" style={{ color: item.coverColor }}>{item.title.charAt(0).toUpperCase()}</span>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center px-4 py-8 gap-2" style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <p className="font-semibold text-center leading-snug text-sm" style={{ color: 'var(--text-primary)' }}>{item.title}</p>
              {item.description && <p className="text-xs text-center leading-relaxed line-clamp-6" style={{ color: 'var(--text-muted)' }}>{item.description}</p>}
            </div>
          )}
          <div className="absolute bottom-2 left-2">
            <span className={cn('flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full backdrop-blur', item.isPublic ? 'bg-black/30 text-green-300' : 'bg-black/30 text-gray-400')}>
              {item.isPublic ? <Globe size={8} /> : <Lock size={8} />}
            </span>
          </div>
          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="p-1.5 rounded-lg bg-black/50 backdrop-blur text-gray-300 hover:text-white"><Pencil size={11} /></button>
            <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-1.5 rounded-lg bg-red-500/20 backdrop-blur text-red-400 hover:text-red-300"><Trash2 size={11} /></button>
          </div>
        </motion.div>
      )}

      {/* Bubble popup */}
      <AnimatePresence>
        {bubbleOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setBubbleOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 8 }}
              transition={{ type: 'spring', damping: 20, stiffness: 400 }}
              className="absolute left-0 right-0 z-50 mt-2 rounded-2xl p-4 shadow-2xl"
              style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-default)', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}
            >
              <div className="absolute -top-2 left-6 w-4 h-4 rotate-45" style={{ background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-default)', borderLeft: '1px solid var(--border-default)' }} />
              <button onClick={() => setBubbleOpen(false)} className="absolute top-3 right-3 p-1 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-white/5"><X size={13} /></button>
              <h3 className="text-sm font-bold pr-6 mb-1" style={{ color: 'var(--text-primary)' }}>{item.title}</h3>
              {item.description && <p className="text-xs leading-relaxed mb-3" style={{ color: 'var(--text-secondary)' }}>{item.description}</p>}
              {item.linkUrl && (
                <div className="flex gap-2 mb-3">
                  <a href={item.linkUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-blue-500/10 text-blue-400">
                    <ExternalLink size={9} /> 링크 열기
                  </a>
                </div>
              )}
              {item.tags.length > 0 && (
                <div className="flex gap-1 flex-wrap mb-3">
                  {item.tags.map((tag) => <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-gray-500">{tag}</span>)}
                </div>
              )}
              <div className="flex gap-2">
                <button onClick={(e) => { e.stopPropagation(); setBubbleOpen(false); onEdit(); }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium bg-white/5" style={{ color: 'var(--text-secondary)' }}>
                  <Pencil size={11} /> 수정
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── GuestBookView ─────────────────────────────────────── */
function GuestBookView({ items, onEdit, onDelete }: { items: Portfolio[]; onEdit: (item: Portfolio) => void; onDelete: (id: string) => void }) {
  const [spreadIdx, setSpreadIdx] = useState(0);
  const [flipDir, setFlipDir] = useState<'next' | 'prev'>('next');
  const totalSpreads = Math.ceil(items.length / 2);
  const go = (dir: 'next' | 'prev') => {
    const next = dir === 'next' ? spreadIdx + 1 : spreadIdx - 1;
    if (next < 0 || next >= totalSpreads) return;
    setFlipDir(dir);
    setSpreadIdx(next);
  };
  const left = items[spreadIdx * 2];
  const right = items[spreadIdx * 2 + 1];
  const Blank = () => <div className="flex items-center justify-center aspect-[3/4] opacity-20" style={{ color: 'var(--text-muted)' }}>끝</div>;
  return (
    <div className="flex flex-col items-center gap-3">
      <AnimatePresence mode="wait" custom={flipDir}>
        <motion.div key={spreadIdx} custom={flipDir}
          variants={{
            enter: (dir: string) => ({ rotateY: dir === 'next' ? 14 : -14, opacity: 0.6, scale: 0.97 }),
            center: { rotateY: 0, opacity: 1, scale: 1 },
            exit:  (dir: string) => ({ rotateY: dir === 'next' ? -14 : 14, opacity: 0.6, scale: 0.97 }),
          }}
          initial="enter" animate="center" exit="exit"
          transition={{ duration: 0.42, ease: [0.4, 0, 0.2, 1] }}
          className="w-full" style={{ perspective: '1200px', transformOrigin: 'center' }}>
          <div className="grid grid-cols-2 gap-0 rounded-2xl overflow-hidden" style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.12)', border: '1px solid var(--border-default)' }}>
            <div className="h-full" style={{ borderRight: '2px solid var(--border-default)' }}>
              {left ? <GuestCard item={left}  template="book" onEdit={() => onEdit(left)}  onDelete={() => onDelete(left.id)} /> : <Blank />}
            </div>
            <div className="h-full">
              {right ? <GuestCard item={right} template="book" onEdit={() => onEdit(right)} onDelete={() => onDelete(right.id)} /> : <Blank />}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
      <div className="flex items-center gap-4">
        <button onClick={() => go('prev')} disabled={spreadIdx === 0} className="p-2 rounded-xl disabled:opacity-30" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
          <ChevronLeft size={16} style={{ color: 'var(--text-secondary)' }} />
        </button>
        <span className="text-xs tabular-nums" style={{ color: 'var(--text-muted)' }}>{spreadIdx + 1} / {totalSpreads}</span>
        <button onClick={() => go('next')} disabled={spreadIdx >= totalSpreads - 1} className="p-2 rounded-xl disabled:opacity-30" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
          <ChevronRight size={16} style={{ color: 'var(--text-secondary)' }} />
        </button>
      </div>
    </div>
  );
}

/* ─── GuestNetworkView ──────────────────────────────────── */
function seededPos(i: number, total: number): { left: number; top: number } {
  const cols = Math.ceil(Math.sqrt(total * 1.4));
  const rows = Math.ceil(total / cols);
  const col = i % cols;
  const row = Math.floor(i / cols);
  const sin = Math.sin(i * 127.1 + 311.7);
  const cos = Math.cos(i * 269.5 + 183.3);
  const jx = (sin * 0.5 + 0.5) * 0.55 - 0.275;
  const jy = (cos * 0.5 + 0.5) * 0.55 - 0.275;
  return { left: ((col + 0.5 + jx) / cols) * 80 + 5, top: ((row + 0.5 + jy) / rows) * 76 + 5 };
}

function GuestNetworkView({ items, onEdit, onDelete }: { items: Portfolio[]; onEdit: (item: Portfolio) => void; onDelete: (id: string) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [expandedItem, setExpandedItem] = useState<Portfolio | null>(null);
  const [nodePositions, setNodePositions] = useState<Record<string, { left: number; top: number }>>({});
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const dragStartRef = useRef<{ startX: number; startY: number; startLeft: number; startTop: number } | null>(null);
  const hasDraggedRef = useRef(false);

  const depthFactors = [0.5, 1.2, 0.3, 1.5, 0.8, 1.0, 0.4, 1.3, 0.7, 1.1, 0.6, 0.9];
  const STRENGTH = 18;
  const CARD_W = 90;

  // Init positions for new items
  useEffect(() => {
    setNodePositions((prev) => {
      const next = { ...prev };
      let changed = false;
      items.forEach((item, i) => {
        if (!next[item.id]) { next[item.id] = seededPos(i, items.length); changed = true; }
      });
      return changed ? next : prev;
    });
  }, [items.map((i) => i.id).join(',')]);

  const positions = useMemo(
    () => items.map((item, i) => nodePositions[item.id] ?? seededPos(i, items.length)),
    [items, nodePositions],
  );

  const lines = useMemo(() => {
    if (items.length < 2) return [];
    const result: { x1: number; y1: number; x2: number; y2: number }[] = [];
    const connected = new Set<string>();
    positions.forEach((c, i) => {
      positions.map((n, j) => ({ j, d: j !== i ? Math.hypot(n.left - c.left, n.top - c.top) : Infinity }))
        .sort((a, b) => a.d - b.d).slice(0, 2)
        .forEach(({ j }) => {
          const key = [Math.min(i, j), Math.max(i, j)].join('-');
          if (!connected.has(key)) { connected.add(key); result.push({ x1: c.left, y1: c.top, x2: positions[j].left, y2: positions[j].top }); }
        });
    });
    return result;
  }, [positions]);

  const handleNodePointerDown = useCallback((e: React.PointerEvent, item: Portfolio, pos: { left: number; top: number }) => {
    e.stopPropagation();
    // Capture all subsequent pointer events on the container
    containerRef.current?.setPointerCapture(e.pointerId);
    hasDraggedRef.current = false;
    setDraggingId(item.id);
    dragStartRef.current = { startX: e.clientX, startY: e.clientY, startLeft: pos.left, startTop: pos.top };
  }, []);

  const handleContainerPointerMove = useCallback((e: React.PointerEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    if (draggingId && dragStartRef.current) {
      const dx = (e.clientX - dragStartRef.current.startX) / rect.width * 100;
      const dy = (e.clientY - dragStartRef.current.startY) / rect.height * 100;
      if (Math.hypot(dx, dy) > 0.8) hasDraggedRef.current = true;
      const newLeft = Math.max(5, Math.min(95, dragStartRef.current.startLeft + dx));
      const newTop = Math.max(5, Math.min(95, dragStartRef.current.startTop + dy));
      setNodePositions((prev) => ({ ...prev, [draggingId]: { left: newLeft, top: newTop } }));
    } else {
      setMouse({ x: (e.clientX - rect.left) / rect.width - 0.5, y: (e.clientY - rect.top) / rect.height - 0.5 });
    }
  }, [draggingId]);

  const handlePointerUp = useCallback(() => {
    setDraggingId(null);
    dragStartRef.current = null;
    setMouse({ x: 0, y: 0 });
  }, []);

  const containerH = Math.max(420, Math.ceil(items.length / 3) * 160);

  return (
    <div
      ref={containerRef}
      onPointerMove={handleContainerPointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerLeave={() => { if (!draggingId) setMouse({ x: 0, y: 0 }); }}
      className="relative w-full select-none"
      style={{ height: containerH, touchAction: 'none' }}
    >
      <svg className="absolute inset-0 pointer-events-none" width="100%" height="100%" style={{ zIndex: 0 }}>
        {lines.map((l, i) => <line key={i} x1={`${l.x1}%`} y1={`${l.y1}%`} x2={`${l.x2}%`} y2={`${l.y2}%`} stroke="var(--text-muted)" strokeWidth="1.5" opacity="0.4" />)}
      </svg>

      <AnimatePresence>
        {expandedItem && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center p-4 pb-8"
            style={{ backgroundColor: 'rgba(0,0,0,0.82)' }} onClick={() => setExpandedItem(null)}>
            <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
              transition={{ type: 'spring', damping: 24, stiffness: 260 }}
              className="relative w-full max-w-sm rounded-2xl p-5"
              style={{ backgroundColor: '#ffffff', boxShadow: '0 -4px 40px rgba(0,0,0,0.15)' }}
              onClick={(e) => e.stopPropagation()}>
              <div className="w-8 h-1 rounded-full mb-4 mx-auto" style={{ backgroundColor: expandedItem.coverColor }} />
              <div className="flex items-center gap-3 mb-3">
                {expandedItem.imageUrl
                  ? <img src={expandedItem.imageUrl} alt={expandedItem.title} className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
                  : <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `linear-gradient(135deg, ${expandedItem.coverColor}55, ${expandedItem.coverColor}22)` }}>
                      <span className="text-sm font-bold" style={{ color: expandedItem.coverColor }}>{expandedItem.title.charAt(0).toUpperCase()}</span>
                    </div>}
                <p className="font-bold text-base leading-snug" style={{ color: '#111827' }}>{expandedItem.title}</p>
              </div>
              {expandedItem.description && <p className="text-sm leading-relaxed mb-3" style={{ color: '#6b7280' }}>{expandedItem.description}</p>}
              {expandedItem.tags.length > 0 && (
                <div className="flex gap-1 flex-wrap mb-3">
                  {expandedItem.tags.map((tag) => <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: `${expandedItem.coverColor}18`, color: expandedItem.coverColor, border: `1px solid ${expandedItem.coverColor}30` }}>{tag}</span>)}
                </div>
              )}
              {expandedItem.linkUrl && (
                <a href={expandedItem.linkUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-blue-500 min-w-0">
                  <ExternalLink size={11} className="flex-shrink-0" /><span className="truncate">{expandedItem.linkUrl}</span>
                </a>
              )}
              <div className="flex gap-2 mt-4">
                <button onClick={() => { setExpandedItem(null); onEdit(expandedItem); }} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium bg-gray-100" style={{ color: '#374151' }}>
                  <Pencil size={11} /> 수정
                </button>
              </div>
              <button onClick={() => setExpandedItem(null)} className="absolute top-4 right-4 w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: '#f3f4f6' }}>
                <X size={12} style={{ color: '#6b7280' }} />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {items.map((item, i) => {
        const depth = depthFactors[i % depthFactors.length];
        const pos = positions[i];
        const isDragging = draggingId === item.id;
        return (
          <motion.div
            key={item.id}
            animate={{ x: isDragging ? 0 : mouse.x * depth * STRENGTH, y: isDragging ? 0 : mouse.y * depth * STRENGTH }}
            transition={{ type: 'spring', damping: 28, stiffness: 180 }}
            style={{
              position: 'absolute',
              left: `${pos.left}%`,
              top: `${pos.top}%`,
              width: CARD_W,
              zIndex: isDragging ? 10 : 1,
              translateX: '-50%',
              translateY: '-50%',
              cursor: isDragging ? 'grabbing' : 'grab',
            }}
            onPointerDown={(e) => handleNodePointerDown(e, item, pos)}
            onClickCapture={(e) => {
              if (hasDraggedRef.current) {
                e.stopPropagation();
                e.preventDefault();
                hasDraggedRef.current = false;
              }
            }}
          >
            <GuestCard item={item} template="network" onEdit={() => onEdit(item)} onDelete={() => onDelete(item.id)} onExpand={() => setExpandedItem(item)} />
          </motion.div>
        );
      })}
    </div>
  );
}

/* ─── SortableGuestItem ─────────────────────────────────── */
function SortableGuestItem({ item, template, onEdit, onDelete, style }: {
  item: Portfolio; template: PortfolioTemplate;
  onEdit: () => void; onDelete: () => void; style?: React.CSSProperties;
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
      <GuestCard item={item} template={template} onEdit={onEdit} onDelete={onDelete} />
    </div>
  );
}

/* ─── GuestGrid ─────────────────────────────────────────── */
function GuestGrid({ items, template, masonryCols, onEdit, onDelete, onReorder }: {
  items: Portfolio[]; template: PortfolioTemplate; masonryCols: 2 | 3;
  onEdit: (item: Portfolio) => void; onDelete: (id: string) => void;
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
    onReorder(arrayMove(items, oldIdx, newIdx).map((i) => i.id));
  };

  if (template === 'book') return <GuestBookView items={items} onEdit={onEdit} onDelete={onDelete} />;
  if (template === 'network') return <GuestNetworkView items={items} onEdit={onEdit} onDelete={onDelete} />;

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map((i) => i.id)} strategy={rectSortingStrategy}>
        {template === 'editorial' ? (
          <div className="flex flex-col gap-3">
            {items.map((item) => (
              <SortableGuestItem key={item.id} item={item} template="editorial"
                onEdit={() => onEdit(item)} onDelete={() => onDelete(item.id)} />
            ))}
          </div>
        ) : (
          <div style={{ columns: masonryCols, columnGap: '12px' }}>
            {items.map((item) => (
              <SortableGuestItem key={item.id} item={item} template="grid"
                onEdit={() => onEdit(item)} onDelete={() => onDelete(item.id)}
                style={{ breakInside: 'avoid', marginBottom: '12px', display: 'block' }} />
            ))}
          </div>
        )}
      </SortableContext>
    </DndContext>
  );
}

/* ─── Item Form ─────────────────────────────────────────── */
const DEFAULT_FORM = { title: '', description: '', tags: '', isPublic: true, coverColor: '#16a34a', imageUrl: '', linkUrl: '' };

function ItemForm({
  initial, onSubmit, onCancel, submitting,
}: {
  initial?: typeof DEFAULT_FORM;
  onSubmit: (form: typeof DEFAULT_FORM) => void;
  onCancel: () => void;
  submitting?: boolean;
}) {
  const [form, setForm] = useState(initial ?? DEFAULT_FORM);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload/guest', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.url) setForm((p) => ({ ...p, imageUrl: data.url }));
    } catch {}
    setUploading(false);
    e.target.value = '';
  };

  return (
    <div className="space-y-4">
      <Input label="제목" placeholder="포트폴리오 이름" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} required />
      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>설명</label>
        <textarea
          placeholder="작업 설명을 입력하세요"
          value={form.description}
          onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
          rows={3}
          className="input-base resize-none"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>이미지</label>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        {form.imageUrl ? (
          <div className="relative rounded-xl overflow-hidden" style={{ border: '1px solid var(--border-default)' }}>
            <img src={form.imageUrl} alt="" className="w-full object-cover max-h-40" />
            <button
              onClick={() => setForm((p) => ({ ...p, imageUrl: '' }))}
              className="absolute top-2 right-2 p-1 rounded-lg bg-black/50 text-white"
            >
              <X size={13} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="w-full h-24 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-colors"
            style={{ border: '1.5px dashed var(--border-default)', color: 'var(--text-muted)' }}
          >
            {uploading ? <Loader2 size={20} className="animate-spin" /> : <ImagePlus size={20} />}
            <span className="text-xs">{uploading ? '업로드 중...' : '이미지 업로드'}</span>
          </button>
        )}
      </div>
      <Input label="링크 URL" placeholder="https://..." value={form.linkUrl} onChange={(e) => setForm((p) => ({ ...p, linkUrl: e.target.value }))} />
      <Input label="태그 (쉼표로 구분)" placeholder="UI, 브랜딩, 모션" value={form.tags} onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value }))} />
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>커버 색상</label>
        <div className="flex items-center gap-3">
          <input type="color" value={form.coverColor} onChange={(e) => setForm((p) => ({ ...p, coverColor: e.target.value }))} className="w-10 h-10 rounded-xl border-0 cursor-pointer bg-transparent" />
          <div className="flex-1 h-10 rounded-xl" style={{ background: `linear-gradient(135deg, ${form.coverColor}66, ${form.coverColor}33)`, border: `1px solid ${form.coverColor}44` }} />
        </div>
      </div>
      <label className="flex items-center gap-2 cursor-pointer">
        <div
          onClick={() => setForm((p) => ({ ...p, isPublic: !p.isPublic }))}
          className="w-10 h-5 rounded-full relative transition-colors"
          style={{ backgroundColor: form.isPublic ? 'var(--accent-primary)' : 'var(--bg-tertiary)' }}
        >
          <div className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform" style={{ transform: form.isPublic ? 'translateX(20px)' : 'translateX(2px)' }} />
        </div>
        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>공개</span>
      </label>
      <div className="flex gap-3 pt-1">
        <Button variant="secondary" fullWidth onClick={onCancel}>취소</Button>
        <Button variant="primary" fullWidth loading={submitting} onClick={() => { if (form.title.trim()) onSubmit(form); }}>저장</Button>
      </div>
    </div>
  );
}

/* ─── Main Page ─────────────────────────────────────────── */
export default function CreatePage() {
  const guest = useGuestPortfolio();
  const [createOpen, setCreateOpen] = useState(false);
  const [editItem, setEditItem] = useState<Portfolio | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [gateReason, setGateReason] = useState<string | null>(null);
  const [masonryCols, setMasonryCols] = useState<2 | 3>(2);

  const triggerLogin = (reason: string) => setGateReason(reason);

  const handleAdd = (form: typeof DEFAULT_FORM) => {
    guest.addItem(form);
    setCreateOpen(false);
  };

  const handleEdit = (form: typeof DEFAULT_FORM) => {
    if (!editItem) return;
    guest.updateItem(editItem.id, form);
    setEditItem(null);
  };

  if (!guest.mounted) return null;

  return (
    <>
      {/* Login gate */}
      <LoginGateModal open={!!gateReason} onClose={() => setGateReason(null)} reason={gateReason ?? ''} />

      {/* Delete confirm */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="삭제" size="sm">
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 rounded-xl" style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <Trash2 size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>한 번 삭제한 포트폴리오는 복구가 불가능합니다.</p>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={() => setDeleteTarget(null)}>취소</Button>
            <Button variant="danger" fullWidth leftIcon={<Trash2 size={15} />} onClick={() => { if (deleteTarget) { guest.deleteItem(deleteTarget); setDeleteTarget(null); } }}>삭제</Button>
          </div>
        </div>
      </Modal>

      {/* Create modal */}
      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="포트폴리오 추가" size="md">
        <ItemForm onSubmit={handleAdd} onCancel={() => setCreateOpen(false)} />
      </Modal>

      {/* Edit modal */}
      <Modal isOpen={!!editItem} onClose={() => setEditItem(null)} title="포트폴리오 수정" size="md">
        {editItem && (
          <ItemForm
            initial={{
              title: editItem.title,
              description: editItem.description ?? '',
              tags: editItem.tags.join(', '),
              isPublic: editItem.isPublic,
              coverColor: editItem.coverColor,
              imageUrl: editItem.imageUrl ?? '',
              linkUrl: editItem.linkUrl ?? '',
            }}
            onSubmit={handleEdit}
            onCancel={() => setEditItem(null)}
          />
        )}
      </Modal>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>내 포트폴리오</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>로그인 없이 바로 시작해보세요</p>
      </motion.div>

      {/* Action bar */}
      <div className="flex gap-2 mb-6">
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<Share2 size={14} />}
          onClick={() => triggerLogin('공유 링크 생성')}
        >
          공유
        </Button>
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<Download size={14} />}
          onClick={() => triggerLogin('내보내기')}
        >
          내보내기
        </Button>
        <div className="flex-1" />
        <Button variant="primary" size="sm" leftIcon={<Plus size={14} />} onClick={() => setCreateOpen(true)}>
          추가
        </Button>
      </div>

      {/* Settings: template / bg / font */}
      {guest.items.length > 0 && (
        <div className="flex flex-col gap-2 mb-5">
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-0.5">
            {TEMPLATES.map((tmpl) => (
              <button key={tmpl.id} onClick={() => guest.setTemplate(tmpl.id)}
                className={cn('flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                  guest.template === tmpl.id
                    ? 'bg-green-500/15 border-green-600/40 text-green-300'
                    : 'border-white/5 text-gray-500 hover:text-gray-300 hover:border-white/10'
                )}
              >
                <span>{tmpl.preview}</span><span>{tmpl.name}</span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>배경색</span>
            <input type="color" value={guest.bgColor} onChange={(e) => guest.setBgColor(e.target.value)}
              className="w-6 h-6 rounded-md cursor-pointer border-0 bg-transparent flex-shrink-0" />
            <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>{guest.bgColor}</span>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>글꼴</span>
            <div className="flex flex-wrap gap-1.5">
              {PORTFOLIO_FONTS.map((f) => (
                <button key={f.id} onClick={() => guest.setFont(f.id)}
                  className={cn('px-2.5 py-1 rounded-full text-xs border transition-all',
                    guest.font === f.id
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

      {/* Save banner */}
      {guest.items.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
          className="mb-5 flex items-center justify-between gap-3 px-4 py-3 rounded-2xl"
          style={{ background: 'rgba(var(--accent-primary-rgb),0.08)', border: '1px solid rgba(var(--accent-primary-rgb),0.2)' }}
        >
          <p className="text-xs" style={{ color: 'var(--accent-primary)' }}>
            {guest.items.length}개의 포트폴리오가 임시 저장 중입니다
          </p>
          <button
            onClick={() => triggerLogin('저장')}
            className="text-xs font-semibold px-3 py-1 rounded-lg"
            style={{ background: 'var(--accent-primary)', color: '#fff' }}
          >
            저장하기
          </button>
        </motion.div>
      )}

      {/* Grid */}
      {(() => {
        const fontDef = PORTFOLIO_FONTS.find((f) => f.id === guest.font);
        if (fontDef?.css) return <style>{fontDef.css}</style>;
      })()}
      {guest.items.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <Plus size={24} style={{ color: 'var(--text-muted)' }} />
          </div>
          <p className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>아직 포트폴리오가 없어요</p>
          <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>첫 번째 작업을 추가해보세요</p>
          <Button variant="primary" leftIcon={<Plus size={16} />} onClick={() => setCreateOpen(true)}>
            포트폴리오 추가
          </Button>
        </motion.div>
      ) : (
        <div style={{
          backgroundColor: guest.bgColor,
          fontFamily: PORTFOLIO_FONTS.find((f) => f.id === guest.font)?.family || 'inherit',
          width: '100vw',
          marginLeft: 'calc(-50vw + 50%)',
          paddingLeft: 'calc(50vw - 50%)',
          paddingRight: 'calc(50vw - 50%)',
          paddingTop: '12px',
          paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px) + 60px)',
          marginBottom: 'calc(-80px - env(safe-area-inset-bottom, 0px) - 60px)',
          borderTop: '1px solid var(--border-default)',
        }}>
          <div style={{ maxWidth: '672px', margin: '0 auto', padding: '0 16px' }}>
            {guest.template === 'grid' && (
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
            <AnimatePresence mode="wait">
              <motion.div key={guest.template} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
                <GuestGrid
                  items={guest.items}
                  template={guest.template}
                  masonryCols={masonryCols}
                  onEdit={(item) => setEditItem(item)}
                  onDelete={(id) => setDeleteTarget(id)}
                  onReorder={(ids) => guest.reorderItems(ids)}
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* FAB */}
      {guest.items.length > 0 && (
        <motion.button
          whileTap={{ scale: 0.93 }}
          onClick={() => setCreateOpen(true)}
          className="fixed bottom-8 right-6 w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl z-30"
          style={{ background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', boxShadow: '0 8px 24px rgba(22,163,74,0.4)' }}
        >
          <Plus size={24} className="text-white" />
        </motion.button>
      )}
    </>
  );
}
