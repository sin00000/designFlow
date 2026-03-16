'use client';

import { useEffect } from 'react';

// ---------- Accent colors (for manual override in settings) ----------

export const ACCENT_COLORS = [
  { name: 'Indigo',  value: '#6366f1', secondary: '#8b5cf6' },
  { name: 'Violet',  value: '#8b5cf6', secondary: '#a855f7' },
  { name: 'Rose',    value: '#f43f5e', secondary: '#fb7185' },
  { name: 'Amber',   value: '#f59e0b', secondary: '#fbbf24' },
  { name: 'Emerald', value: '#10b981', secondary: '#34d399' },
  { name: 'Sky',     value: '#0ea5e9', secondary: '#38bdf8' },
  { name: 'Pink',    value: '#ec4899', secondary: '#f472b6' },
  { name: 'Orange',  value: '#f97316', secondary: '#fb923c' },
];

// ---------- Background families ----------

export interface BgFamily {
  id: string;
  name: string;
  hue: number;         // HSL hue (0-360)
  saturation: number;  // HSL saturation for dark bg (0-25)
  accent: string;      // auto accent hex
  accentSecondary: string;
  swatch: string;      // visible swatch color for UI (dark)
  swatchLight: string; // visible swatch color for UI (light)
}

export const BG_FAMILIES: BgFamily[] = [
  { id: 'neutral', name: 'Gray',   hue: 0,   saturation: 0,  accent: '#6366f1', accentSecondary: '#8b5cf6', swatch: '#323232', swatchLight: '#e8e8e8' },
  { id: 'warm',    name: 'Warm',   hue: 30,  saturation: 20, accent: '#f59e0b', accentSecondary: '#fb923c', swatch: '#332518', swatchLight: '#f5ede0' },
  { id: 'cool',    name: 'Cool',   hue: 215, saturation: 22, accent: '#0ea5e9', accentSecondary: '#38bdf8', swatch: '#152030', swatchLight: '#deeaf5' },
  { id: 'purple',  name: 'Purple', hue: 265, saturation: 20, accent: '#a855f7', accentSecondary: '#c084fc', swatch: '#1c1030', swatchLight: '#ece0f5' },
  { id: 'forest',  name: 'Forest', hue: 145, saturation: 18, accent: '#10b981', accentSecondary: '#34d399', swatch: '#102818', swatchLight: '#daf0e8' },
  { id: 'rose',    name: 'Rose',   hue: 345, saturation: 20, accent: '#f43f5e', accentSecondary: '#fb7185', swatch: '#2e1018', swatchLight: '#f5dde3' },
];

// Lightness % per brightness level
export const BG_BRIGHTNESS_LEVELS       = [3, 6, 9, 13, 18];    // dark  (1=darkest)
export const BG_LIGHT_BRIGHTNESS_LEVELS = [75, 80, 85, 89, 93]; // light (1=darkest light)

export type ThemeMode = 'dark' | 'light';

// ---------- Helpers ----------

export function hslToHex(h: number, s: number, l: number): string {
  const ls = l / 100;
  const ss = s / 100;
  const a = ss * Math.min(ls, 1 - ls);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = ls - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

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

export function applyBackground(familyId: string, brightness: number, mode: ThemeMode = 'dark') {
  const family = BG_FAMILIES.find((f) => f.id === familyId);
  if (!family) return;

  const levels = mode === 'light' ? BG_LIGHT_BRIGHTNESS_LEVELS : BG_BRIGHTNESS_LEVELS;
  const L = levels[brightness - 1] ?? levels[2];
  const { hue: h, saturation: s } = family;
  const clamp = (v: number) => Math.max(0, Math.min(100, v));
  const root = document.documentElement;

  if (mode === 'dark') {
    root.style.setProperty('--bg-primary',    hslToHex(h, s, L));
    root.style.setProperty('--bg-secondary',  hslToHex(h, s, L + 4));
    root.style.setProperty('--bg-tertiary',   hslToHex(h, s, L + 8));
    root.style.setProperty('--bg-overlay',    hslToHex(h, s, L + 12));
    root.style.setProperty('--border-default', hslToHex(h, s, L + 9));
    root.style.setProperty('--border-subtle', 'rgba(255,255,255,0.06)');
    root.style.setProperty('--border-strong', 'rgba(255,255,255,0.15)');
    root.style.setProperty('--text-primary',   '#ffffff');
    root.style.setProperty('--text-secondary', '#a1a1aa');
    root.style.setProperty('--text-muted',     '#71717a');
    root.style.setProperty('--shadow-card', '0 2px 12px rgba(0,0,0,0.35)');
    root.style.setProperty('--shadow-card-hover', '0 8px 32px rgba(0,0,0,0.55)');
  } else {
    const ls = Math.min(s, 12);
    root.style.setProperty('--bg-primary',    hslToHex(h, ls, L));
    root.style.setProperty('--bg-secondary',  hslToHex(h, ls, clamp(L + 4)));
    root.style.setProperty('--bg-tertiary',   hslToHex(h, ls, clamp(L + 7)));
    root.style.setProperty('--bg-overlay',    hslToHex(h, ls, 98));
    root.style.setProperty('--border-default', hslToHex(h, ls, clamp(L - 12)));
    root.style.setProperty('--border-subtle', 'rgba(0,0,0,0.07)');
    root.style.setProperty('--border-strong', 'rgba(0,0,0,0.18)');
    root.style.setProperty('--text-primary',   '#1a1a1a');
    root.style.setProperty('--text-secondary', '#52525b');
    root.style.setProperty('--text-muted',     '#a1a1aa');
    root.style.setProperty('--shadow-card', '0 2px 12px rgba(0,0,0,0.10)');
    root.style.setProperty('--shadow-card-hover', '0 8px 32px rgba(0,0,0,0.18)');
  }

  // Auto-set matching accent
  applyAccent(family.accent, family.accentSecondary);

  // Set data-theme attribute so CSS can target light/dark mode
  document.documentElement.setAttribute('data-theme', mode);

  localStorage.setItem('bg-family', familyId);
  localStorage.setItem('bg-brightness', String(brightness));
  localStorage.setItem('bg-mode', mode);
}

// ---------- Provider ----------

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const savedAccent = localStorage.getItem('accent-color');
    const savedSecondary = localStorage.getItem('accent-color-secondary');
    if (savedAccent) applyAccent(savedAccent, savedSecondary ?? undefined);

    const savedFamily = localStorage.getItem('bg-family');
    const savedBrightness = parseInt(localStorage.getItem('bg-brightness') || '3', 10);
    const savedMode = (localStorage.getItem('bg-mode') || 'dark') as ThemeMode;
    document.documentElement.setAttribute('data-theme', savedMode);
    if (savedFamily) applyBackground(savedFamily, savedBrightness, savedMode);
  }, []);

  return <>{children}</>;
}
