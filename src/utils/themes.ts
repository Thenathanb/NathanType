import { allThemes, getTheme } from '../data/themes/themes';
import { applyTheme as applyNTTheme } from './applyTheme';
import { applyFont as applyNTFont } from './applyFont';
import type { Theme } from '../types/index.js';

// ── Theme application ─────────────────────────────────────────────

export function applyTheme(themeId: string) {
  const theme = getTheme(themeId);
  if (theme) {
    applyNTTheme(theme);
  }
}

export function getThemeById(themeId: string) {
  return getTheme(themeId);
}

export function getAllThemes() {
  // Return in the old Theme shape so existing Settings.tsx keeps working
  return allThemes.map(t => ({
    id: t.id,
    name: t.name,
    bgPrimary: t.bg,
    bgSecondary: t.bg2,
    textPrimary: t.text,
    textSecondary: t.sub,
    accent: t.main,
    error: t.error,
    correct: t.text,
    caretColor: t.main,
  } as Theme));
}

// ── Font application ──────────────────────────────────────────────

export const FONTS: { id: string; label: string; stack: string }[] = [
  { id: 'Roboto Mono',     label: 'Roboto Mono',     stack: "'Roboto Mono', monospace" },
  { id: 'JetBrains Mono',  label: 'JetBrains Mono',  stack: "'JetBrains Mono', monospace" },
  { id: 'Fira Code',       label: 'Fira Code',        stack: "'Fira Code', monospace" },
  { id: 'Source Code Pro', label: 'Source Code Pro',  stack: "'Source Code Pro', monospace" },
  { id: 'IBM Plex Mono',   label: 'IBM Plex Mono',    stack: "'IBM Plex Mono', monospace" },
  { id: 'Inconsolata',     label: 'Inconsolata',      stack: "'Inconsolata', monospace" },
  { id: 'Space Mono',      label: 'Space Mono',       stack: "'Space Mono', monospace" },
  { id: 'Ubuntu Mono',     label: 'Ubuntu Mono',      stack: "'Ubuntu Mono', monospace" },
];

export function applyFont(fontId: string) {
  // Try new font system first (kebab-case IDs)
  applyNTFont(fontId);
  // Also handle old-style name IDs (e.g. 'Roboto Mono') for backward compat
  const old = FONTS.find(f => f.id === fontId);
  if (old) {
    document.documentElement.style.setProperty('--font-family', old.stack);
  }
}
