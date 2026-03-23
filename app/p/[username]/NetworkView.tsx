'use client';

import { useState, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import PortfolioCard from './PortfolioCard';

interface Item {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  linkUrl: string | null;
  videoUrl: string | null;
  coverColor: string;
  tags: string[];
  project?: { coverImage: string | null } | null;
}

function seededPos(i: number, total: number): { left: number; top: number } {
  const cols = Math.ceil(Math.sqrt(total * 1.4));
  const rows = Math.ceil(total / cols);
  const col = i % cols;
  const row = Math.floor(i / cols);
  const sin = Math.sin(i * 127.1 + 311.7);
  const cos = Math.cos(i * 269.5 + 183.3);
  const jx = (sin * 0.5 + 0.5) * 0.55 - 0.275;
  const jy = (cos * 0.5 + 0.5) * 0.55 - 0.275;
  const leftPct = ((col + 0.5 + jx) / cols) * 80 + 5;
  const topPct  = ((row + 0.5 + jy) / rows) * 76 + 5;
  return { left: leftPct, top: topPct };
}

const DEPTH_FACTORS = [0.5, 1.2, 0.3, 1.5, 0.8, 1.0, 0.4, 1.3, 0.7, 1.1, 0.6, 0.9];
const STRENGTH = 18;
const CARD_W = 120;

export default function NetworkView({
  items,
  lineColor,
  savedPositions = {},
}: {
  items: Item[];
  lineColor?: string;
  savedPositions?: Record<string, { left: number; top: number }>;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  const positions = useMemo(
    () => items.map((item, i) => savedPositions[item.id] ?? seededPos(i, items.length)),
    [items, savedPositions],
  );

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
      <svg className="absolute inset-0 pointer-events-none" width="100%" height="100%" style={{ zIndex: 0 }}>
        {lines.map((l, i) => (
          <line key={i}
            x1={`${l.x1}%`} y1={`${l.y1}%`}
            x2={`${l.x2}%`} y2={`${l.y2}%`}
            stroke={lineColor || '#111827'} strokeWidth="1.5" opacity="0.25" />
        ))}
      </svg>

      {items.map((item, i) => {
        const depth = DEPTH_FACTORS[i % DEPTH_FACTORS.length];
        const pos = positions[i];
        return (
          <motion.div
            key={item.id}
            animate={{ x: mouse.x * depth * STRENGTH, y: mouse.y * depth * STRENGTH }}
            transition={{ type: 'spring', damping: 28, stiffness: 180 }}
            style={{
              position: 'absolute',
              left: `${pos.left}%`,
              top: `${pos.top}%`,
              width: CARD_W,
              zIndex: 1,
              translateX: '-50%',
              translateY: '-50%',
            }}
          >
            <PortfolioCard isNetwork item={item} />
          </motion.div>
        );
      })}
    </div>
  );
}
