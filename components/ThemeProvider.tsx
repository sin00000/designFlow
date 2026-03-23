'use client';

import { useEffect } from 'react';

// ---------- Accent colors ----------

export const ACCENT_COLORS = [
  { name: 'Green',   value: '#16a34a', secondary: '#22c55e' },
  { name: 'Emerald', value: '#10b981', secondary: '#34d399' },
  { name: 'Indigo',  value: '#6366f1', secondary: '#8b5cf6' },
  { name: 'Violet',  value: '#8b5cf6', secondary: '#a855f7' },
  { name: 'Sky',     value: '#0ea5e9', secondary: '#38bdf8' },
  { name: 'Rose',    value: '#f43f5e', secondary: '#fb7185' },
  { name: 'Amber',   value: '#f59e0b', secondary: '#fbbf24' },
  { name: 'Orange',  value: '#f97316', secondary: '#fb923c' },
];

export type ThemeMode = 'dark' | 'light';

// ---------- Apply accent ----------

export function applyAccent(hex: string, secondary?: string) {
  const sec = secondary ?? hex;
  document.documentElement.style.setProperty('--accent-primary', hex);
  document.documentElement.style.setProperty('--accent-secondary', sec);
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  document.documentElement.style.setProperty('--accent-primary-rgb', `${r}, ${g}, ${b}`);
  localStorage.setItem('accent-color', hex);
  localStorage.setItem('accent-color-secondary', sec);
}

// ---------- Apply theme (light / dark only) ----------

export function applyTheme(mode: ThemeMode) {
  const root = document.documentElement;

  if (mode === 'dark') {
    root.style.setProperty('--bg-primary',    '#0f0f0f');
    root.style.setProperty('--bg-secondary',  '#1a1a1a');
    root.style.setProperty('--bg-tertiary',   '#242424');
    root.style.setProperty('--bg-overlay',    '#2e2e2e');
    root.style.setProperty('--border-default', '#2a2a2a');
    root.style.setProperty('--border-subtle',  'rgba(255,255,255,0.06)');
    root.style.setProperty('--border-strong',  'rgba(255,255,255,0.15)');
    root.style.setProperty('--text-primary',   '#ffffff');
    root.style.setProperty('--text-secondary', '#a1a1aa');
    root.style.setProperty('--text-muted',     '#71717a');
    root.style.setProperty('--shadow-card',      '0 2px 12px rgba(0,0,0,0.35)');
    root.style.setProperty('--shadow-card-hover','0 8px 32px rgba(0,0,0,0.55)');
  } else {
    root.style.setProperty('--bg-primary',    '#f4f4f5');
    root.style.setProperty('--bg-secondary',  '#ffffff');
    root.style.setProperty('--bg-tertiary',   '#ededef');
    root.style.setProperty('--bg-overlay',    '#fafafa');
    root.style.setProperty('--border-default', '#e4e4e7');
    root.style.setProperty('--border-subtle',  'rgba(0,0,0,0.06)');
    root.style.setProperty('--border-strong',  'rgba(0,0,0,0.15)');
    root.style.setProperty('--text-primary',   '#18181b');
    root.style.setProperty('--text-secondary', '#52525b');
    root.style.setProperty('--text-muted',     '#a1a1aa');
    root.style.setProperty('--shadow-card',      '0 1px 8px rgba(0,0,0,0.08)');
    root.style.setProperty('--shadow-card-hover','0 6px 24px rgba(0,0,0,0.12)');
  }

  root.setAttribute('data-theme', mode);
  localStorage.setItem('theme-mode', mode);
}

// ---------- Provider ----------

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Restore accent
    const savedAccent = localStorage.getItem('accent-color');
    const savedSecondary = localStorage.getItem('accent-color-secondary');
    if (savedAccent) {
      applyAccent(savedAccent, savedSecondary ?? undefined);
    } else {
      // Default: green
      applyAccent('#16a34a', '#22c55e');
    }

    // Restore theme mode (default: light)
    const savedMode = (localStorage.getItem('theme-mode') || 'light') as ThemeMode;
    applyTheme(savedMode);
  }, []);

  return <>{children}</>;
}
