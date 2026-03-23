'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Portfolio, PortfolioTemplate, PortfolioMediaItem } from '@/types';

const STORAGE_KEY = 'dr_wep_guest';

export interface GuestPortfolioState {
  items: Portfolio[];
  template: PortfolioTemplate;
  bgColor: string;
  font: string;
}

const DEFAULT_STATE: GuestPortfolioState = {
  items: [],
  template: 'grid',
  bgColor: '#f9fafb',
  font: 'default',
};

function readStorage(): GuestPortfolioState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_STATE,
      ...parsed,
      items: (parsed.items || []).map((item: any) => ({
        ...item,
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt),
        tags: Array.isArray(item.tags) ? item.tags : [],
        mediaItems: Array.isArray(item.mediaItems) ? item.mediaItems : [],
      })),
    };
  } catch {
    return DEFAULT_STATE;
  }
}

function writeStorage(state: GuestPortfolioState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

export function useGuestPortfolio() {
  const [state, setState] = useState<GuestPortfolioState>(DEFAULT_STATE);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setState(readStorage());
    setMounted(true);

    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setState(readStorage());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const update = useCallback((next: GuestPortfolioState) => {
    setState(next);
    writeStorage(next);
  }, []);

  const addItem = useCallback((form: {
    title: string; description: string; tags: string; isPublic: boolean;
    coverColor: string; imageUrl: string; linkUrl: string;
  }) => {
    const now = new Date();
    const newItem: Portfolio = {
      id: `guest_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      userId: 'guest',
      projectId: null,
      title: form.title,
      description: form.description || null,
      imageUrl: form.imageUrl || null,
      tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      isPublic: form.isPublic,
      publicSlug: null,
      layout: 'grid',
      template: 'grid',
      coverColor: form.coverColor || '#16a34a',
      mediaItems: [],
      videoUrl: null,
      linkUrl: form.linkUrl || null,
      createdAt: now,
      updatedAt: now,
    };
    const next = { ...state, items: [...state.items, newItem] };
    update(next);
    return newItem;
  }, [state, update]);

  const updateItem = useCallback((id: string, form: {
    title: string; description: string; tags: string; isPublic: boolean;
    coverColor: string; imageUrl: string; linkUrl: string;
  }) => {
    const next = {
      ...state,
      items: state.items.map((item) =>
        item.id === id
          ? {
              ...item,
              title: form.title,
              description: form.description || null,
              imageUrl: form.imageUrl || null,
              tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
              isPublic: form.isPublic,
              coverColor: form.coverColor || item.coverColor,
              linkUrl: form.linkUrl || null,
              updatedAt: new Date(),
            }
          : item
      ),
    };
    update(next);
  }, [state, update]);

  const deleteItem = useCallback((id: string) => {
    update({ ...state, items: state.items.filter((i) => i.id !== id) });
  }, [state, update]);

  const reorderItems = useCallback((ids: string[]) => {
    const map = new Map(state.items.map((i) => [i.id, i]));
    const reordered = ids.map((id) => map.get(id)).filter(Boolean) as Portfolio[];
    update({ ...state, items: reordered });
  }, [state, update]);

  const setTemplate = useCallback((template: PortfolioTemplate) => {
    update({ ...state, template });
  }, [state, update]);

  const setBgColor = useCallback((bgColor: string) => {
    update({ ...state, bgColor });
  }, [state, update]);

  const setFont = useCallback((font: string) => {
    update({ ...state, font });
  }, [state, update]);

  const clear = useCallback(() => {
    setState(DEFAULT_STATE);
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  }, []);

  const hasData = mounted && state.items.length > 0;

  return {
    ...state,
    mounted,
    hasData,
    addItem,
    updateItem,
    deleteItem,
    reorderItems,
    setTemplate,
    setBgColor,
    setFont,
    clear,
  };
}
