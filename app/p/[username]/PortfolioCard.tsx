'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { ExternalLink, X } from 'lucide-react';

interface Props {
  colSpan?: string;
  isNetwork?: boolean;
  item: {
    id: string;
    title: string;
    description: string | null;
    imageUrl: string | null;
    linkUrl: string | null;
    videoUrl: string | null;
    coverColor: string;
    tags: string[];
    project?: { coverImage: string | null } | null;
  };
}

export default function PortfolioCard({ item, colSpan, isNetwork }: Props) {
  const [expanded, setExpanded] = useState(false);
  const coverColor = item.coverColor || '#16a34a';
  const imageUrl = item.imageUrl || item.project?.coverImage;
  const hasImage = !!imageUrl;

  // ── Network layout: circle node + title below + tap-to-expand overlay ──
  if (isNetwork) {
    const overlay = expanded ? createPortal(
      <>
        <div className="fixed inset-0 z-40 bg-black/60" onClick={() => setExpanded(false)} />
        <div
          className="fixed inset-0 z-50 flex items-end justify-center p-4 pb-8"
          onClick={() => setExpanded(false)}
        >
          <div
            className="relative w-full max-w-sm rounded-2xl p-5"
            style={{ backgroundColor: '#ffffff', boxShadow: '0 -4px 40px rgba(0,0,0,0.15)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-8 h-1 rounded-full mb-4 mx-auto" style={{ backgroundColor: coverColor }} />
            <div className="flex items-center gap-3 mb-3">
              {hasImage ? (
                <img src={imageUrl!} alt={item.title}
                  className="w-10 h-10 rounded-xl object-cover flex-shrink-0"
                  style={{ border: `1px solid ${coverColor}30` }} />
              ) : (
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `linear-gradient(135deg, ${coverColor}55, ${coverColor}22)` }}>
                  <span className="text-sm font-bold" style={{ color: coverColor }}>
                    {item.title.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <p className="font-bold text-base leading-snug" style={{ color: '#111827' }}>{item.title}</p>
            </div>
            {item.description && (
              <p className="text-sm leading-relaxed mb-3" style={{ color: '#6b7280' }}>{item.description}</p>
            )}
            {item.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {item.tags.map((tag) => (
                  <span key={tag} className="px-2 py-0.5 text-xs rounded-full font-medium"
                    style={{ backgroundColor: `${coverColor}18`, color: coverColor, border: `1px solid ${coverColor}30` }}>
                    {tag}
                  </span>
                ))}
              </div>
            )}
            {item.linkUrl && (
              <a href={item.linkUrl} target="_blank" rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1.5 text-xs text-blue-500 hover:text-blue-600 transition-colors min-w-0">
                <ExternalLink size={11} className="flex-shrink-0" />
                <span className="truncate">{item.linkUrl}</span>
              </a>
            )}
            <button
              onClick={() => setExpanded(false)}
              className="absolute top-4 right-4 w-6 h-6 rounded-full flex items-center justify-center"
              style={{ backgroundColor: '#f3f4f6' }}
            >
              <X size={12} style={{ color: '#6b7280' }} />
            </button>
          </div>
        </div>
      </>,
      document.body,
    ) : null;

    return (
      <div className="flex flex-col items-center gap-1.5">
        {overlay}

        {/* Circle */}
        <div
          className="rounded-full overflow-hidden cursor-pointer aspect-square w-full"
          style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.12)', border: `2px solid ${coverColor}30` }}
          onClick={() => setExpanded(true)}
        >
          {hasImage ? (
            <img src={imageUrl!} alt={item.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${coverColor}55, ${coverColor}22)` }}>
              <span className="text-2xl font-bold" style={{ color: coverColor }}>
                {item.title.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* Title + description below */}
        <p className="text-[11px] font-medium text-center w-full truncate px-1 leading-tight" style={{ color: '#111827' }}>
          {item.title}
        </p>
        {item.description && (
          <p className="text-[10px] text-center w-full truncate px-1 leading-tight" style={{ color: '#6b7280' }}>
            {item.description}
          </p>
        )}
      </div>
    );
  }

  // ── Default layouts: link → direct nav, no link → expand bubble ──
  if (item.linkUrl) {
    return (
      <a
        href={item.linkUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`break-inside-avoid mb-3 rounded-2xl overflow-hidden block relative group${colSpan ? ` ${colSpan}` : ''}`}
        style={{ boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}
      >
        {hasImage ? (
          <img src={imageUrl!} alt={item.title} className="w-full object-cover" />
        ) : (
          <div
            className="w-full flex items-center justify-center px-4 py-10"
            style={{ backgroundColor: '#ffffff', borderLeft: `4px solid ${coverColor}` }}
          >
            <p className="text-sm font-semibold text-center leading-snug" style={{ color: '#111827' }}>
              {item.title}
            </p>
          </div>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 rounded-full p-2">
            <ExternalLink size={16} className="text-white" />
          </div>
        </div>
      </a>
    );
  }

  return (
    <div className={`break-inside-avoid mb-3 relative${colSpan ? ` ${colSpan}` : ''}`}>
      <div
        className="rounded-2xl overflow-hidden cursor-pointer"
        style={{ boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}
        onClick={() => setExpanded(true)}
      >
        {hasImage ? (
          <img src={imageUrl!} alt={item.title} className="w-full object-cover" />
        ) : (
          <div
            className="w-full flex items-center justify-center px-4 py-10"
            style={{ backgroundColor: '#ffffff', borderLeft: `4px solid ${coverColor}` }}
          >
            <p className="text-sm font-semibold text-center leading-snug" style={{ color: '#111827' }}>
              {item.title}
            </p>
          </div>
        )}
      </div>

      {expanded && (
        <>
          <div className="fixed inset-0 z-40 bg-black/20" onClick={() => setExpanded(false)} />
          <div
            className="absolute left-0 right-0 z-50 mt-2 rounded-2xl p-4"
            style={{
              backgroundColor: '#ffffff',
              border: `1px solid ${coverColor}30`,
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            }}
          >
            <button
              onClick={() => setExpanded(false)}
              className="absolute top-3 right-3 p-1 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X size={13} style={{ color: '#9ca3af' }} />
            </button>
            <div className="w-5 h-0.5 rounded-full mb-2" style={{ backgroundColor: coverColor }} />
            <h3 className="font-semibold text-sm leading-snug pr-6" style={{ color: '#111827' }}>
              {item.title}
            </h3>
            {item.description && (
              <p className="text-xs leading-relaxed mt-1" style={{ color: '#6b7280' }}>
                {item.description}
              </p>
            )}
            {item.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {item.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 text-xs rounded-full font-medium"
                    style={{ backgroundColor: `${coverColor}18`, color: coverColor, border: `1px solid ${coverColor}30` }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
